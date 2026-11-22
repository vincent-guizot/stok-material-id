import { Op } from 'sequelize';
import { roundQty, roundRp, roundStock, calcTotals, settlePayments, pickUnitPrice } from '../utils/money.js';
import {
  sequelize,
  Setting,
  Transaction,
  TransactionItem,
  TransactionPayment,
  Product,
  ProductUnit,
  Customer,
  User,
  StockMovement,
  WholesalePrice,
} from '../models/index.js';

const VALID_METHODS = ['CASH', 'TRANSFER', 'QRIS', 'CARD', 'DEBT'];

// Tanggal nota mengikuti zona waktu toko (WIB), bukan UTC, agar nota jam 01.00 tidak bertanggal kemarin.
const jakartaDateStamp = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(d)
    .replace(/-/g, '');

const normalizeMethod = (raw) => {
  const m = (raw || 'CASH').toString().toUpperCase();
  return m === 'KASBON' ? 'DEBT' : m;
};

const fullTransaction = (id) =>
  Transaction.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: User, as: 'cashier', attributes: ['id', 'name', 'username'] },
      { model: TransactionItem, as: 'items' },
      { model: TransactionPayment, as: 'payments' },
    ],
  });

class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const checkout = async (req, res, next) => {
  const {
    customerId,
    items,
    discount = 0,
    discountPercent = 0,
    paymentMethod = 'CASH',
    payments = [],
    dueDate,
    notes,
    expectedTotal,
    idempotencyKey,
  } = req.body;
  // Harga grosir bertingkat aktif secara default; kasir dapat mematikannya (useWholesale: false)
  const useWholesale = req.body.useWholesale !== false;

  const key = idempotencyKey ? String(idempotencyKey).slice(0, 64) : null;

