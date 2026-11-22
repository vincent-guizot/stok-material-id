import { Op } from 'sequelize';
import { sequelize, Product, ProductUnit, StockMovement, Setting, User } from '../models/index.js';
import { roundStock } from '../utils/money.js';
import { nextDocNumber, jakartaDate } from '../utils/docNumber.js';

class StockError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (res, e) => res.status(e.status || 500).json({ success: false, message: e.message });

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

// Ambil produk (dikunci) + satuan yang dipakai pengguna.
async function loadProductUnit(t, productId, unitId) {
  const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!product) throw new StockError(404, 'Produk material tidak ditemukan.');
  let factor = 1;
  let unitName = product.baseUnit;
  if (unitId) {
    const unit = await ProductUnit.findByPk(unitId, { transaction: t });
    if (!unit || unit.productId !== product.id) throw new StockError(400, `Satuan tidak valid untuk produk "${product.name}".`);
    factor = parseFloat(unit.conversionFactor) || 1;
    unitName = unit.unitName;
  }
  return { product, factor, unitName };
}

const withTx = (fn) => async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const out = await fn(req, t);
    await t.commit();
    res.status(out.status || 201).json({ success: true, message: out.message, data: out.data });
  } catch (err) {
    await t.rollback();
    if (err instanceof StockError) return fail(res, err);
    next(err);
  }
};

// Barang masuk tanpa dokumen pembelian (mis. koreksi). Pembelian dari supplier memakai POST /purchases.
export const addStock = withTx(async (req, t) => {
  const { productId, unitId, qty, notes } = req.body;
  const q = num(qty);
  if (!productId || !(q > 0)) throw new StockError(400, 'Produk dan kuantitas barang masuk wajib diisi (lebih dari 0).');
  const { product, factor, unitName } = await loadProductUnit(t, productId, unitId);
  const added = roundStock(q * factor);
  const prev = parseFloat(product.currentStockBase) || 0;
  const next = roundStock(prev + added);
  await product.update({ currentStockBase: next }, { transaction: t });
  const movement = await StockMovement.create(
    {
      productId: product.id, type: 'IN', qtyBaseUnit: added, previousStock: prev, newStock: next,
      unitName, qtyInput: q, notes: notes || `Penerimaan barang masuk: ${q} ${unitName}`, createdBy: req.user?.id || null,
    },
    { transaction: t },
  );
  return {
    message: `Stok "${product.name}" bertambah ${q} ${unitName} (+${added} ${product.baseUnit}). Stok baru: ${next} ${product.baseUnit}.`,
    data: { product, movement },
  };
});

export const outStock = withTx(async (req, t) => {
  const { productId, unitId, qty, destination, receiver, driver, notes } = req.body;
  const q = num(qty);
  if (!productId || !(q > 0)) throw new StockError(400, 'Produk dan kuantitas barang keluar wajib diisi (lebih dari 0).');
  const { product, factor, unitName } = await loadProductUnit(t, productId, unitId);
  const out = roundStock(q * factor);
  const prev = parseFloat(product.currentStockBase) || 0;
  const setting = await Setting.findByPk('system_settings', { transaction: t });
  const allowMinus = String(setting?.allowMinusStock || 'no').toLowerCase() === 'yes';
  if (!allowMinus && out > prev) {
    throw new StockError(400, `Stok "${product.name}" tidak mencukupi. Tersedia ${prev} ${product.baseUnit}, diminta ${out} ${product.baseUnit}.`);
  }
  const next = roundStock(prev - out);
  await product.update({ currentStockBase: next }, { transaction: t });
  const refNo = await nextDocNumber(sequelize, t, { prefix: 'DO', model: StockMovement, field: 'refNo' });
  const movement = await StockMovement.create(
    {
      productId: product.id, type: 'OUT', qtyBaseUnit: -out, previousStock: prev, newStock: next, refNo,
      destination: destination || null, receiver: receiver || null, driver: driver || null,
      unitName, qtyInput: q, notes: notes || null, createdBy: req.user?.id || null,
    },
    { transaction: t },
  );
  return {
    message: `Surat jalan ${refNo} dicatat. Sisa stok "${product.name}": ${next} ${product.baseUnit}.`,
    data: { product, movement },
  };
});

