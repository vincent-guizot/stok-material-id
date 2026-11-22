import { Op } from 'sequelize';
import { Product, Purchase, Supplier } from '../models/index.js';
import { computeDebtSummary } from '../utils/receivables.js';
import { jakartaDate } from '../utils/docNumber.js';

const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(n);
const rp = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;

/** Notifikasi dihitung langsung dari data: stok, piutang jatuh tempo, hutang supplier, barang masuk terbaru. */
export const getNotifications = async (req, res, next) => {
  try {
    const items = [];
    const products = await Product.findAll({ where: { isActive: true }, order: [['currentStockBase', 'ASC']] });
    for (const p of products) {
      const stock = parseFloat(p.currentStockBase) || 0;
      const min = parseFloat(p.minStock) || 0;
      if (stock <= min) {
        items.push({
          id: `stock-${p.id}`, type: stock <= 0 ? 'danger' : 'warning', title: stock <= 0 ? 'Stok Habis' : 'Stok Menipis',
          desc: `${p.name} tersisa ${fmt(stock)} ${p.baseUnit} (minimum ${fmt(min)} ${p.baseUnit})`, at: p.updatedAt, link: '/inventory?tab=stock-list',
        });
      }
    }

    const debt = await computeDebtSummary();
    for (const c of debt.customerList) {
      const od = debt.customers[c.id]?.overdue || 0;
      if (od > 0) items.push({ id: `debt-${c.id}`, type: 'danger', title: 'Jatuh Tempo Kasbon', desc: `${c.name} memiliki tagihan jatuh tempo ${rp(od)}`, at: c.updatedAt, link: '/debts' });
    }

    const today = jakartaDate();
    const dueSupplier = await Purchase.findAll({
      where: { paymentStatus: 'BELUM_LUNAS', dueDate: { [Op.lte]: today } },
      include: [{ model: Supplier, as: 'supplier', attributes: ['name'] }],
    });
    for (const p of dueSupplier) {
      items.push({ id: `po-due-${p.id}`, type: 'warning', title: 'Hutang Supplier Jatuh Tempo', desc: `${p.number} ke ${p.supplier?.name} sebesar ${rp(parseFloat(p.totalAmount))}`, at: p.updatedAt, link: '/inventory?tab=stock-in' });
    }

    const since = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const recent = await Purchase.findAll({
      where: { createdAt: { [Op.gte]: since } }, order: [['createdAt', 'DESC']], limit: 3,
      include: [{ model: Supplier, as: 'supplier', attributes: ['name'] }],
    });
    for (const p of recent) {
      items.push({ id: `po-${p.id}`, type: 'success', title: 'Barang Masuk Diterima', desc: `${p.number} dari ${p.supplier?.name} telah diterima`, at: p.createdAt, link: '/inventory?tab=stock-in' });
    }

    const rank = { danger: 0, warning: 1, success: 2 };
    items.sort((a, b) => rank[a.type] - rank[b.type] || new Date(b.at) - new Date(a.at));
    res.json({ success: true, data: items.slice(0, 20), meta: { total: items.length } });
  } catch (err) { next(err); }
};