  try {
    // Anti-submit ganda: kunci yang sama mengembalikan nota yang sudah ada, bukan transaksi baru.
    if (key) {
      const existing = await Transaction.findOne({ where: { idempotencyKey: key } });
      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: 'Transaksi ini sudah tersimpan sebelumnya.',
          data: await fullTransaction(existing.id),
        });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja kosong. Harap pilih minimal 1 barang material.',
      });
    }

    const t = await sequelize.transaction();
    let transactionId;
    try {
      const cashierId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Kunci transaksi per hari agar nomor nota berurutan dan tidak bentrok antar-kasir.
      const dateStr = jakartaDateStamp();
      await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:k))', {
        replacements: { k: `invoice-${dateStr}` },
        transaction: t,
      });

      // Tarif PPN selalu dibaca dari Pengaturan di server.
      const setting = await Setting.findByPk('system_settings', { transaction: t });
      const taxRate = parseFloat(setting?.taxRate) || 0;
      // Pengaturan "Izinkan stok minus": bila 'yes', penjualan boleh melebihi stok tercatat.
      const allowMinusStock = String(setting?.allowMinusStock || 'no').toLowerCase() === 'yes';

      // 1. Validasi item. Produk dikunci (FOR UPDATE) berurutan per id agar tidak deadlock
      //    dan dua kasir tidak bisa menjual stok yang sama bersamaan.
      const productIds = [...new Set(items.map((i) => i.productId))].sort();
      const products = new Map();
      for (const pid of productIds) {
        const product = await Product.findByPk(pid, { transaction: t, lock: t.LOCK.UPDATE });
        if (!product) throw new CheckoutError(404, `Produk dengan ID ${pid} tidak ditemukan.`);
        products.set(pid, product);
      }

      const remainingBase = new Map(
        [...products.entries()].map(([pid, p]) => [pid, parseFloat(p.currentStockBase) || 0]),
      );

      const validatedItems = [];
      for (const item of items) {
        const product = products.get(item.productId);
        const unit = await ProductUnit.findByPk(item.unitId, { transaction: t });
        if (!unit || unit.productId !== product.id) {
          throw new CheckoutError(400, `Satuan tidak valid untuk produk "${product.name}".`);
        }

        const qty = roundQty(item.qty);
        if (!(qty > 0)) {
          throw new CheckoutError(400, `Jumlah qty untuk "${product.name}" harus lebih dari 0.`);
        }

        // Harga selalu dari server. Hanya admin yang boleh menimpa harga satuan.
        // Harga normal, atau harga grosir bertingkat bila qty memenuhi syarat (dihitung di server).
        const tiers = useWholesale ? await WholesalePrice.findAll({ where: { unitId: unit.id, isActive: true }, transaction: t }) : [];
        let unitPrice = pickUnitPrice(parseFloat(unit.sellPrice) || 0, tiers.map((x) => ({ minQty: x.minQty, price: x.price })), qty).price;
        if (isAdmin && item.unitPrice !== undefined && item.unitPrice !== null) {
          const override = parseFloat(item.unitPrice);
          if (!Number.isFinite(override) || override < 0) {
            throw new CheckoutError(400, `Harga satuan untuk "${product.name}" tidak valid.`);
          }
          unitPrice = override;
        }

        const conversionFactor = parseFloat(unit.conversionFactor);
        if (!(conversionFactor > 0)) {
          throw new CheckoutError(400, `Faktor konversi satuan "${unit.unitName}" tidak valid.`);
        }
        const qtyBaseUnit = roundStock(qty * conversionFactor);

        // Stok dicek KUMULATIF: produk yang sama di dua baris (satuan berbeda) tidak boleh lolos dua kali.
        const left = remainingBase.get(product.id);
        if (!allowMinusStock && left < qtyBaseUnit) {
          throw new CheckoutError(
            400,
            `Stok "${product.name}" tidak mencukupi! Tersedia: ${roundStock(left)} ${product.baseUnit}, tetapi kasir meminta: ${qty} ${unit.unitName} (= ${qtyBaseUnit} ${product.baseUnit}).`,
          );
        }
        remainingBase.set(product.id, roundStock(left - qtyBaseUnit));

        validatedItems.push({ product, unit, qty, conversionFactor, qtyBaseUnit, unitPrice, unitCost: parseFloat(unit.buyPrice) || 0 });
      }

      // 2. Semua angka uang dihitung di sini (satu-satunya sumber kebenaran).
      const totals = calcTotals({
        items: validatedItems.map((v) => ({ qty: v.qty, unitPrice: v.unitPrice })),
        discountPercent: parseFloat(discountPercent) || 0,
        discountAmount: parseFloat(discount) || 0,
        taxRate,
      });
      validatedItems.forEach((v, i) => {
        v.subtotal = totals.lineSubtotals[i];
      });

      if (expectedTotal !== undefined && expectedTotal !== null) {
        const expected = roundRp(expectedTotal);
        if (expected !== totals.total) {
          throw new CheckoutError(
            409,
            `Total di layar (Rp ${expected.toLocaleString('id-ID')}) berbeda dengan hitungan server (Rp ${totals.total.toLocaleString('id-ID')}). Muat ulang halaman lalu coba lagi.`,
          );
        }
      }

      // 3. Pembayaran: tunai/transfer/QRIS/kartu/kasbon, termasuk split payment.
      let paymentInputs;
      if (Array.isArray(payments) && payments.length > 0) {
        paymentInputs = payments.map((p) => ({
          method: normalizeMethod(p.method || p.paymentMethod),
          amount: parseFloat(p.amount) || 0,
          referenceNo: p.referenceNo || p.referenceNumber || null,
        }));
      } else {
        paymentInputs = [{ method: normalizeMethod(paymentMethod), amount: totals.total, referenceNo: null }];
      }
      for (const p of paymentInputs) {
        if (!VALID_METHODS.includes(p.method)) {
          throw new CheckoutError(400, `Metode pembayaran "${p.method}" tidak dikenal.`);
        }
        if (p.amount < 0) throw new CheckoutError(400, 'Nominal pembayaran tidak boleh negatif.');
      }

      const settled = settlePayments(totals.total, paymentInputs);
      if (!settled.ok) throw new CheckoutError(400, settled.error);
      const { paid: paidAmount, debt: debtAmount, change: changeAmount, cashReceived } = settled;

      // 4. Validasi plafon kasbon (pelanggan dikunci agar saldo hutang tidak tertimpa).
      let customer = null;
      if (debtAmount > 0) {
        if (!customerId) {
          throw new CheckoutError(400, 'Transaksi Kasbon / Tempo wajib memilih nama Mandor / Pelanggan!');
        }
        customer = await Customer.findByPk(customerId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!customer) throw new CheckoutError(404, 'Pelanggan / Mandor tidak ditemukan.');

        const currentDebt = parseFloat(customer.currentDebt) || 0;
        const creditLimit = parseFloat(customer.creditLimit) || 0;
        const newDebtTotal = currentDebt + debtAmount;
        if (creditLimit > 0 && newDebtTotal > creditLimit) {
          throw new CheckoutError(
            400,
            `Plafon hutang "${customer.name}" terlampaui! Limit: Rp ${creditLimit.toLocaleString('id-ID')}, Hutang saat ini: Rp ${currentDebt.toLocaleString('id-ID')}, Tambahan bon baru: Rp ${debtAmount.toLocaleString('id-ID')}. Total menjadi Rp ${newDebtTotal.toLocaleString('id-ID')}.`,
          );
        }
      }

      let paymentStatus = 'PAID';
      if (debtAmount > 0) paymentStatus = paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

      // 5. Nomor nota berurutan per hari: INV-YYYYMMDD-0001
      const prefix = `INV-${dateStr}-`;
      const todayCount = await Transaction.count({
        where: { invoiceNumber: { [Op.like]: `${prefix}%` } },
        transaction: t,
      });
      const invoiceNumber = `${prefix}${String(todayCount + 1).padStart(4, '0')}`;

      const transaction = await Transaction.create(
        {
          invoiceNumber,
          customerId: customerId || null,
          cashierId,
          subtotal: totals.subtotal,
          discount: totals.discount,
          taxRate: totals.taxRate,
          taxAmount: totals.taxAmount,
          totalAmount: totals.total,
          paidAmount,
          debtAmount,
          cashReceived,
          changeAmount,
          paymentStatus,
          idempotencyKey: key,
          dueDate:
            dueDate ||
            (debtAmount > 0 && customer
              ? new Date(Date.now() + (customer.termDays || 14) * 86400000)
              : null),
          notes: notes || null,
        },
        { transaction: t },
      );
      transactionId = transaction.id;

      // 6. Rincian item, potong stok (nilai mutlak dari stok yang sudah dikunci), catat mutasi.
      for (const v of validatedItems) {
        await TransactionItem.create(
          {
            transactionId: transaction.id,
            productId: v.product.id,
            unitId: v.unit.id,
            productName: v.product.name,
            unitName: v.unit.unitName,
            qty: v.qty,
            conversionFactor: v.conversionFactor,
            qtyBaseUnit: v.qtyBaseUnit,
            unitPrice: v.unitPrice,
            unitCost: v.unitCost,
            subtotal: v.subtotal,
          },
          { transaction: t },
        );

        const prevStock = parseFloat(v.product.currentStockBase) || 0;
        const newStock = roundStock(prevStock - v.qtyBaseUnit);
        await v.product.update({ currentStockBase: newStock }, { transaction: t });

        await StockMovement.create(
          {
            productId: v.product.id,
            type: 'SALE',
            qtyBaseUnit: -v.qtyBaseUnit,
            previousStock: prevStock,
            newStock,
            notes: `Penjualan Nota ${invoiceNumber} (${v.qty} ${v.unit.unitName})`,
            createdBy: cashierId,
          },
          { transaction: t },
        );
      }

      // 7. Catatan pembayaran: nominal yang benar-benar dipakai (tunai sudah dikurangi kembalian).
      const records = [];
      for (const p of paymentInputs) {
        if (p.amount > 0 && p.method !== 'CASH') records.push({ ...p, amount: roundRp(p.amount) });
      }
      if (settled.cashApplied > 0) {
        records.push({ method: 'CASH', amount: settled.cashApplied, referenceNo: null });
      }
      for (const r of records) {
        await TransactionPayment.create(
          {
            transactionId: transaction.id,
            paymentMethod: r.method,
            amount: r.amount,
            referenceNo: r.referenceNo || null,
          },
          { transaction: t },
        );
      }

      // 8. Tambah hutang pelanggan
      if (debtAmount > 0 && customer) {
        const updatedDebt = (parseFloat(customer.currentDebt) || 0) + debtAmount;
        await customer.update({ currentDebt: updatedDebt }, { transaction: t });
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan dan stok otomatis diperbarui!',
      data: await fullTransaction(transactionId),
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    // Dua permintaan dengan kunci yang sama bersamaan: yang kalah mengembalikan nota pemenang.
    if (key && err.name === 'SequelizeUniqueConstraintError') {
      const existing = await Transaction.findOne({ where: { idempotencyKey: key } });
      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: 'Transaksi ini sudah tersimpan sebelumnya.',
          data: await fullTransaction(existing.id),
        });
      }
    }
    next(err);
  }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const { limit = 20, status, customerId } = req.query;
    const where = {};
    if (status) {
      where.paymentStatus = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const transactions = await Transaction.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: TransactionItem, as: 'items' },
        { model: TransactionPayment, as: 'payments' },
      ],
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
        { model: TransactionItem, as: 'items' },
        { model: TransactionPayment, as: 'payments' },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Nota transaksi tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
};
