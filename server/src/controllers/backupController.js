import {
  sequelize, User, Category, Brand, Product, ProductUnit, WholesalePrice, Customer, Supplier, Transaction, TransactionItem,
  TransactionPayment, DebtPayment, StockMovement, Purchase, PurchaseItem, Expense, Branch, Setting, HelpContent, BackupLog,
} from '../models/index.js';

const TABLES = { Setting, Branch, User, Category, Brand, Product, ProductUnit, WholesalePrice, Customer, Supplier, Purchase, PurchaseItem, Transaction, TransactionItem, TransactionPayment, DebtPayment, StockMovement, Expense, HelpContent };

/** Unduh cadangan seluruh data (JSON). Hash password tidak ikut diekspor. */
export const createBackup = async (req, res, next) => {
  try {
    const data = {};
    const rowCounts = {};
    for (const [name, model] of Object.entries(TABLES)) {
      const rows = (await model.findAll({ raw: true })).map((r) => {
        if (name === 'User') delete r.password;
        return r;
      });
      data[name] = rows;
      rowCounts[name] = rows.length;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `stokmaterial-backup-${stamp}.json`;
    const body = JSON.stringify({ app: 'StokMaterial.id', createdAt: new Date().toISOString(), rowCounts, data }, null, 2);
    await BackupLog.create({ fileName, sizeBytes: Buffer.byteLength(body), rowCounts, createdBy: req.user.id });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(body);
  } catch (err) { next(err); }
};

export const listBackups = async (req, res, next) => {
  try {
    const rows = await BackupLog.findAll({ order: [['createdAt', 'DESC']], limit: 20 });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

