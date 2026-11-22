import { Brand, Product, Category } from '../models/index.js';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

const withCounts = async () => {
  const [brands, products] = await Promise.all([
    Brand.findAll({ order: [['name', 'ASC']] }),
    Product.findAll({ where: { isActive: true }, attributes: ['id', 'brandId', 'categoryId'], include: [{ model: Category, as: 'category', attributes: ['name'] }] }),
  ]);
  return brands.map((b) => {
    const mine = products.filter((p) => p.brandId === b.id);
    const cats = {};
    mine.forEach((p) => { const n = p.category?.name; if (n) cats[n] = (cats[n] || 0) + 1; });
    const main = Object.entries(cats).sort((a, c) => c[1] - a[1])[0]?.[0] || null;
    return { id: b.id, name: b.name, origin: b.origin, productCount: mine.length, mainCategory: main };
  });
};

export const getAllBrands = async (req, res, next) => {
  try {
    res.json({ success: true, data: await withCounts() });
  } catch (err) { next(err); }
};

export const createBrand = async (req, res, next) => {
  try {
    const name = clean(req.body.name);
    if (!name) return res.status(400).json({ success: false, message: 'Nama merek wajib diisi.' });
    if (await Brand.findOne({ where: { name } })) return res.status(409).json({ success: false, message: `Merek "${name}" sudah terdaftar.` });
    const brand = await Brand.create({ name, origin: clean(req.body.origin) || null });
    res.status(201).json({ success: true, data: brand });
  } catch (err) { next(err); }
};

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Merek tidak ditemukan.' });
    const name = clean(req.body.name ?? brand.name);
    if (!name) return res.status(400).json({ success: false, message: 'Nama merek wajib diisi.' });
    const dup = await Brand.findOne({ where: { name } });
    if (dup && dup.id !== brand.id) return res.status(409).json({ success: false, message: `Merek "${name}" sudah terdaftar.` });
    await brand.update({ name, origin: req.body.origin === undefined ? brand.origin : clean(req.body.origin) || null });
    res.json({ success: true, data: brand });
  } catch (err) { next(err); }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Merek tidak ditemukan.' });
    const used = await Product.count({ where: { brandId: brand.id } });
    if (used > 0) return res.status(409).json({ success: false, message: `Merek masih dipakai ${used} produk. Pindahkan produknya dulu.` });
    await brand.destroy();
    res.json({ success: true, message: 'Merek dihapus.' });
  } catch (err) { next(err); }
};