export const transferStock = withTx(async (req, t) => {
  const { productId, unitId, qty, fromLocation, toLocation, notes } = req.body;
  const q = num(qty);
  if (!productId || !(q > 0)) throw new StockError(400, 'Produk dan kuantitas mutasi wajib diisi (lebih dari 0).');
  if (!fromLocation || !toLocation) throw new StockError(400, 'Lokasi asal dan lokasi tujuan wajib diisi.');
  if (String(fromLocation).trim() === String(toLocation).trim()) throw new StockError(400, 'Lokasi asal dan tujuan tidak boleh sama.');
  const { product, factor, unitName } = await loadProductUnit(t, productId, unitId);
  const moved = roundStock(q * factor);
  const stock = parseFloat(product.currentStockBase) || 0;
  if (moved > stock) throw new StockError(400, `Jumlah mutasi (${moved} ${product.baseUnit}) melebihi stok tersedia (${stock} ${product.baseUnit}).`);
  await product.update({ location: String(toLocation).trim() }, { transaction: t });
  const refNo = await nextDocNumber(sequelize, t, { prefix: 'MUT', model: StockMovement, field: 'refNo' });
  const movement = await StockMovement.create(
    {
      productId: product.id, type: 'TRANSFER', qtyBaseUnit: moved, previousStock: stock, newStock: stock, refNo,
      fromLocation: String(fromLocation).trim(), toLocation: String(toLocation).trim(), unitName, qtyInput: q,
      notes: notes || null, createdBy: req.user?.id || null,
    },
    { transaction: t },
  );
  return { message: `Mutasi ${refNo} dicatat. Total stok tidak berubah.`, data: { product, movement } };
});

export const adjustStock = withTx(async (req, t) => {
  const { productId, actualBaseQty, reason } = req.body;
  const target = num(actualBaseQty);
  if (!productId || !Number.isFinite(target)) throw new StockError(400, 'Produk dan stok fisik riil (satuan dasar) wajib diisi.');
  if (target < 0) throw new StockError(400, 'Stok fisik tidak boleh negatif.');
  if (!reason || !String(reason).trim()) throw new StockError(400, 'Alasan penyesuaian wajib diisi.');
  const { product } = await loadProductUnit(t, productId);
  const prev = parseFloat(product.currentStockBase) || 0;
  const next = roundStock(target);
  const diff = roundStock(next - prev);
  await product.update({ currentStockBase: next }, { transaction: t });
  const movement = await StockMovement.create(
    {
      productId: product.id, type: 'ADJUSTMENT', qtyBaseUnit: diff, previousStock: prev, newStock: next,
      reason: String(reason).trim(), notes: null, createdBy: req.user?.id || null,
    },
    { transaction: t },
  );
  return { status: 200, message: `Stok "${product.name}" disesuaikan menjadi ${next} ${product.baseUnit}.`, data: { product, movement } };
});

// Stok opname: beberapa produk sekaligus. Hanya produk yang selisih yang dicatat & disesuaikan.
export const opnameStock = withTx(async (req, t) => {
  const { items, notes } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new StockError(400, 'Minimal satu produk hasil hitung fisik.');
  const ids = [...new Set(items.map((i) => i.productId))].sort();
  if (ids.length !== items.length) throw new StockError(400, 'Produk tidak boleh dobel dalam satu opname.');
  const refNo = await nextDocNumber(sequelize, t, { prefix: 'OPN', model: StockMovement, field: 'refNo' });
  const byId = new Map(items.map((i) => [i.productId, i]));
  const results = [];
  for (const id of ids) {
    const physical = num(byId.get(id).physicalQty);
    if (!Number.isFinite(physical) || physical < 0) throw new StockError(400, 'Hasil hitung fisik harus angka 0 atau lebih.');
    const product = await Product.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!product) throw new StockError(404, 'Produk tidak ditemukan.');
    const prev = parseFloat(product.currentStockBase) || 0;
    const next = roundStock(physical);
    const diff = roundStock(next - prev);
    if (diff !== 0) {
      await product.update({ currentStockBase: next }, { transaction: t });
      await StockMovement.create(
        {
          productId: product.id, type: 'OPNAME', qtyBaseUnit: diff, previousStock: prev, newStock: next, refNo,
          reason: notes || 'Stok opname', createdBy: req.user?.id || null,
        },
        { transaction: t },
      );
    }
    results.push({ productId: id, name: product.name, before: prev, physical: next, difference: diff });
  }
  const adjusted = results.filter((r) => r.difference !== 0).length;
  return { message: `Opname ${refNo}: ${results.length} produk dihitung, ${adjusted} selisih disesuaikan.`, data: { refNo, checked: results.length, adjusted, results } };
});

export const getMovements = async (req, res, next) => {
  try {
    const { productId, type, from, to } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = { [Op.in]: String(type).split(',') };
    if (/^\d{4}-\d{2}-\d{2}$/.test(from || '')) where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(`${from}T00:00:00+07:00`) };
    if (/^\d{4}-\d{2}-\d{2}$/.test(to || '')) where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(`${to}T23:59:59.999+07:00`) };

    const rows = await StockMovement.findAll({
      where, limit, order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'sku', 'name', 'baseUnit'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });
    res.json({ success: true, data: rows, meta: { count: rows.length, limit, today: jakartaDate() } });
  } catch (err) {
    next(err);
  }
};
