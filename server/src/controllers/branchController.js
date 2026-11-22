import { Branch } from '../models/index.js';

const bad = (res, status, message) => res.status(status).json({ success: false, message });
const STATUSES = ['Aktif', 'Dalam Persiapan', 'Nonaktif'];

export const listBranches = async (req, res, next) => {
  try {
    res.json({ success: true, data: await Branch.findAll({ order: [['isMain', 'DESC'], ['createdAt', 'ASC']] }) });
  } catch (err) { next(err); }
};

export const createBranch = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return bad(res, 400, 'Nama cabang wajib diisi.');
    const status = req.body.status || 'Aktif';
    if (!STATUSES.includes(status)) return bad(res, 400, `Status harus salah satu dari: ${STATUSES.join(', ')}.`);
    const row = await Branch.create({ name, address: req.body.address || null, type: req.body.type || null, status });
    res.status(201).json({ success: true, message: 'Cabang ditambahkan.', data: row });
  } catch (err) { next(err); }
};

export const updateBranch = async (req, res, next) => {
  try {
    const row = await Branch.findByPk(req.params.id);
    if (!row) return bad(res, 404, 'Cabang tidak ditemukan.');
    const { name, address, type, status } = req.body;
    if (status !== undefined && !STATUSES.includes(status)) return bad(res, 400, `Status harus salah satu dari: ${STATUSES.join(', ')}.`);
    if (name !== undefined && !String(name).trim()) return bad(res, 400, 'Nama cabang wajib diisi.');
    await row.update({
      ...(name !== undefined && { name: String(name).trim() }),
      ...(address !== undefined && { address }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
    });
    res.json({ success: true, message: 'Cabang diperbarui.', data: row });
  } catch (err) { next(err); }
};

export const deleteBranch = async (req, res, next) => {
  try {
    const row = await Branch.findByPk(req.params.id);
    if (!row) return bad(res, 404, 'Cabang tidak ditemukan.');
    if (row.isMain) return bad(res, 400, 'Cabang utama tidak dapat dihapus.');
    await row.destroy();
    res.json({ success: true, message: 'Cabang dihapus.' });
  } catch (err) { next(err); }
};
