import { jwtSecret } from '../config/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.',
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    const secret = jwtSecret();
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, username, dan password wajib diisi.',
      });
    }

    if (!['admin', 'cashier', 'warehouse'].includes(role || 'cashier') || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Role tidak valid atau password kurang dari 6 karakter.' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah digunakan. Silakan pilih username lain.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      role: role || 'cashier',
    });

    res.status(201).json({
      success: true,
      message: 'Pengguna baru berhasil didaftarkan.',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try { res.json({ success: true, data: await User.findAll({ attributes: ['id', 'name', 'username', 'role'], order: [['name', 'ASC']] }) }); }
  catch (err) { next(err); }
};
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    const { name, username, role, password } = req.body;
    if (role && !['admin', 'cashier', 'warehouse'].includes(role)) return res.status(400).json({ success: false, message: 'Role tidak valid.' });
    if (user.id === req.user.id && role && role !== 'admin') return res.status(400).json({ success: false, message: 'Tidak dapat menurunkan role akun sendiri.' });
    const updates = {};
    for (const [key, value] of Object.entries({ name, username, role })) if (value !== undefined) updates[key] = value;
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
      updates.password = await bcrypt.hash(password, 10);
    }
    await user.update(updates);
    res.json({ success: true, data: { id: user.id, name: user.name, username: user.username, role: user.role } });
  } catch (err) { next(err); }
};
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri.' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    await user.destroy();
    res.json({ success: true, message: 'Pengguna dihapus.' });
  } catch (err) { next(err); }
};
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 6 || typeof currentPassword !== 'string') return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    const user = await User.findByPk(req.user.id);
    if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ success: false, message: 'Password saat ini salah.' });
    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) { next(err); }
};
