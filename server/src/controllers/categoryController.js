import { Category, Product } from '../models/index.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });
    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori wajib diisi.',
      });
    }

    const category = await Category.create({ name, icon: icon || '📦' });
    res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};
