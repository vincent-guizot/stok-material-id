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

const num = (v) => parseFloat(v) || 0;
const jkt = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/**
 * Laporan ringkasan berdasarkan rentang tanggal (zona Asia/Jakarta, inklusif).
 * Semua angka dihitung dari transaksi tersimpan; tidak ada data contoh.
 * GET /reports/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const parseRange = (req) => {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const today = jkt(new Date());
  const to = re.test(req.query.to || '') ? req.query.to : today;
  const from = re.test(req.query.from || '') ? req.query.from : `${to.slice(0, 7)}-01`;
  if (from > to) return { error: 'Tanggal awal tidak boleh melewati tanggal akhir.' };
  return { from, to };
};
const run = (sql, rep) => sequelize.query(sql, { replacements: rep, type: sequelize.QueryTypes.SELECT });
const TXDAY = `to_char(t."transactionDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD')`;

export const getOverview = async (req, res, next) => {
  try {
    const range = parseRange(req);
    if (range.error) return res.status(400).json({ success: false, message: range.error });
    const { from, to } = range;
    const rep = { from, to };
    const dayExpr = `to_char("transactionDate" AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD')`;
    const q = (sql) => sequelize.query(sql, { replacements: rep, type: sequelize.QueryTypes.SELECT });

    const [totals] = await q(`
      SELECT COUNT(*)::int AS "count",
             COALESCE(SUM("totalAmount"),0) AS "sales",
             COALESCE(SUM("discount"),0) AS "discount",
             COALESCE(SUM("taxAmount"),0) AS "tax",
             COALESCE(SUM("paidAmount"),0) AS "paid",
             COALESCE(SUM("debtAmount"),0) AS "debt"
      FROM transactions
      WHERE ${dayExpr} BETWEEN :from AND :to`);

    const daily = await q(`
      SELECT ${dayExpr} AS "date", COUNT(*)::int AS "count", COALESCE(SUM("totalAmount"),0) AS "sales"
      FROM transactions WHERE ${dayExpr} BETWEEN :from AND :to
      GROUP BY 1 ORDER BY 1`);

    const methods = await q(`
      SELECT tp."paymentMethod" AS "method", COALESCE(SUM(tp."amount"),0) AS "amount", COUNT(*)::int AS "count"
      FROM transaction_payments tp JOIN transactions t ON t."id" = tp."transactionId"
      WHERE to_char(t."transactionDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') BETWEEN :from AND :to
      GROUP BY 1 ORDER BY 2 DESC`);

    const categories = await q(`
      SELECT COALESCE(c."name",'Tanpa Kategori') AS "name", COALESCE(SUM(ti."subtotal"),0) AS "amount"
      FROM transaction_items ti
      JOIN transactions t ON t."id" = ti."transactionId"
      LEFT JOIN products p ON p."id" = ti."productId"
      LEFT JOIN categories c ON c."id" = p."categoryId"
      WHERE to_char(t."transactionDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') BETWEEN :from AND :to
      GROUP BY 1 ORDER BY 2 DESC`);

    const topProducts = await q(`
      SELECT ti."productName" AS "name", ti."unitName" AS "unit",
             COALESCE(SUM(ti."qty"),0) AS "qty", COALESCE(SUM(ti."subtotal"),0) AS "amount"
      FROM transaction_items ti JOIN transactions t ON t."id" = ti."transactionId"
      WHERE to_char(t."transactionDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') BETWEEN :from AND :to
      GROUP BY 1,2 ORDER BY 4 DESC LIMIT 5`);

    const recent = await q(`
      SELECT t."id", t."invoiceNumber", t."transactionDate" AS "createdAt", t."totalAmount", t."paymentStatus", c."name" AS "customer"
      FROM transactions t LEFT JOIN customers c ON c."id" = t."customerId"
      WHERE to_char(t."transactionDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') BETWEEN :from AND :to
      ORDER BY t."transactionDate" DESC LIMIT 20`);

    const [recv] = await q(`SELECT COALESCE(SUM("currentDebt"),0) AS "outstanding", COUNT(*)::int AS "customers" FROM customers`);
    const [stock] = await q(`SELECT COUNT(*)::int AS "low" FROM products WHERE "currentStockBase" <= "minStock"`);

    res.json({
      success: true,
      data: {
        range: rep,
        totals: {
          count: totals.count,
          sales: num(totals.sales),
          discount: num(totals.discount),
          tax: num(totals.tax),
          paid: num(totals.paid),
          debt: num(totals.debt),
          average: totals.count ? Math.round(num(totals.sales) / totals.count) : 0,
        },
        daily: daily.map((d) => ({ date: d.date, count: d.count, sales: num(d.sales) })),
        methods: methods.map((m) => ({ method: m.method, amount: num(m.amount), count: m.count })),
        categories: categories.map((c) => ({ name: c.name, amount: num(c.amount) })),
        topProducts: topProducts.map((t) => ({ name: t.name, unit: t.unit, qty: num(t.qty), amount: num(t.amount) })),
        recent: recent.map((r) => ({ ...r, totalAmount: num(r.totalAmount) })),
        receivable: { outstanding: num(recv.outstanding), customers: recv.customers },
        lowStockCount: stock.low,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Laporan pembelian (barang masuk) per rentang tanggal. */
