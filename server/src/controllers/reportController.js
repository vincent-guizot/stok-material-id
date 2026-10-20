import { Op } from 'sequelize';
import { Transaction, TransactionItem, Customer, Product, sequelize } from '../models/index.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    // 1. Total Omset & Transaksi
    const totalSalesResult = await Transaction.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.col('paidAmount')), 'totalCashReceived'],
        [sequelize.fn('SUM', sequelize.col('debtAmount')), 'totalDebtGiven'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
      ],
      raw: true,
    });

    const summary = totalSalesResult[0] || {};
    const totalRevenue = parseFloat(summary.totalRevenue) || 0;
    const totalCashReceived = parseFloat(summary.totalCashReceived) || 0;
    const totalDebtGiven = parseFloat(summary.totalDebtGiven) || 0;
    const transactionCount = parseInt(summary.transactionCount, 10) || 0;

    // 2. Total Piutang Berjalan Semua Mandor
    const totalCustomerDebtResult = await Customer.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('currentDebt')), 'totalOutstandingDebt'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCustomers'],
      ],
      raw: true,
    });

    const totalOutstandingDebt = parseFloat(totalCustomerDebtResult[0]?.totalOutstandingDebt) || 0;
    const totalCustomers = parseInt(totalCustomerDebtResult[0]?.totalCustomers, 10) || 0;

    // 3. Produk dengan Peringatan Stok Menipis
    const lowStockProducts = await Product.findAll({
      where: sequelize.where(
        sequelize.col('currentStockBase'),
        '<=',
        sequelize.col('minStock')
      ),
      limit: 10,
      order: [['currentStockBase', 'ASC']],
    });

    // 4. Material Terlaris (Top Selling Items)
    const topItems = await TransactionItem.findAll({
      attributes: [
        'productName',
        'unitName',
        [sequelize.fn('SUM', sequelize.col('qty')), 'totalSoldQty'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalGrossSales'],
      ],
      group: ['productName', 'unitName'],
      order: [[sequelize.literal('"totalGrossSales"'), 'DESC']],
      limit: 5,
      raw: true,
    });

    // 5. 5 Transaksi Terakhir
    const recentTransactions = await Transaction.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
      ],
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCashReceived,
        totalDebtGiven,
        totalOutstandingDebt,
        transactionCount,
        totalCustomers,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        topItems,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};
