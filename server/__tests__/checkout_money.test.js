import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import {
  sequelize,
  Product,
  Customer,
  Setting,
  Transaction,
  TransactionPayment,
  StockMovement,
} from '../src/models/index.js';
import { calcTotals, settlePayments, roundRp } from '../src/utils/money.js';

// Harga data uji: Kg = Rp 1.500, Sak 50kg = Rp 64.000
describe('Ketepatan hitungan uang di checkout (server = sumber kebenaran)', () => {
  let kasir, admin, data;

  const login = async (username, password) =>
    (await request(app).post('/api/v1/auth/login').send({ username, password })).body.data.token;

  const setTax = (rate) =>
    Setting.upsert({ id: 'system_settings', taxRate: rate });

  const resetStock = (kg) =>
    Product.update({ currentStockBase: kg }, { where: { id: data.product.id } });

  const stock = async () => parseFloat((await Product.findByPk(data.product.id)).currentStockBase);

  const pay = (body, token = kasir) =>
    request(app).post('/api/v1/transactions/checkout').set('Authorization', `Bearer ${token}`).send(body);

  beforeAll(async () => {
    data = await setupTestDatabase();
    kasir = await login('kasirtest', 'kasir123');
    admin = await login('admintest', 'admin123');
  });

  beforeEach(async () => {
    await setTax(0);
    await resetStock(1000);
    await Customer.update({ currentDebt: 1000000 }, { where: { id: data.customer.id } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('Tanpa PPN: 2 Sak x 64.000 = Rp 128.000, total = dibayar, kembalian 0', async () => {
    const res = await pay({ items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 2 }], paymentMethod: 'CASH' });
    expect(res.status).toBe(201);
    const t = res.body.data;
    expect(parseFloat(t.subtotal)).toBe(128000);
    expect(parseFloat(t.taxAmount)).toBe(0);
    expect(parseFloat(t.totalAmount)).toBe(128000);
    expect(parseFloat(t.paidAmount)).toBe(128000);
    expect(parseFloat(t.debtAmount)).toBe(0);
    expect(parseFloat(t.changeAmount)).toBe(0);
    expect(t.paymentStatus).toBe('PAID');
  });

  it('PPN 11% (angka dihitung manual): 3 Sak + 12 Kg, diskon 5% -> total Rp 221.445', async () => {
    // 3 x 64.000 = 192.000 ; 12 x 1.500 = 18.000 ; subtotal 210.000
    // diskon 5% = 10.500 ; dasar pajak 199.500 ; PPN 11% = 21.945 ; total 221.445
    await setTax(11);
    const res = await pay({
      items: [
        { productId: data.product.id, unitId: data.unitSak.id, qty: 3 },
        { productId: data.product.id, unitId: data.unitKg.id, qty: 12 },
      ],
      discountPercent: 5,
      payments: [{ method: 'CASH', amount: 250000 }],
    });
    expect(res.status).toBe(201);
    const t = res.body.data;
    expect(parseFloat(t.subtotal)).toBe(210000);
    expect(parseFloat(t.discount)).toBe(10500);
    expect(parseFloat(t.taxRate)).toBe(11);
    expect(parseFloat(t.taxAmount)).toBe(21945);
    expect(parseFloat(t.totalAmount)).toBe(221445);
    expect(parseFloat(t.cashReceived)).toBe(250000);
    expect(parseFloat(t.changeAmount)).toBe(28555);
    expect(parseFloat(t.paidAmount)).toBe(221445);
    // stok: 3 Sak (150 Kg) + 12 Kg = 162 Kg
    expect(await stock()).toBe(1000 - 162);
  });

  it('Pembulatan setengah ke atas: 1 Kg, diskon 2,5%, PPN 11% -> 1.500 - 38 + 161 = Rp 1.623', async () => {
    // diskon 37,5 -> 38 ; dasar 1.462 ; PPN 160,82 -> 161 ; total 1.623
    await setTax(11);
    const res = await pay({
      items: [{ productId: data.product.id, unitId: data.unitKg.id, qty: 1 }],
      discountPercent: 2.5,
      payments: [{ method: 'CASH', amount: 2000 }],
    });
    expect(res.status).toBe(201);
    const t = res.body.data;
    expect(parseFloat(t.discount)).toBe(38);
    expect(parseFloat(t.taxAmount)).toBe(161);
    expect(parseFloat(t.totalAmount)).toBe(1623);
    expect(parseFloat(t.changeAmount)).toBe(377);
  });

  it('Catatan pembayaran tunai = nominal terpakai (tanpa kembalian); total payment = paidAmount', async () => {
    const res = await pay({
      items: [{ productId: data.product.id, unitId: data.unitKg.id, qty: 10 }],
      payments: [{ method: 'CASH', amount: 20000 }],
    });
    expect(res.status).toBe(201);
    const rows = await TransactionPayment.findAll({ where: { transactionId: res.body.data.id } });
    const sum = rows.reduce((a, r) => a + parseFloat(r.amount), 0);
    expect(sum).toBe(15000);
    expect(parseFloat(res.body.data.changeAmount)).toBe(5000);
  });

  it('Menolak tunai kurang dari total', async () => {
    const res = await pay({
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 1 }],
      payments: [{ method: 'CASH', amount: 63999 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('kurang Rp 1');
    expect(await stock()).toBe(1000); // tidak ada stok terpotong
  });

  it('Menolak kelebihan bayar non-tunai (transfer harus pas)', async () => {
    const res = await pay({
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 1 }],
      payments: [{ method: 'TRANSFER', amount: 65000 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('melebihi total');
  });

  it('Split payment: DP tunai 100.000 + sisa kasbon 28.000 dari total 128.000 -> PARTIAL, hutang +28.000', async () => {
    const res = await pay({
      customerId: data.customer.id,
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 2 }],
      payments: [
        { method: 'CASH', amount: 100000 },
        { method: 'DEBT', amount: 28000 },
      ],
    });
    expect(res.status).toBe(201);
    const t = res.body.data;
    expect(t.paymentStatus).toBe('PARTIAL');
    expect(parseFloat(t.paidAmount)).toBe(100000);
    expect(parseFloat(t.debtAmount)).toBe(28000);
    expect(parseFloat(t.paidAmount) + parseFloat(t.debtAmount)).toBe(parseFloat(t.totalAmount));
    const c = await Customer.findByPk(data.customer.id);
    expect(parseFloat(c.currentDebt)).toBe(1028000);
  });

  it('Split payment dengan kembalian: tunai 150.000 + kasbon 28.000 untuk total 128.000 -> kembalian 50.000', async () => {
    const res = await pay({
      customerId: data.customer.id,
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 2 }],
      payments: [
        { method: 'CASH', amount: 150000 },
        { method: 'DEBT', amount: 28000 },
      ],
    });
    expect(res.status).toBe(201);
    const t = res.body.data;
    expect(parseFloat(t.changeAmount)).toBe(50000);
    expect(parseFloat(t.paidAmount)).toBe(100000);
    expect(parseFloat(t.debtAmount)).toBe(28000);
  });

  it('Kasbon penuh -> UNPAID, hutang mandor bertambah tepat sebesar total (termasuk PPN)', async () => {
    await setTax(11); // 128.000 + 14.080 = 142.080
    const res = await pay({
      customerId: data.customer.id,
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 2 }],
      paymentMethod: 'KASBON',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.paymentStatus).toBe('UNPAID');
    expect(parseFloat(res.body.data.totalAmount)).toBe(142080);
    const c = await Customer.findByPk(data.customer.id);
    expect(parseFloat(c.currentDebt)).toBe(1142080);
  });

  it('Menolak jika total di layar berbeda dengan hitungan server (409), tanpa menyimpan apa pun', async () => {
    await setTax(11);
    const before = await Transaction.count();
    const res = await pay({
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 2 }],
      expectedTotal: 128000, // klien lupa PPN; server menghitung 142.080
      paymentMethod: 'CASH',
    });
    expect(res.status).toBe(409);
    expect(await Transaction.count()).toBe(before);
    expect(await stock()).toBe(1000);
  });

  it('Anti submit ganda: kunci sama dikirim 2x -> 1 nota, stok terpotong sekali', async () => {
    const body = {
      idempotencyKey: 'kunci-uji-0001',
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 2 }],
      paymentMethod: 'CASH',
    };
    const a = await pay(body);
    const b = await pay(body);
    expect(a.status).toBe(201);
    expect(b.status).toBe(200);
    expect(b.body.duplicate).toBe(true);
    expect(b.body.data.invoiceNumber).toBe(a.body.data.invoiceNumber);
    expect(await stock()).toBe(900);
    expect(await Transaction.count({ where: { idempotencyKey: 'kunci-uji-0001' } })).toBe(1);
  });

  it('Anti submit ganda paralel: 5 permintaan serentak dengan kunci sama -> tepat 1 nota', async () => {
    const body = {
      idempotencyKey: 'kunci-paralel-01',
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 1 }],
      paymentMethod: 'CASH',
    };
    const results = await Promise.all(Array.from({ length: 5 }, () => pay(body)));
    expect(results.every((r) => [200, 201].includes(r.status))).toBe(true);
    expect(await Transaction.count({ where: { idempotencyKey: 'kunci-paralel-01' } })).toBe(1);
    expect(await stock()).toBe(950);
  });

  it('Stok dicek kumulatif: produk sama di dua baris tidak boleh melewati stok', async () => {
    await resetStock(100);
    // 2 Sak (100 Kg) + 1 Kg = 101 Kg > 100
    const over = await pay({
      items: [
        { productId: data.product.id, unitId: data.unitSak.id, qty: 2 },
        { productId: data.product.id, unitId: data.unitKg.id, qty: 1 },
      ],
      paymentMethod: 'CASH',
    });
    expect(over.status).toBe(400);
    expect(over.body.message).toContain('tidak mencukupi');
    expect(await stock()).toBe(100);

    // tepat 100 Kg -> lolos, stok jadi 0 (bukan negatif, bukan selisih)
    const exact = await pay({
      items: [
        { productId: data.product.id, unitId: data.unitSak.id, qty: 1 },
        { productId: data.product.id, unitId: data.unitSak.id, qty: 1 },
      ],
      paymentMethod: 'CASH',
    });
    expect(exact.status).toBe(201);
    expect(await stock()).toBe(0);
  });

  it('Kasir paralel: 5 transaksi serentak untuk stok 150 Kg (1 Sak = 50 Kg) -> hanya 3 berhasil, stok akhir 0, nomor nota unik', async () => {
    await resetStock(150);
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        pay({ items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 1 }], paymentMethod: 'CASH' }),
      ),
    );
    const ok = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 400);
    expect(ok.length).toBe(3);
    expect(rejected.length).toBe(2);
    expect(await stock()).toBe(0);
    const numbers = ok.map((r) => r.body.data.invoiceNumber);
    expect(new Set(numbers).size).toBe(3);
    // mutasi stok cocok dengan stok akhir
    const moves = await StockMovement.findAll({ where: { productId: data.product.id, type: 'SALE', newStock: 0 } });
    expect(moves.length).toBeGreaterThanOrEqual(1);
  });

  it('Nomor nota berurutan 4 digit dalam satu hari', async () => {
    const a = await pay({ items: [{ productId: data.product.id, unitId: data.unitKg.id, qty: 1 }], paymentMethod: 'CASH' });
    const b = await pay({ items: [{ productId: data.product.id, unitId: data.unitKg.id, qty: 1 }], paymentMethod: 'CASH' });
    const na = parseInt(a.body.data.invoiceNumber.split('-')[2], 10);
    const nb = parseInt(b.body.data.invoiceNumber.split('-')[2], 10);
    expect(a.body.data.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(nb).toBe(na + 1);
  });

  it('Kasir tidak bisa menurunkan harga lewat request; admin boleh menimpa harga', async () => {
    const k = await pay({
      items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 1, unitPrice: 1 }],
      paymentMethod: 'CASH',
    });
    expect(parseFloat(k.body.data.totalAmount)).toBe(64000);

    const a = await pay(
      { items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 1, unitPrice: 60000 }], paymentMethod: 'CASH' },
      admin,
    );
    expect(parseFloat(a.body.data.totalAmount)).toBe(60000);
  });

  it('Menolak qty 0 / negatif / bukan angka dan metode bayar tak dikenal', async () => {
    for (const qty of [0, -1, 'abc']) {
      const r = await pay({ items: [{ productId: data.product.id, unitId: data.unitKg.id, qty }], paymentMethod: 'CASH' });
      expect(r.status).toBe(400);
    }
    const m = await pay({ items: [{ productId: data.product.id, unitId: data.unitKg.id, qty: 1 }], paymentMethod: 'BITCOIN' });
    expect(m.status).toBe(400);
  });

  it('Kartu (EDC) diterima dan tercatat', async () => {
    const r = await pay({ items: [{ productId: data.product.id, unitId: data.unitKg.id, qty: 4 }], paymentMethod: 'CARD' });
    expect(r.status).toBe(201);
    expect(r.body.data.payments[0].paymentMethod).toBe('CARD');
    expect(parseFloat(r.body.data.payments[0].amount)).toBe(6000);
  });

  it('Mengubah tarif PPN wajib admin', async () => {
    const noToken = await request(app).put('/api/v1/settings').send({ taxRate: 11 });
    expect(noToken.status).toBe(401);
    const asKasir = await request(app).put('/api/v1/settings').set('Authorization', `Bearer ${kasir}`).send({ taxRate: 11 });
    expect(asKasir.status).toBe(403);
    const bad = await request(app).put('/api/v1/settings').set('Authorization', `Bearer ${admin}`).send({ taxRate: 250 });
    expect(bad.status).toBe(400);
    const ok = await request(app).put('/api/v1/settings').set('Authorization', `Bearer ${admin}`).send({ taxRate: 11 });
    expect(ok.status).toBe(200);
    expect(parseFloat(ok.body.data.taxRate)).toBe(11);
  });
});