export const getPurchasesReport = async (req, res, next) => {
  try {
    const range = parseRange(req);
    if (range.error) return res.status(400).json({ success: false, message: range.error });
    const [totals] = await run(`
      SELECT COUNT(*)::int AS "count", COALESCE(SUM("totalAmount"),0) AS "amount",
             COALESCE(SUM("paidAmount"),0) AS "paid",
             COALESCE(SUM("totalAmount") FILTER (WHERE "paymentStatus"='BELUM_LUNAS'),0) AS "unpaid",
             COUNT(*) FILTER (WHERE "paymentStatus"='BELUM_LUNAS')::int AS "unpaidCount"
      FROM purchases WHERE "purchaseDate" BETWEEN :from AND :to`, range);
    const bySupplier = await run(`
      SELECT s.id, s.name, COUNT(p.id)::int AS "count", COALESCE(SUM(p."totalAmount"),0) AS "amount"
      FROM purchases p JOIN suppliers s ON s.id = p."supplierId"
      WHERE p."purchaseDate" BETWEEN :from AND :to GROUP BY s.id, s.name ORDER BY 4 DESC`, range);
    const list = await run(`
      SELECT p.id, p.number, p."purchaseDate", p."paymentTerm", p."paymentStatus", p."totalAmount", p."dueDate",
             s.name AS supplier,
             (SELECT string_agg(pi."productName" || ' (' || trim(trailing '.' from trim(trailing '0' from pi.qty::numeric(14,3)::text)) || ' ' || pi."unitName" || ')', ', ')
                FROM purchase_items pi WHERE pi."purchaseId" = p.id) AS items
      FROM purchases p JOIN suppliers s ON s.id = p."supplierId"
      WHERE p."purchaseDate" BETWEEN :from AND :to ORDER BY p."purchaseDate" DESC, p.number DESC LIMIT 200`, range);
    const num = (v) => parseFloat(v) || 0;
    res.json({
      success: true,
      data: {
        range,
        totals: { count: totals.count, amount: num(totals.amount), paid: num(totals.paid), unpaid: num(totals.unpaid), unpaidCount: totals.unpaidCount },
        bySupplier: bySupplier.map((r) => ({ id: r.id, name: r.name, count: r.count, amount: num(r.amount) })),
        list: list.map((r) => ({ ...r, totalAmount: num(r.totalAmount) })),
      },
    });
  } catch (err) { next(err); }
};

/**
 * Laba rugi. Pendapatan = penjualan setelah diskon, tanpa PPN (PPN adalah titipan pajak).
 * HPP = jumlah (qty x harga modal satuan saat transaksi). Biaya = tabel biaya operasional.
 */
export const getProfitLoss = async (req, res, next) => {
  try {
    const range = parseRange(req);
    if (range.error) return res.status(400).json({ success: false, message: range.error });
    const [rev] = await run(`
      SELECT COUNT(*)::int AS "count", COALESCE(SUM(t."subtotal"),0) AS "gross", COALESCE(SUM(t."discount"),0) AS "discount",
             COALESCE(SUM(t."taxAmount"),0) AS "tax"
      FROM transactions t WHERE ${TXDAY} BETWEEN :from AND :to`, range);
    const [cogs] = await run(`
      SELECT COALESCE(SUM(ROUND(ti."qty"::numeric * ti."unitCost")),0) AS "cogs",
             COUNT(*) FILTER (WHERE ti."unitCost" = 0)::int AS "noCostLines"
      FROM transaction_items ti JOIN transactions t ON t.id = ti."transactionId"
      WHERE ${TXDAY} BETWEEN :from AND :to`, range);
    const expenses = await run(`SELECT category, COALESCE(SUM(amount),0) AS amount FROM expenses WHERE "expenseDate" BETWEEN :from AND :to GROUP BY 1 ORDER BY 2 DESC`, range);
    const n = (v) => parseFloat(v) || 0;
    const revenue = n(rev.gross) - n(rev.discount);
    const cost = n(cogs.cogs);
    const gross = revenue - cost;
    const expenseTotal = expenses.reduce((a, e) => a + n(e.amount), 0);
    res.json({
      success: true,
      data: {
        range,
        transactionCount: rev.count,
        revenue: { gross: n(rev.gross), discount: n(rev.discount), net: revenue, taxCollected: n(rev.tax) },
        cogs: cost,
        grossProfit: gross,
        grossMarginPercent: revenue > 0 ? Math.round((gross / revenue) * 1000) / 10 : 0,
        expenses: { total: expenseTotal, byCategory: expenses.map((e) => ({ category: e.category, amount: n(e.amount) })) },
        netProfit: gross - expenseTotal,
        linesWithoutCost: cogs.noCostLines,
      },
    });
  } catch (err) { next(err); }
};

