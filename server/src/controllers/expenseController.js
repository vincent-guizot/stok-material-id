import { Op } from 'sequelize';
import { Expense, User } from '../models/index.js';
import { roundRp } from '../utils/money.js';
import { jakartaDate } from '../utils/docNumber.js';

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
const bad = (res, status, message) => res.status(status).json({ success: false, message });
export const EXPENSE_CATEGORIES = ['Gaji & Upah', 'Listrik & Air', 'Sewa', 'Transport & BBM', 'Perawatan', 'Perlengkapan', 'Lainnya'];

export const listExpenses = async (req, res, next) => {
  try {
    const { from, to, category } = req.query;
    const where = {};
    if (isDate(from)) where.expenseDate = { ...(where.expenseDate || {}), [Op.gte]: from };
    if (isDate(to)) where.expenseDate = { ...(where.expenseDate || {}), [Op.lte]: to };
    if (category) where.category = category;
    const rows = await Expense.findAll({
      where, order: [['expenseDate', 'DESC'], ['createdAt', 'DESC']], limit: 500,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
    });
    res.json({ success: true, data: rows, meta: { categories: EXPENSE_CATEGORIES } });
  } catch (err) { next(err); }
};

export const createExpense = async (req, res, next) => {
  try {
    const { category, description, paymentMethod = 'CASH' } = req.body;
    const amount = roundRp(Number(req.body.amount));
    const expenseDate = isDate(req.body.expenseDate) ? req.body.expenseDate : jakartaDate();
    if (!category || !String(category).trim()) return bad(res, 400, 'Kategori biaya wajib diisi.');
    if (!(amount > 0)) return bad(res, 400, 'Nominal biaya harus lebih dari 0.');
    if (expenseDate > jakartaDate()) return bad(res, 400, 'Tanggal biaya tidak boleh di masa depan.');
    if (!['CASH', 'TRANSFER', 'QRIS', 'CARD'].includes(paymentMethod)) return bad(res, 400, 'Metode pembayaran tidak dikenal.');
    const row = await Expense.create({ expenseDate, category: String(category).trim(), description: description || null, amount, paymentMethod, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Biaya operasional dicatat.', data: row });
  } catch (err) { next(err); }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const row = await Expense.findByPk(req.params.id);
    if (!row) return bad(res, 404, 'Biaya tidak ditemukan.');
    await row.destroy();
    res.json({ success: true, message: 'Biaya dihapus.' });
  } catch (err) { next(err); }
};
