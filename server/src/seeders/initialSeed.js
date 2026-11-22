// Seeder: aman diulang (tidak menghapus data). Data master dibuat bila belum ada (dicocokkan lewat kunci alami),
// data demo transaksi hanya dibuat sekali pada database yang masih kosong. Tidak memakai sync().
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import {
  sequelize, User, Category, Brand, Product, ProductUnit, WholesalePrice, Customer, Supplier, Setting, Branch,
  HelpContent, Transaction, TransactionItem, TransactionPayment, DebtPayment, StockMovement, Purchase, PurchaseItem, Expense,
} from '../models/index.js';
import { roundRp, roundStock, calcTotals, settlePayments, pickUnitPrice } from '../utils/money.js';
import { jakartaDate } from '../utils/docNumber.js';
import {
  USERS, CATEGORIES, BRANDS, PRODUCTS, PRODUCT_META, PRODUCT_SUPPLIER, SUPPLIERS, CUSTOMERS, BRANCHES, WHOLESALE, EXPENSES, HELP,
} from './data.js';

const log = (m) => console.log(`[Seeder] ${m}`);

// Pengacak deterministik agar data demo selalu sama.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dateMinus = (n) => {
  const d = new Date(`${jakartaDate()}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() - n);
  return jakartaDate(d);
};
const at = (dateStr, h, m = 0) => new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`);

/** Buat baris yang belum ada. keyFn menghasilkan kunci alami. Mengembalikan semua baris (lama + baru) per kunci. */
async function ensure(Model, rows, keyFn, where) {
  const existing = await Model.findAll(where ? { where } : undefined);
  const map = new Map(existing.map((r) => [keyFn(r), r]));
  const toCreate = rows.filter((r) => !map.has(keyFn(r)));
  const created = toCreate.length ? await Model.bulkCreate(toCreate, { returning: true }) : [];
  created.forEach((r) => map.set(keyFn(r), r));
  return { map, created };
}

async function seedMaster() {
  const hashes = await Promise.all(USERS.map((u) => bcrypt.hash(u.password, 10)));
  const users = await ensure(User, USERS.map((u, i) => ({ ...u, password: hashes[i] })), (r) => r.username);
  const cats = await ensure(Category, CATEGORIES, (r) => r.name);
  const brands = await ensure(Brand, BRANDS, (r) => r.name);
  const sups = await ensure(Supplier, SUPPLIERS, (r) => r.code);
  await Setting.findOrCreate({ where: { id: 'system_settings' }, defaults: {} });
  await ensure(Branch, BRANCHES, (r) => r.name);
  await ensure(HelpContent, HELP.map((h, i) => ({ ...h, sortOrder: i })), (r) => `${r.kind}|${r.title}`);

  const custs = await ensure(
    Customer,
    CUSTOMERS.map(({ openingDebt, ...c }) => ({ ...c, currentDebt: openingDebt })),
    (r) => r.name,
  );

  const prods = await ensure(
    Product,
    PRODUCTS.map(({ units, openingStock, category, ...p }) => ({
      ...p,
      categoryId: cats.map.get(category).id,
      brandId: brands.map.get(PRODUCT_META[p.sku].brand)?.id || null,
      location: PRODUCT_META[p.sku].location,
      currentStockBase: 0,
    })),
    (r) => r.sku,
  );
  const createdSkus = new Set(prods.created.map((p) => p.sku));
  const unitRows = [];
  for (const p of PRODUCTS) {
    if (!createdSkus.has(p.sku)) continue;
    const prod = prods.map.get(p.sku);
    p.units.forEach((u) => unitRows.push({ ...u, productId: prod.id }));
  }
  if (unitRows.length) await ProductUnit.bulkCreate(unitRows);

  // Harga grosir
  const allUnits = await ProductUnit.findAll();
  const wsRows = [];
  for (const w of WHOLESALE) {
    const prod = prods.map.get(w.sku);
    const unit = allUnits.find((u) => u.productId === prod?.id && u.unitName === w.unit);
    if (!unit) continue;
    wsRows.push({ productId: prod.id, unitId: unit.id, label: w.label, minQty: w.minQty, price: w.price, target: w.target, isActive: true });
  }
  await ensure(WholesalePrice, wsRows, (r) => `${r.productId}|${r.unitId}|${r.label}`);

  log(`Master: ${users.created.length} pengguna, ${cats.created.length} kategori, ${brands.created.length} merek, ${prods.created.length} produk, ${sups.created.length} supplier, ${custs.created.length} mandor baru.`);
  return { users: users.map, prods, sups: sups.map, custs: custs.map, createdSkus };
}

