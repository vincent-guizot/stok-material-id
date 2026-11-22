import { Op } from 'sequelize';
import { sequelize, Purchase, PurchaseItem, Supplier, Product, ProductUnit, StockMovement, User } from '../models/index.js';
import { roundRp, roundStock } from '../utils/money.js';
import { nextDocNumber, jakartaDate } from '../utils/docNumber.js';

class PurchaseError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return jakartaDate(d);
};

const include = [
  { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
  { model: PurchaseItem, as: 'items' },
  { model: User, as: 'creator', attributes: ['id', 'name'] },
];

/**
 * Pembelian / barang masuk dari supplier. Stok bertambah, HPP (harga modal) satuan diperbarui ke
 * harga beli terbaru, dan semua satuan produk yang sama ikut diselaraskan lewat satuan dasar.
 */
export const createPurchase = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { supplierId, items, notes } = req.body;
    const paid = req.body.paid !== false && req.body.paid !== 'false';
    const purchaseDate = isDate(req.body.purchaseDate) ? req.body.purchaseDate : jakartaDate();
    if (purchaseDate > jakartaDate()) throw new PurchaseError(400, 'Tanggal pembelian tidak boleh di masa depan.');
    if (!Array.isArray(items) || items.length === 0) throw new PurchaseError(400, 'Minimal satu barang pada pembelian.');

    const supplier = supplierId ? await Supplier.findByPk(supplierId, { transaction: t }) : null;
    if (!supplier) throw new PurchaseError(400, 'Supplier wajib dipilih.');

    const ids = [...new Set(items.map((i) => i.productId))].sort();
    const products = new Map();
    for (const id of ids) {
      const p = await Product.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!p) throw new PurchaseError(404, 'Produk tidak ditemukan.');
      products.set(id, p);
    }

    const number = await nextDocNumber(sequelize, t, { prefix: 'PO', model: Purchase, field: 'number', date: purchaseDate });
    const lines = [];
    let total = 0;
    for (const it of items) {
      const product = products.get(it.productId);
      const unit = await ProductUnit.findByPk(it.unitId, { transaction: t });
      if (!unit || unit.productId !== product.id) throw new PurchaseError(400, `Satuan tidak valid untuk "${product.name}".`);
      const qty = Number(it.qty);
      const cost = Number(it.unitCost);
      if (!(qty > 0)) throw new PurchaseError(400, `Jumlah "${product.name}" harus lebih dari 0.`);
      if (!Number.isFinite(cost) || cost < 0) throw new PurchaseError(400, `Harga beli "${product.name}" tidak valid.`);
      const factor = parseFloat(unit.conversionFactor) || 1;
      const subtotal = roundRp(qty * cost);
      total += subtotal;
      lines.push({ product, unit, qty, cost, factor, subtotal, base: roundStock(qty * factor) });
    }

    const termDays = parseInt(String(supplier.paymentTerms || '').match(/\d+/)?.[0] || '0', 10);
    const purchase = await Purchase.create(
      {
        number, supplierId: supplier.id, purchaseDate,
        paymentTerm: supplier.paymentTerms || null,
        dueDate: paid ? null : addDays(purchaseDate, termDays),
        status: 'Diterima Lengkap',
        paymentStatus: paid ? 'LUNAS' : 'BELUM_LUNAS',
        totalAmount: total, paidAmount: paid ? total : 0, paidAt: paid ? purchaseDate : null,
        notes: notes || null, createdBy: req.user?.id || null,
      },
      { transaction: t },
    );

    for (const l of lines) {
      await PurchaseItem.create(
        {
          purchaseId: purchase.id, productId: l.product.id, unitId: l.unit.id, productName: l.product.name,
          unitName: l.unit.unitName, qty: l.qty, conversionFactor: l.factor, qtyBaseUnit: l.base,
          unitCost: l.cost, subtotal: l.subtotal,
        },
        { transaction: t },
      );
      const prev = parseFloat(l.product.currentStockBase) || 0;
      const next = roundStock(prev + l.base);
      await l.product.update({ currentStockBase: next }, { transaction: t });
      l.product.currentStockBase = next;
      await StockMovement.create(
        {
          productId: l.product.id, type: 'IN', qtyBaseUnit: l.base, previousStock: prev, newStock: next, refNo: number,
          unitName: l.unit.unitName, qtyInput: l.qty, notes: `Pembelian ${supplier.name}`, createdBy: req.user?.id || null,
        },
        { transaction: t },
      );
      // HPP terbaru: modal per satuan dasar = harga beli / faktor; semua satuan produk disesuaikan.
      const costPerBase = l.cost / l.factor;
      const siblings = await ProductUnit.findAll({ where: { productId: l.product.id }, transaction: t });
      for (const u of siblings) {
        await u.update({ buyPrice: roundRp(costPerBase * (parseFloat(u.conversionFactor) || 1)) }, { transaction: t });
      }
    }

    await t.commit();
    const created = await Purchase.findByPk(purchase.id, { include });
    res.status(201).json({ success: true, message: `Pembelian ${number} tersimpan dan stok bertambah.`, data: created });
  } catch (err) {
    await t.rollback();
    if (err instanceof PurchaseError) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

export const listPurchases = async (req, res, next) => {
  try {
    const { supplierId, from, to, paymentStatus } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const where = {};
    if (supplierId) where.supplierId = supplierId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (isDate(from)) where.purchaseDate = { ...(where.purchaseDate || {}), [Op.gte]: from };
    if (isDate(to)) where.purchaseDate = { ...(where.purchaseDate || {}), [Op.lte]: to };
    const rows = await Purchase.findAll({ where, include, limit, order: [['purchaseDate', 'DESC'], ['number', 'DESC']] });
    res.json({ success: true, data: rows, meta: { count: rows.length, limit } });
  } catch (err) {
    next(err);
  }
};

export const getPurchase = async (req, res, next) => {
  try {
    const row = await Purchase.findByPk(req.params.id, { include });
    if (!row) return res.status(404).json({ success: false, message: 'Pembelian tidak ditemukan.' });
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

// Pelunasan hutang supplier (kas keluar dicatat pada tanggal pelunasan).
export const payPurchase = async (req, res, next) => {
  try {
    const row = await Purchase.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Pembelian tidak ditemukan.' });
    if (row.paymentStatus === 'LUNAS') return res.status(409).json({ success: false, message: 'Pembelian ini sudah lunas.' });
    await row.update({ paymentStatus: 'LUNAS', paidAmount: row.totalAmount, paidAt: jakartaDate() });
    res.json({ success: true, message: `Pembelian ${row.number} ditandai lunas.`, data: await Purchase.findByPk(row.id, { include }) });
  } catch (err) {
    next(err);
  }
};
