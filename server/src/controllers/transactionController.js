import {
  sequelize,
  Transaction,
  TransactionItem,
  TransactionPayment,
  Product,
  ProductUnit,
  Customer,
  User,
  StockMovement,
} from '../models/index.js';

export const checkout = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      customerId,
      items,
      discount = 0,
      discountPercent = 0,
      paymentMethod = 'CASH',
      payments = [],
      dueDate,
      notes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja kosong. Harap pilih minimal 1 barang material.',
      });
    }

    const cashierId = req.user.id;
    let calculatedSubtotal = 0;
    const validatedItems = [];

    // 1. Validasi stok setiap item berdasarkan satuan yang dipilih
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Produk dengan ID ${item.productId} tidak ditemukan.`,
        });
      }

      const unit = await ProductUnit.findByPk(item.unitId, { transaction: t });
      if (!unit || unit.productId !== product.id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Satuan tidak valid untuk produk "${product.name}".`,
        });
      }

      const qty = parseFloat(item.qty);
      if (isNaN(qty) || qty <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Jumlah qty untuk "${product.name}" harus lebih dari 0.`,
        });
      }

      const unitPrice = parseFloat(item.unitPrice !== undefined ? item.unitPrice : unit.sellPrice);
      const conversionFactor = parseFloat(unit.conversionFactor);
      const qtyBaseUnit = qty * conversionFactor;
      const subtotal = qty * unitPrice;

      // Cek apakah stok riil mencukupi
      if (product.currentStockBase < qtyBaseUnit) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok "${product.name}" tidak mencukupi! Tersedia: ${product.currentStockBase} ${product.baseUnit}, tetapi kasir meminta: ${qty} ${unit.unitName} (= ${qtyBaseUnit} ${product.baseUnit}).`,
        });
      }

      calculatedSubtotal += subtotal;
      validatedItems.push({
        product,
        unit,
        qty,
        conversionFactor,
        qtyBaseUnit,
        unitPrice,
        subtotal,
      });
    }

    const pct = parseFloat(discountPercent) || 0;
    const directDiscount = parseFloat(discount) || 0;
    const computedDiscount = pct > 0 ? (calculatedSubtotal * (pct / 100)) : directDiscount;
    const numDiscount = Math.max(0, computedDiscount);
    const totalAmount = Math.max(0, calculatedSubtotal - numDiscount);

    // 2. Kalkulasi pembayaran & porsi Kasbon / Piutang
    let paidAmount = 0;
    let debtAmount = 0;
    const paymentRecords = [];

    if (Array.isArray(payments) && payments.length > 0) {
      for (const p of payments) {
        const amt = parseFloat(p.amount) || 0;
        if (amt > 0) {
          const rawMethod = (p.method || p.paymentMethod || 'CASH').toString().toUpperCase();
          const normalizedMethod = rawMethod === 'KASBON' ? 'DEBT' : rawMethod;
          if (normalizedMethod === 'DEBT') {
            debtAmount += amt;
          } else {
            paidAmount += amt;
          }
          paymentRecords.push({
            paymentMethod: normalizedMethod,
            amount: amt,
            referenceNo: p.referenceNo || p.referenceNumber || null,
          });
        }
      }
    } else {
      // Pembayaran tunggal standar
      const rawMethod = (paymentMethod || 'CASH').toString().toUpperCase();
      const normalizedMethod = rawMethod === 'KASBON' ? 'DEBT' : rawMethod;
      if (normalizedMethod === 'DEBT') {
        debtAmount = totalAmount;
        paymentRecords.push({ paymentMethod: 'DEBT', amount: totalAmount });
      } else {
        paidAmount = totalAmount;
        paymentRecords.push({ paymentMethod: normalizedMethod, amount: totalAmount });
      }
    }

    // 3. Validasi limit kasbon pelanggan jika ada porsi bon/tempo
    let customer = null;
    if (debtAmount > 0) {
      if (!customerId) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Transaksi Kasbon / Tempo wajib memilih nama Mandor / Pelanggan!',
        });
      }

      customer = await Customer.findByPk(customerId, { transaction: t });
      if (!customer) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Pelanggan / Mandor tidak ditemukan.',
        });
      }

      const currentDebt = parseFloat(customer.currentDebt) || 0;
      const creditLimit = parseFloat(customer.creditLimit) || 0;
      const newDebtTotal = currentDebt + debtAmount;

      if (creditLimit > 0 && newDebtTotal > creditLimit) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Plafon hutang "${customer.name}" terlampaui! Limit: Rp ${creditLimit.toLocaleString('id-ID')}, Hutang saat ini: Rp ${currentDebt.toLocaleString('id-ID')}, Tambahan bon baru: Rp ${debtAmount.toLocaleString('id-ID')}. Total menjadi Rp ${newDebtTotal.toLocaleString('id-ID')}.`,
        });
      }
    }

    // Status Pembayaran
    let paymentStatus = 'PAID';
    if (debtAmount >= totalAmount) {
      paymentStatus = 'UNPAID';
    } else if (debtAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    // Generate Invoice Number: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // 4. Simpan Transaksi Penjualan
    const transaction = await Transaction.create({
      invoiceNumber,
      customerId: customerId || null,
      cashierId,
      subtotal: calculatedSubtotal,
      discount: numDiscount,
      totalAmount,
      paidAmount,
      debtAmount,
      paymentStatus,
      dueDate: dueDate || (debtAmount > 0 && customer ? new Date(Date.now() + (customer.termDays || 14) * 86400000) : null),
      notes: notes || null,
    }, { transaction: t });

    // 5. Simpan Rincian Item & Potong Stok Produk
    for (const vItem of validatedItems) {
      await TransactionItem.create({
        transactionId: transaction.id,
        productId: vItem.product.id,
        unitId: vItem.unit.id,
        productName: vItem.product.name,
        unitName: vItem.unit.unitName,
        qty: vItem.qty,
        conversionFactor: vItem.conversionFactor,
        qtyBaseUnit: vItem.qtyBaseUnit,
        unitPrice: vItem.unitPrice,
        subtotal: vItem.subtotal,
      }, { transaction: t });

      // Potong stok absolut
      const prevStock = vItem.product.currentStockBase;
      const newStock = prevStock - vItem.qtyBaseUnit;

      await vItem.product.update({ currentStockBase: newStock }, { transaction: t });

      // Catat mutasi stok
      await StockMovement.create({
        productId: vItem.product.id,
        type: 'SALE',
        qtyBaseUnit: -vItem.qtyBaseUnit,
        previousStock: prevStock,
        newStock: newStock,
        notes: `Penjualan Nota ${invoiceNumber} (${vItem.qty} ${vItem.unit.unitName})`,
        createdBy: cashierId,
      }, { transaction: t });
    }

    // 6. Simpan Catatan Pembayaran
    for (const pRec of paymentRecords) {
      await TransactionPayment.create({
        transactionId: transaction.id,
        paymentMethod: pRec.paymentMethod,
        amount: pRec.amount,
        referenceNo: pRec.referenceNo || null,
      }, { transaction: t });
    }

    // 7. Update Hutang Pelanggan jika ada Kasbon
    if (debtAmount > 0 && customer) {
      const updatedDebt = (parseFloat(customer.currentDebt) || 0) + debtAmount;
      await customer.update({ currentDebt: updatedDebt }, { transaction: t });
    }

    await t.commit();

    // Query hasil lengkap untuk respon cetak struk kasir & faktur jalan
    const completeTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'cashier', attributes: ['id', 'name', 'username'] },
        { model: TransactionItem, as: 'items' },
        { model: TransactionPayment, as: 'payments' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan dan stok otomatis diperbarui!',
      data: completeTransaction,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const { limit = 20, status } = req.query;
    const where = {};
    if (status) {
      where.paymentStatus = status;
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
