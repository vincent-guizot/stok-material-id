import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

const ROLES = ['admin', 'cashier', 'warehouse'];
const pub = (u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, isActive: u.isActive, createdAt: u.createdAt });
const bad = (res, status, message) => res.status(status).json({ success: false, message });

export const listUsers = async (req, res, next) => {
  try {
    const rows = await User.findAll({ order: [['createdAt', 'ASC']] });
    res.json({ success: true, data: rows.map(pub) });
  } catch (err) { next(err); }
};

export const createUser = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = req.body.role || 'cashier';
    if (!name || !username) return bad(res, 400, 'Nama dan username wajib diisi.');
    if (password.length < 6) return bad(res, 400, 'Password minimal 6 karakter.');
    if (!ROLES.includes(role)) return bad(res, 400, `Peran harus salah satu dari: ${ROLES.join(', ')}.`);
    if (await User.findOne({ where: { username } })) return bad(res, 409, 'Username sudah digunakan.');
    const user = await User.create({ name, username, role, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ success: true, message: 'Pengguna berhasil ditambahkan.', data: pub(user) });
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return bad(res, 404, 'Pengguna tidak ditemukan.');
    const { name, role, isActive, password } = req.body;
    if (role !== undefined && !ROLES.includes(role)) return bad(res, 400, `Peran harus salah satu dari: ${ROLES.join(', ')}.`);
    if (password !== undefined && String(password).length < 6) return bad(res, 400, 'Password minimal 6 karakter.');

    const demotes = (role !== undefined && role !== 'admin') || isActive === false;
    if (user.role === 'admin' && demotes) {
      if (user.id === req.user.id) return bad(res, 400, 'Anda tidak dapat menonaktifkan atau menurunkan peran akun Anda sendiri.');
      const admins = await User.count({ where: { role: 'admin', isActive: true } });
      if (admins <= 1) return bad(res, 400, 'Harus tersisa minimal satu admin aktif.');
    }

    const updates = {};
    if (name !== undefined) updates.name = String(name).trim() || user.name;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = !!isActive;
    if (password !== undefined) updates.password = await bcrypt.hash(String(password), 10);
    await user.update(updates);
    res.json({ success: true, message: 'Pengguna diperbarui.', data: pub(user) });
  } catch (err) { next(err); }
};
