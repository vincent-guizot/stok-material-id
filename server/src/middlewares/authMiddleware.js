import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'stokmaterial_secret_key_super_aman_2026';

    const decoded = jwt.verify(token, secret);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'username', 'role'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sesi tidak valid. Pengguna tidak ditemukan.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa.',
      error: err.message,
    });
  }
};
