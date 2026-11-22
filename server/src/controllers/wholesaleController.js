import { WholesalePrice, Product, ProductUnit } from '../models/index.js';

const bad = (res, status, message) => res.status(status).json({ success: false, message });
const include = [
  { model: Product, as: 'product', attributes: ['id', 'sku', 'name'] },
  { model: ProductUnit, as: 'unit', attributes: ['id', 'unitName', 'sellPrice'] },
];

export const listWholesale = async (req, res, next) => {
  try {
    res.json({ success: true, data: await WholesalePrice.findAll({ include, order: [['createdAt', 'ASC']] }) });
  } catch (err) { next(err); }
};

async function validate(body, existing) {
  const unitId = body.unitId ?? existing?.unitId;
  const unit = unitId ? await ProductUnit.findByPk(unitId) : null;
  if (!unit) return { error: 'Satuan produk tidak ditemukan.' };
  const minQty = Number(body.minQty ?? existing?.minQty);
  const price = Number(body.price ?? existing?.price);
  const label = String(body.label ?? existing?.label ?? '').trim();
  if (!label) return { error: 'Nama aturan wajib diisi.' };
  if (!(minQty > 0)) return { error: 'Jumlah minimal harus lebih dari 0.' };
  if (!(price >= 0)) return { error: 'Harga grosir tidak valid.' };
  if (price >= parseFloat(unit.sellPrice)) return { error: `Harga grosir harus lebih murah dari harga normal (Rp ${parseFloat(unit.sellPrice).toLocaleString('id-ID')}).` };
  return { value: { unitId: unit.id, productId: unit.productId, label, minQty, price, target: body.target ?? existing?.target ?? null } };
}

export const createWholesale = async (req, res, next) => {
  try {
    const v = await validate(req.body);
    if (v.error) return bad(res, 400, v.error);
    const row = await WholesalePrice.create(v.value);
    res.status(201).json({ success: true, message: 'Aturan harga grosir ditambahkan.', data: await WholesalePrice.findByPk(row.id, { include }) });
  } catch (err) { next(err); }
};

export const updateWholesale = async (req, res, next) => {
  try {
    const row = await WholesalePrice.findByPk(req.params.id);
    if (!row) return bad(res, 404, 'Aturan tidak ditemukan.');
    const v = await validate(req.body, row);
    if (v.error) return bad(res, 400, v.error);
    await row.update({ ...v.value, ...(req.body.isActive !== undefined && { isActive: !!req.body.isActive }) });
    res.json({ success: true, message: 'Aturan diperbarui.', data: await WholesalePrice.findByPk(row.id, { include }) });
  } catch (err) { next(err); }
};

export const deleteWholesale = async (req, res, next) => {
  try {
    const row = await WholesalePrice.findByPk(req.params.id);
    if (!row) return bad(res, 404, 'Aturan tidak ditemukan.');
    await row.destroy();
    res.json({ success: true, message: 'Aturan dihapus.' });
  } catch (err) { next(err); }
};