/** Arus kas & bank: kas masuk (penjualan non-kasbon + cicilan kasbon) dan kas keluar (pembelian lunas + biaya). */
export const getCashFlow = async (req, res, next) => {
  try {
    const range = parseRange(req);
    if (range.error) return res.status(400).json({ success: false, message: range.error });
    const salesIn = await run(`
      SELECT tp."paymentMethod" AS method, COALESCE(SUM(tp.amount),0) AS amount
      FROM transaction_payments tp JOIN transactions t ON t.id = tp."transactionId"
      WHERE tp."paymentMethod" <> 'DEBT' AND ${TXDAY} BETWEEN :from AND :to GROUP BY 1`, range);
    const debtIn = await run(`
      SELECT COALESCE(SUM(amount),0) AS amount FROM debt_payments
      WHERE to_char("paymentDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') BETWEEN :from AND :to`, range);
    const [purchOut] = await run(`SELECT COALESCE(SUM("paidAmount"),0) AS amount FROM purchases WHERE "paidAt" BETWEEN :from AND :to`, range);
    const expOut = await run(`SELECT category, COALESCE(SUM(amount),0) AS amount FROM expenses WHERE "expenseDate" BETWEEN :from AND :to GROUP BY 1 ORDER BY 2 DESC`, range);
    const dailyIn = await run(`
      SELECT d AS date, SUM(a) AS amount FROM (
        SELECT ${TXDAY} AS d, tp.amount AS a FROM transaction_payments tp JOIN transactions t ON t.id = tp."transactionId"
          WHERE tp."paymentMethod" <> 'DEBT' AND ${TXDAY} BETWEEN :from AND :to
        UNION ALL
        SELECT to_char("paymentDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD'), amount FROM debt_payments
          WHERE to_char("paymentDate" AT TIME ZONE 'Asia/Jakarta','YYYY-MM-DD') BETWEEN :from AND :to) x
      GROUP BY d ORDER BY d`, range);
    const dailyOut = await run(`
      SELECT d AS date, SUM(a) AS amount FROM (
        SELECT "paidAt"::text AS d, "paidAmount" AS a FROM purchases WHERE "paidAt" BETWEEN :from AND :to
        UNION ALL SELECT "expenseDate"::text, amount FROM expenses WHERE "expenseDate" BETWEEN :from AND :to) x
      GROUP BY d ORDER BY d`, range);
    const n = (v) => parseFloat(v) || 0;
    const sales = salesIn.reduce((a, r) => a + n(r.amount), 0);
    const debt = n(debtIn[0]?.amount);
    const purchases = n(purchOut.amount);
    const expenses = expOut.reduce((a, r) => a + n(r.amount), 0);
    const days = new Map();
    dailyIn.forEach((r) => days.set(r.date, { date: r.date, in: n(r.amount), out: 0 }));
    dailyOut.forEach((r) => { const d = days.get(r.date) || { date: r.date, in: 0, out: 0 }; d.out = n(r.amount); days.set(r.date, d); });
    res.json({
      success: true,
      data: {
        range,
        cashIn: { sales, debtPayments: debt, total: sales + debt, salesByMethod: salesIn.map((r) => ({ method: r.method, amount: n(r.amount) })) },
        cashOut: { purchases, expenses, total: purchases + expenses, expensesByCategory: expOut.map((r) => ({ category: r.category, amount: n(r.amount) })) },
        net: sales + debt - purchases - expenses,
        daily: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (err) { next(err); }
};

/** Posisi stok & nilai persediaan (harga modal vs harga jual satuan dasar). */
export const getStockReport = async (req, res, next) => {
  try {
    const rows = await run(`
      SELECT p.id, p.sku, p.name, p."baseUnit", p."currentStockBase" AS stock, p."minStock",
             c.name AS category,
             COALESCE((SELECT pu."buyPrice" / NULLIF(pu."conversionFactor",0) FROM product_units pu WHERE pu."productId" = p.id ORDER BY pu.level LIMIT 1),0) AS "costPerBase",
             COALESCE((SELECT pu."sellPrice" / NULLIF(pu."conversionFactor",0) FROM product_units pu WHERE pu."productId" = p.id ORDER BY pu.level LIMIT 1),0) AS "sellPerBase"
      FROM products p LEFT JOIN categories c ON c.id = p."categoryId"
      WHERE p."isActive" = true ORDER BY p.name`, {});
    const n = (v) => parseFloat(v) || 0;
    const items = rows.map((r) => {
      const stock = n(r.stock);
      const status = stock <= 0 ? 'habis' : stock <= n(r.minStock) ? 'menipis' : 'aman';
      return {
        id: r.id, sku: r.sku, name: r.name, category: r.category, baseUnit: r.baseUnit, stock, minStock: n(r.minStock), status,
        costValue: Math.round(Math.max(0, stock) * n(r.costPerBase)), sellValue: Math.round(Math.max(0, stock) * n(r.sellPerBase)),
      };
    });
    res.json({
      success: true,
      data: {
        totals: {
          products: items.length,
          low: items.filter((i) => i.status === 'menipis').length,
          empty: items.filter((i) => i.status === 'habis').length,
          costValue: items.reduce((a, i) => a + i.costValue, 0),
          sellValue: items.reduce((a, i) => a + i.sellValue, 0),
        },
        items,
      },
    });
  } catch (err) { next(err); }
};