async function seedDemo({ users, prods, sups, custs, createdSkus }) {
  const empty = (await Promise.all([Transaction, Purchase, StockMovement, Expense, DebtPayment].map((m) => m.count()))).every((n) => n === 0);
  if (!empty || createdSkus.size !== PRODUCTS.length) {
    log('Data transaksi demo dilewati (database sudah berisi transaksi atau produk lama).');
    return;
  }
  const rand = rng(20260101);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const admin = users.get('admin');
  const kasir = users.get('kasir');
  const gudang = users.get('gudang');
  const setting = await Setting.findByPk('system_settings');
  const taxRate = parseFloat(setting.taxRate) || 0;

  const products = new Map(); // sku -> {row, stock, units: [{row, buyPrice}]}
  const unitRows = await ProductUnit.findAll({ order: [['level', 'ASC']] });
  const tiers = await WholesalePrice.findAll({ where: { isActive: true } });
  for (const [sku, row] of prods.map) {
    products.set(sku, {
      row, stock: 0, location: row.location,
      units: unitRows.filter((u) => u.productId === row.id).map((u) => ({ row: u, buyPrice: parseFloat(u.buyPrice) })),
    });
  }
  const customers = new Map([...custs.values()].map((c) => [c.id, { row: c, debt: parseFloat(c.currentDebt) || 0 }]));

  const out = { movements: [], purchases: [], pItems: [], trx: [], items: [], pays: [], debtPays: [], expenses: [] };
  const counters = {};
  const nextNo = (prefix, date, pad) => {
    const k = `${prefix}-${date.replace(/-/g, '')}-`;
    counters[k] = (counters[k] || 0) + 1;
    return `${k}${String(counters[k]).padStart(pad, '0')}`;
  };
  const move = (p, type, delta, when, extra = {}) => {
    const prev = p.stock;
    const next = roundStock(prev + delta);
    p.stock = next;
    out.movements.push({
      productId: p.row.id, type, qtyBaseUnit: delta, previousStock: prev, newStock: next, createdAt: when, updatedAt: when, ...extra,
    });
  };

  const events = [];
  const D = (n) => dateMinus(n);

  // 1. Stok awal
  for (const [i, p] of PRODUCTS.entries()) {
    events.push({ when: at(D(24), 8, i), run: () => {
      const pr = products.get(p.sku);
      move(pr, 'IN', p.openingStock, at(D(24), 8, i), { notes: 'Stok awal (saldo pembukaan)', createdBy: admin.id, unitName: p.baseUnit, qtyInput: p.openingStock });
    } });
  }

  // 2. Pembelian dari supplier (beberapa belum lunas)
  const supplierByCode = new Map([...sups.values()].map((s) => [s.code, s]));
  const purchasePlan = [
    { day: 20, code: 'SI-001', paid: true, lines: [['SMN-GRS-50', 'Sak 50kg', 40, 1], ['SMN-TGR-50', 'Sak 50kg', 30, 1]] },
    { day: 18, code: 'SI-002', paid: true, lines: [['BSI-BTN-08', 'Lonjor 12m', 30, 1], ['BSI-ULR-10', 'Lonjor 12m', 20, 1.02], ['PKU-KYU-MIX', 'Dus 20kg', 6, 1]] },
    { day: 15, code: 'SI-004', paid: false, lines: [['CAT-DLX-WHT', 'Pail 20kg', 8, 1.03]] },
    { day: 13, code: 'SI-003', paid: true, lines: [['BTA-HBL-75', 'm3 (Isi 83 Pcs)', 6, 1], ['KRM-PLN-40', 'Dus (1 m2 / 6 kpg)', 40, 1]] },
    { day: 9, code: 'SI-005', paid: false, lines: [['PPA-WVN-34', 'Batang 4m', 30, 1.02]] },
    { day: 4, code: 'SI-001', paid: false, lines: [['SMN-GRS-50', 'Sak 50kg', 50, 1.02]] },
  ];
  for (const pl of purchasePlan) {
    events.push({ when: at(D(pl.day), 9, 30), run: () => {
      const date = D(pl.day);
      const sup = supplierByCode.get(pl.code);
      const id = randomUUID();
      const number = nextNo('PO', date, 2);
      const termDays = parseInt(String(sup.paymentTerms || '').match(/\d+/)?.[0] || '0', 10);
      const due = new Date(`${date}T12:00:00+07:00`);
      due.setUTCDate(due.getUTCDate() + termDays);
      let total = 0;
      const when = at(date, 9, 30);
      for (const [sku, unitName, qty, bump] of pl.lines) {
        const pr = products.get(sku);
        const u = pr.units.find((x) => x.row.unitName === unitName);
        const factor = parseFloat(u.row.conversionFactor);
        const cost = roundRp(u.buyPrice * bump);
        const subtotal = roundRp(qty * cost);
        total += subtotal;
        const base = roundStock(qty * factor);
        out.pItems.push({ purchaseId: id, productId: pr.row.id, unitId: u.row.id, productName: pr.row.name, unitName, qty, conversionFactor: factor, qtyBaseUnit: base, unitCost: cost, subtotal });
        move(pr, 'IN', base, when, { refNo: number, unitName, qtyInput: qty, notes: `Pembelian ${sup.name}`, createdBy: gudang.id });
        const perBase = cost / factor;
        for (const sib of pr.units) sib.buyPrice = roundRp(perBase * parseFloat(sib.row.conversionFactor));
      }
      out.purchases.push({
        id, number, supplierId: sup.id, purchaseDate: date, paymentTerm: sup.paymentTerms, dueDate: pl.paid ? null : jakartaDate(due),
        status: 'Diterima Lengkap', paymentStatus: pl.paid ? 'LUNAS' : 'BELUM_LUNAS', totalAmount: total, paidAmount: pl.paid ? total : 0,
        paidAt: pl.paid ? date : null, notes: null, createdBy: gudang.id, createdAt: when, updatedAt: when,
      });
    } });
  }

  // 3. Penjualan harian
  const custList = [...customers.values()];
  const byName = (s) => custList.find((c) => c.row.name.includes(s));
  const heavy = ['SMN-GRS-50', 'SMN-TGR-50', 'BSI-BTN-08', 'BSI-ULR-10', 'BTA-HBL-75', 'KRM-PLN-40', 'CAT-DLX-WHT', 'PPA-WVN-34', 'PKU-KYU-MIX'];
  for (let day = 21; day >= 0; day--) {
    const date = D(day);
    const n = 3 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const hour = 8 + Math.floor(rand() * 8);
      const minute = Math.floor(rand() * 60);
      const when = at(date, hour, minute);
      if (when > new Date()) continue;
      const plan = {
        custPick: rand(), nItems: 1 + Math.floor(rand() * 3), payPick: rand(), bulk: rand() < 0.12,
        lines: Array.from({ length: 3 }, () => ({ sku: pick(heavy), unitPick: rand(), qtyPick: rand() })),
      };
      events.push({ when, run: () => {
        const cust = plan.custPick < 0.5 ? null : custList[Math.floor(((plan.custPick - 0.5) / 0.5) * custList.length)];
        const items = [];
        for (const l of plan.lines.slice(0, plan.nItems)) {
          const pr = products.get(l.sku);
          const u = pr.units[Math.floor(l.unitPick * pr.units.length)];
          const tier = tiers.filter((t) => t.unitId === u.row.id);
          let qty = 1 + Math.floor(l.qtyPick * 6);
          if (plan.bulk && tier.length) qty = parseFloat(tier[0].minQty);
          const factor = parseFloat(u.row.conversionFactor);
          const base = roundStock(qty * factor);
          const reserved = items.filter((x) => x.pr === pr).reduce((a, x) => a + x.base, 0);
          if (base + reserved > pr.stock * 0.9) continue;
          const { price } = pickUnitPrice(parseFloat(u.row.sellPrice), tier.map((t) => ({ minQty: t.minQty, price: t.price })), qty);
          items.push({ pr, u, qty, factor, base, price });
        }
        if (!items.length) return;
        const totals = calcTotals({ items: items.map((i) => ({ qty: i.qty, unitPrice: i.price })), discountAmount: plan.bulk ? 25000 : 0, taxRate });
        let inputs;
        if (cust && plan.payPick < 0.45) inputs = [{ method: 'DEBT', amount: totals.total }];
        else if (cust && plan.payPick < 0.65) {
          const cash = roundRp(Math.floor(totals.total * 0.4 / 1000) * 1000);
          inputs = [{ method: 'CASH', amount: cash }, { method: 'DEBT', amount: totals.total - cash }];
        } else if (plan.payPick > 0.8) inputs = [{ method: pick(['TRANSFER', 'QRIS']), amount: totals.total }];
        else inputs = [{ method: 'CASH', amount: Math.ceil(totals.total / 10000) * 10000 }];
        let settled = settlePayments(totals.total, inputs);
        if (settled.debt > 0 && (!cust || cust.debt + settled.debt > parseFloat(cust.row.creditLimit))) {
          inputs = [{ method: 'CASH', amount: Math.ceil(totals.total / 10000) * 10000 }];
          settled = settlePayments(totals.total, inputs);
        }
        const id = randomUUID();
        const invoiceNumber = nextNo('INV', date, 4);
        const status = settled.debt > 0 ? (settled.paid > 0 ? 'PARTIAL' : 'UNPAID') : 'PAID';
        let dueDate = null;
        if (settled.debt > 0) { cust.debt += settled.debt; dueDate = new Date(when.getTime() + (cust.row.termDays || 14) * 86400000); }
        const cashier = rand() < 0.8 ? kasir : admin;
        out.trx.push({
          id, invoiceNumber, customerId: cust?.row.id || null, cashierId: cashier.id, transactionDate: when, subtotal: totals.subtotal,
          discount: totals.discount, taxRate: totals.taxRate, taxAmount: totals.taxAmount, totalAmount: totals.total, paidAmount: settled.paid,
          debtAmount: settled.debt, cashReceived: settled.cashReceived, changeAmount: settled.change, paymentStatus: status,
          dueDate: dueDate ? jakartaDate(dueDate) : null, notes: null, createdAt: when, updatedAt: when,
        });
        items.forEach((it, idx) => {
          out.items.push({
            transactionId: id, productId: it.pr.row.id, unitId: it.u.row.id, productName: it.pr.row.name, unitName: it.u.row.unitName,
            qty: it.qty, conversionFactor: it.factor, qtyBaseUnit: it.base, unitPrice: it.price, unitCost: it.u.buyPrice, subtotal: totals.lineSubtotals[idx],
          });
          move(it.pr, 'SALE', -it.base, when, { notes: `Penjualan Nota ${invoiceNumber} (${it.qty} ${it.u.row.unitName})`, createdBy: cashier.id });
        });
        if (settled.cashApplied > 0) out.pays.push({ transactionId: id, paymentMethod: 'CASH', amount: settled.cashApplied, createdAt: when, updatedAt: when });
        for (const p of inputs.filter((x) => x.method !== 'CASH' && roundRp(x.amount) > 0)) {
          out.pays.push({ transactionId: id, paymentMethod: p.method, amount: roundRp(p.amount), createdAt: when, updatedAt: when });
        }
      } });
    }
  }

  // 4. Cicilan kasbon (nominal mengikuti hutang saat itu)
  for (const [day, key, frac, method] of [[9, 'Bambang', 0.5, 'TRANSFER'], [5, 'Budi', 1, 'CASH'], [3, 'Joko', 0.3, 'TRANSFER']]) {
    events.push({ when: at(D(day), 14, 0), run: () => {
      const c = byName(key);
      const amount = Math.floor((c.debt * frac) / 1000) * 1000;
      if (amount <= 0) return;
      c.debt -= amount;
      const when = at(D(day), 14, 0);
      out.debtPays.push({ customerId: c.row.id, transactionId: null, amount, paymentMethod: method, paymentDate: when, receivedBy: admin.id, notes: `Pelunasan Kasbon Mandor ${c.row.name}`, createdAt: when, updatedAt: when });
    } });
  }

  // 5. Barang keluar, mutasi, penyesuaian, opname
  events.push({ when: at(D(11), 10, 0), run: () => {
    const pr = products.get('SMN-GRS-50'); const w = at(D(11), 10, 0);
    move(pr, 'OUT', -500, w, { refNo: nextNo('DO', D(11), 2), destination: 'Proyek Graha Asri Blok C', receiver: 'Pak Bambang', driver: 'Slamet', unitName: 'Sak 50kg', qtyInput: 10, createdBy: gudang.id, notes: 'Pengiriman ke proyek' });
  } });
  events.push({ when: at(D(7), 11, 0), run: () => {
    const pr = products.get('BSI-BTN-08'); const w = at(D(7), 11, 0);
    move(pr, 'OUT', -144, w, { refNo: nextNo('DO', D(7), 2), destination: 'Proyek Ruko Sentosa', receiver: 'Pak Joko', driver: 'Slamet', unitName: 'Lonjor 12m', qtyInput: 12, createdBy: gudang.id });
  } });
  events.push({ when: at(D(10), 15, 0), run: () => {
    const pr = products.get('KRM-PLN-40'); const w = at(D(10), 15, 0);
    const from = pr.location; pr.location = 'Gudang Cadangan Driyorejo';
    out.movements.push({
      productId: pr.row.id, type: 'TRANSFER', qtyBaseUnit: 120, previousStock: pr.stock, newStock: pr.stock, createdAt: w, updatedAt: w,
      refNo: nextNo('MUT', D(10), 2), fromLocation: from, toLocation: pr.location, unitName: 'Dus (1 m2 / 6 kpg)', qtyInput: 20,
      createdBy: gudang.id, notes: 'Pemindahan stok keramik',
    });
  } });
  events.push({ when: at(D(6), 16, 0), run: () => {
    const pr = products.get('KRM-PLN-40'); const w = at(D(6), 16, 0);
    move(pr, 'ADJUSTMENT', -12, w, { reason: 'Barang pecah / rusak di gudang', createdBy: admin.id });
  } });
  events.push({ when: at(D(2), 17, 0), run: () => {
    const w = at(D(2), 17, 0); const ref = nextNo('OPN', D(2), 2);
    for (const [sku, diff] of [['PKU-KYU-MIX', -2], ['CAT-DLX-WHT', 1]]) {
      move(products.get(sku), 'OPNAME', diff, w, { refNo: ref, reason: 'Stok opname bulanan', createdBy: admin.id });
    }
  } });

  events.sort((a, b) => a.when - b.when);
  for (const e of events) e.run();

  // Biaya operasional
  for (const e of EXPENSES) {
    const d = D(e.daysAgo);
    out.expenses.push({ expenseDate: d, category: e.category, description: e.description, amount: e.amount, paymentMethod: e.paymentMethod, createdBy: admin.id });
  }

  await sequelize.transaction(async (t) => {
    const o = { transaction: t };
    await Purchase.bulkCreate(out.purchases, o);
    await PurchaseItem.bulkCreate(out.pItems, o);
    await Transaction.bulkCreate(out.trx, { ...o, silent: true });
    await TransactionItem.bulkCreate(out.items, o);
    await TransactionPayment.bulkCreate(out.pays, o);
    await DebtPayment.bulkCreate(out.debtPays, o);
    await Expense.bulkCreate(out.expenses, o);
    // Mutasi stok dibuat berurutan agar urutan createdAt sama persis dengan kronologi.
    await StockMovement.bulkCreate(out.movements, o);
    for (const p of products.values()) await p.row.update({ currentStockBase: p.stock, location: p.location }, o);
    for (const u of products.values()) for (const x of u.units) await x.row.update({ buyPrice: x.buyPrice }, o);
    for (const c of customers.values()) await c.row.update({ currentDebt: Math.max(0, c.debt) }, o);
  });
  log(`Demo: ${out.purchases.length} pembelian, ${out.trx.length} nota penjualan, ${out.debtPays.length} pelunasan kasbon, ${out.movements.length} mutasi stok, ${out.expenses.length} biaya.`);
}

export async function runSeeder() {
  log('Mengisi data awal...');
  const master = await seedMaster();
  await seedDemo(master);
  log('Selesai. Login: admin/admin123, kasir/kasir123, gudang/gudang123');
}

// Jalan langsung: node src/seeders/initialSeed.js
if (process.argv[1]?.endsWith('initialSeed.js')) {
  const { migrateUp } = await import('../database/migrator.js');
  const { ensureDatabaseExists } = await import('../config/database.js');
  try {
    await ensureDatabaseExists();
    await migrateUp();
    await runSeeder();
    await sequelize.close();
  } catch (err) {
    console.error('[Seeder Gagal]', err);
    process.exit(1);
  }
}