// ---------------------------------------------------------------------------------------------
// Uji properti: 5.000 kasus acak dibandingkan dengan kalkulator INTEGER murni (BigInt) sebagai pembanding.
// ---------------------------------------------------------------------------------------------
describe('Kalkulator uang vs pembanding integer (BigInt)', () => {
  // pembulatan setengah ke atas untuk (a*b)/c pada bilangan bulat positif
  const divRound = (num, den) => (num * 2n + den) / (den * 2n);

  // pembanding: harga & qty bulat, diskon & PPN dalam persen bulat
  const oracle = ({ lines, pct, rate }) => {
    const subtotal = lines.reduce((a, [q, p]) => a + BigInt(q) * BigInt(p), 0n);
    const discount = divRound(subtotal * BigInt(pct), 100n);
    const base = subtotal - discount;
    const tax = divRound(base * BigInt(rate), 100n);
    return { subtotal, discount, tax, total: base + tax };
  };

  // generator deterministik (LCG) agar test stabil
  let seed = 123456789;
  const rnd = (n) => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed % n;
  };

  it('calcTotals cocok dengan pembanding BigInt pada 5.000 kasus acak', () => {
    for (let i = 0; i < 5000; i++) {
      const n = 1 + rnd(6);
      const lines = Array.from({ length: n }, () => [1 + rnd(500), 100 * (1 + rnd(2000))]);
      const pct = rnd(101);
      const rate = [0, 11, 11, 5, 10][rnd(5)];
      const got = calcTotals({
        items: lines.map(([qty, unitPrice]) => ({ qty, unitPrice })),
        discountPercent: pct,
        taxRate: rate,
      });
      const exp = oracle({ lines, pct, rate });
      expect([got.subtotal, got.discount, got.taxAmount, got.total]).toEqual([
        Number(exp.subtotal),
        Number(exp.discount),
        Number(exp.tax),
        Number(exp.total),
      ]);
      expect(got.total).toBe(got.subtotal - got.discount + got.taxAmount);
    }
  });

  it('settlePayments: paid + debt selalu = total, kembalian tidak pernah negatif / melebihi tunai', () => {
    for (let i = 0; i < 5000; i++) {
      const total = 1000 * (1 + rnd(5000));
      const cash = rnd(2) ? 1000 * rnd(6000) : 0;
      const transfer = rnd(3) === 0 ? 1000 * rnd(3000) : 0;
      const debt = rnd(3) === 0 ? 1000 * rnd(3000) : 0;
      const r = settlePayments(total, [
        { method: 'CASH', amount: cash },
        { method: 'TRANSFER', amount: transfer },
        { method: 'DEBT', amount: debt },
      ]);
      const received = cash + transfer + debt;
      if (received < total) {
        expect(r.ok).toBe(false);
      } else if (received - total > cash) {
        expect(r.ok).toBe(false);
      } else {
        expect(r.ok).toBe(true);
        expect(r.paid + r.debt).toBe(total);
        expect(r.change).toBe(received - total);
        expect(r.change).toBeGreaterThanOrEqual(0);
        expect(r.change).toBeLessThanOrEqual(cash);
      }
    }
  });

  it('roundRp stabil terhadap noise floating point', () => {
    // noise float dari angka yang sebenarnya .5 -> tetap naik (setengah ke atas)
    expect(roundRp(21700.499999999996)).toBe(21701);
    // angka yang benar-benar di bawah .5 tetap turun
    expect(roundRp(21700.4999)).toBe(21700);
    expect(roundRp(37.5)).toBe(38);
    expect(roundRp(160.82)).toBe(161);
    expect(roundRp(0.1 * 3 * 10000)).toBe(3000);
    expect(roundRp(NaN)).toBe(0);
  });
});
