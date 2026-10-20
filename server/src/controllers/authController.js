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

    const secret = process.env.JWT_SECRET || 'stokmaterial_secret_key_super_aman_2026';
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
