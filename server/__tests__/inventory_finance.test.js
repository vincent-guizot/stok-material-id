import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize, Product, ProductUnit, TransactionItem } from '../src/models/index.js';

describe('Pembelian, mutasi stok, biaya, grosir, pengguna & laporan keuangan', () => {
  let admin, kasir, gudang, data, supplierId, purchase;
  const A = '/api/v1';
  const H = (t) => ({ Authorization: `Bearer ${t}` });
  const login = async (u, p) => (await request(app).post(`${A}/auth/login`).send({ username: u, password: p })).body.data.token;
  const stock = async () => parseFloat((await Product.findByPk(data.product.id)).currentStockBase);

  beforeAll(async () => {
    data = await setupTestDatabase();
    admin = await login('admintest', 'admin123');
    kasir = await login('kasirtest', 'kasir123');
    const s = await request(app).post(`${A}/suppliers`).set(H(admin)).send({ name: 'PT Uji Semen' });
    supplierId = s.body.data.id;
    const g = await request(app).post(`${A}/users`).set(H(admin)).send({ name: 'Gudang Uji', username: 'gudangtest', password: 'gudang1', role: 'warehouse' });
    expect(g.status).toBe(201);
    gudang = await login('gudangtest', 'gudang1');
  });
  afterAll(async () => { await sequelize.close(); });

  it('pembelian: supplier wajib, kasir ditolak, stok bertambah, HPP semua satuan diperbarui', async () => {
    const body = { supplierId, paid: false, items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 10, unitCost: 58000 }] };
    expect((await request(app).post(`${A}/purchases`).set(H(kasir)).send(body)).status).toBe(403);
    expect((await request(app).post(`${A}/purchases`).set(H(gudang)).send({ ...body, supplierId: null })).status).toBe(400);

    const r = await request(app).post(`${A}/purchases`).set(H(gudang)).send(body);
    expect(r.status).toBe(201);
    purchase = r.body.data;
    expect(purchase.number).toMatch(/^PO-\d{8}-01$/);
    expect(parseFloat(purchase.totalAmount)).toBe(580000);
    expect(purchase.paymentStatus).toBe('BELUM_LUNAS');
    expect(await stock()).toBe(1500);
    expect(parseFloat((await ProductUnit.findByPk(data.unitSak.id)).buyPrice)).toBe(58000);
    expect(parseFloat((await ProductUnit.findByPk(data.unitKg.id)).buyPrice)).toBe(1160);

    const dup = await request(app).post(`${A}/purchases`).set(H(admin)).send({ ...body, items: [{ ...body.items[0], qty: 0 }] });
    expect(dup.status).toBe(400);
  });

  it('pelunasan pembelian hanya admin dan tidak bisa dua kali', async () => {
    expect((await request(app).post(`${A}/purchases/${purchase.id}/pay`).set(H(gudang))).status).toBe(403);
    const ok = await request(app).post(`${A}/purchases/${purchase.id}/pay`).set(H(admin));
    expect(ok.status).toBe(200);
    expect(ok.body.data.paymentStatus).toBe('LUNAS');
    expect((await request(app).post(`${A}/purchases/${purchase.id}/pay`).set(H(admin))).status).toBe(409);
  });

  it('barang keluar menolak stok kurang, surat jalan berurutan; mutasi tidak mengubah total stok', async () => {
    const bad = await request(app).post(`${A}/stocks/out`).set(H(gudang)).send({ productId: data.product.id, unitId: data.unitSak.id, qty: 1000 });
    expect(bad.status).toBe(400);
    expect(await stock()).toBe(1500);
    const ok = await request(app).post(`${A}/stocks/out`).set(H(gudang)).send({ productId: data.product.id, unitId: data.unitSak.id, qty: 10, destination: 'Proyek A' });
    expect(ok.status).toBe(201);
    expect(ok.body.data.movement.refNo).toMatch(/^DO-\d{8}-01$/);
    expect(await stock()).toBe(1000);

    const t = await request(app).post(`${A}/stocks/transfer`).set(H(gudang)).send({ productId: data.product.id, unitId: data.unitSak.id, qty: 2, fromLocation: 'Rak A', toLocation: 'Rak B' });
    expect(t.status).toBe(201);
    expect(await stock()).toBe(1000);
    expect((await Product.findByPk(data.product.id)).location).toBe('Rak B');
    expect((await request(app).post(`${A}/stocks/transfer`).set(H(gudang)).send({ productId: data.product.id, unitId: data.unitSak.id, qty: 2, fromLocation: 'Rak B', toLocation: 'Rak B' })).status).toBe(400);
  });

  it('penyesuaian & opname hanya admin; penyesuaian wajib alasan; opname mencatat selisih saja', async () => {
    const body = { productId: data.product.id, actualBaseQty: 990, reason: 'Karung sobek' };
    expect((await request(app).post(`${A}/stocks/adjust`).set(H(gudang)).send(body)).status).toBe(403);
    expect((await request(app).post(`${A}/stocks/adjust`).set(H(admin)).send({ ...body, reason: '' })).status).toBe(400);
    expect((await request(app).post(`${A}/stocks/adjust`).set(H(admin)).send(body)).status).toBe(200);
    expect(await stock()).toBe(990);

    const same = await request(app).post(`${A}/stocks/opname`).set(H(admin)).send({ items: [{ productId: data.product.id, physicalQty: 990 }] });
    expect(same.body.data.adjusted).toBe(0);
    const diff = await request(app).post(`${A}/stocks/opname`).set(H(admin)).send({ items: [{ productId: data.product.id, physicalQty: 1000 }] });
    expect(diff.body.data.adjusted).toBe(1);
    expect(diff.body.data.results[0].difference).toBe(10);
    expect(await stock()).toBe(1000);

    const mv = await request(app).get(`${A}/stocks/movements?type=OUT,OPNAME`).set(H(kasir));
    expect(mv.body.data.map((m) => m.type).sort()).toEqual(['OPNAME', 'OUT']);
  });

  it('harga grosir: harus lebih murah; checkout memakai harga tier dan menyimpan HPP per baris', async () => {
    const mk = (price) => request(app).post(`${A}/wholesale`).set(H(admin)).send({ unitId: data.unitSak.id, label: 'Grosir 5 sak', minQty: 5, price });
    expect((await request(app).post(`${A}/wholesale`).set(H(kasir)).send({})).status).toBe(403);
    expect((await mk(64000)).status).toBe(400);
    expect((await mk(60000)).status).toBe(201);

    const prod = await request(app).get(`${A}/products`).set(H(kasir));
    const row = prod.body.data.find((p) => p.id === data.product.id);
    expect(row.wholesale.map((w) => parseFloat(w.price))).toEqual([60000]);

    const sell = (qty) => request(app).post(`${A}/transactions/checkout`).set(H(kasir))
      .send({ items: [{ productId: data.product.id, unitId: data.unitSak.id, qty }], payments: [{ method: 'CASH', amount: qty * 64000 }] });
    const few = await sell(4);
    expect(parseFloat(few.body.data.totalAmount)).toBe(256000);
    const tier = await sell(5);
    expect(tier.status).toBe(201);
    expect(parseFloat(tier.body.data.totalAmount)).toBe(300000);
    // kasir mematikan harga grosir -> harga normal walau qty memenuhi syarat
    const off = await request(app).post(`${A}/transactions/checkout`).set(H(kasir))
      .send({ useWholesale: false, items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: 5 }], payments: [{ method: 'CASH', amount: 320000 }] });
    expect(parseFloat(off.body.data.totalAmount)).toBe(320000);
    const item = await TransactionItem.findOne({ where: { transactionId: tier.body.data.id } });
    expect(parseFloat(item.unitPrice)).toBe(60000);
    expect(parseFloat(item.unitCost)).toBe(58000);
  });

  it('biaya operasional: hanya admin, kategori & nominal divalidasi', async () => {
    expect((await request(app).post(`${A}/expenses`).set(H(kasir)).send({ category: 'Sewa', amount: 1 })).status).toBe(403);
    expect((await request(app).post(`${A}/expenses`).set(H(admin)).send({ category: 'Sewa', amount: 0 })).status).toBe(400);
    expect((await request(app).post(`${A}/expenses`).set(H(admin)).send({ category: 'Sewa', amount: 50000, expenseDate: '2999-01-01' })).status).toBe(400);
    const ok = await request(app).post(`${A}/expenses`).set(H(admin)).send({ category: 'Sewa', amount: 50000 });
    expect(ok.status).toBe(201);
    expect((await request(app).get(`${A}/expenses`).set(H(admin))).body.data).toHaveLength(1);
  });

  it('laba rugi & arus kas dihitung dari data nyata', async () => {
    // Penjualan: 256.000 + 300.000 + 320.000 = 876.000. HPP: (4 + 5 + 5) sak x 58.000 = 812.000.
    const pl = (await request(app).get(`${A}/reports/profit-loss`).set(H(admin))).body.data;
    expect(pl.revenue.net).toBe(876000);
    expect(pl.cogs).toBe(812000);
    expect(pl.grossProfit).toBe(64000);
    expect(pl.expenses.total).toBe(50000);
    expect(pl.netProfit).toBe(14000);

    // Kas masuk 876.000; kas keluar: pembelian lunas 580.000 + biaya 50.000
    const cf = (await request(app).get(`${A}/reports/cash-flow`).set(H(admin))).body.data;
    expect(cf.cashIn.total).toBe(876000);
    expect(cf.cashOut.total).toBe(630000);
    expect(cf.net).toBe(246000);

    expect((await request(app).get(`${A}/reports/profit-loss`).set(H(kasir))).status).toBe(403);
    const st = (await request(app).get(`${A}/reports/stock`).set(H(admin))).body.data;
    expect(st.totals.products).toBe(1);
    const pr = (await request(app).get(`${A}/reports/purchases`).set(H(admin))).body.data;
    expect(pr.totals.count).toBe(1);
    expect(pr.totals.amount).toBe(580000);
  });

  it('pengguna: sandi min. 6 karakter, admin terakhir terlindungi, nonaktif tidak bisa masuk, register hanya admin', async () => {
    const users = (await request(app).get(`${A}/users`).set(H(admin))).body.data;
    expect(users.every((u) => !('password' in u))).toBe(true);
    const me = users.find((u) => u.username === 'admintest');
    expect((await request(app).get(`${A}/users`).set(H(kasir))).status).toBe(403);
    expect((await request(app).post(`${A}/users`).set(H(admin)).send({ name: 'X', username: 'pendek', password: '123', role: 'cashier' })).status).toBe(400);
    expect((await request(app).put(`${A}/users/${me.id}`).set(H(admin)).send({ role: 'cashier' })).status).toBe(400);
    expect((await request(app).put(`${A}/users/${me.id}`).set(H(admin)).send({ isActive: false })).status).toBe(400);

    const kasirRow = users.find((u) => u.username === 'kasirtest');
    expect((await request(app).put(`${A}/users/${kasirRow.id}`).set(H(admin)).send({ isActive: false })).status).toBe(200);
    const lg = await request(app).post(`${A}/auth/login`).send({ username: 'kasirtest', password: 'kasir123' });
    expect(lg.status).toBe(403);
    expect((await request(app).get(`${A}/products`).set(H(kasir))).status).toBeGreaterThanOrEqual(401);

    const body = { name: 'Baru', username: 'baru1', password: 'rahasia1', role: 'cashier' };
    expect((await request(app).post(`${A}/auth/register`).send(body)).status).toBe(401);
    expect((await request(app).post(`${A}/auth/register`).set(H(gudang)).send(body)).status).toBe(403);
    expect((await request(app).post(`${A}/auth/register`).set(H(admin)).send(body)).status).toBe(201);
  });

  it('ganti kata sandi: wajib sandi lama, minimal 6 karakter, sandi baru berlaku', async () => {
    const put = (token, body) => request(app).put(`${A}/auth/password`).set(H(token)).send(body);
    expect((await request(app).put(`${A}/auth/password`).send({})).status).toBe(401);
    expect((await put(admin, { currentPassword: 'salah', newPassword: 'baru1234' })).status).toBe(400);
    expect((await put(admin, { currentPassword: 'admin123', newPassword: '123' })).status).toBe(400);
    expect((await put(admin, { currentPassword: 'admin123', newPassword: 'admin123' })).status).toBe(400);
    expect((await put(admin, { currentPassword: 'admin123', newPassword: 'baru1234' })).status).toBe(200);
    expect((await request(app).post(`${A}/auth/login`).send({ username: 'admintest', password: 'admin123' })).status).toBe(401);
    expect((await request(app).post(`${A}/auth/login`).send({ username: 'admintest', password: 'baru1234' })).status).toBe(200);
  });

  it('cabang: CRUD admin, status divalidasi', async () => {
    expect((await request(app).post(`${A}/branches`).set(H(gudang)).send({ name: 'X' })).status).toBe(403);
    expect((await request(app).post(`${A}/branches`).set(H(admin)).send({ name: 'Cabang Uji', status: 'Salah' })).status).toBe(400);
    const c = await request(app).post(`${A}/branches`).set(H(admin)).send({ name: 'Cabang Uji', status: 'Dalam Persiapan' });
    expect(c.status).toBe(201);
    expect((await request(app).put(`${A}/branches/${c.body.data.id}`).set(H(admin)).send({ status: 'Aktif' })).body.data.status).toBe('Aktif');
    expect((await request(app).delete(`${A}/branches/${c.body.data.id}`).set(H(admin))).status).toBe(200);
  });

  it('bantuan, notifikasi, dan backup (tanpa hash sandi)', async () => {
    expect((await request(app).get(`${A}/help`)).status).toBe(401);
    expect((await request(app).get(`${A}/help`).set(H(admin))).body.success).toBe(true);
    const n = await request(app).get(`${A}/notifications`).set(H(admin));
    expect(Array.isArray(n.body.data)).toBe(true);

    expect((await request(app).post(`${A}/backup`).set(H(gudang))).status).toBe(403);
    const b = await request(app).post(`${A}/backup`).set(H(admin));
    expect(b.status).toBe(200);
    expect(b.headers['content-disposition']).toMatch(/stokmaterial-backup-.*\.json/);
    expect(JSON.stringify(b.body)).not.toMatch(/"password"/);
    expect(b.body.rowCounts.Product).toBe(1);
    expect((await request(app).get(`${A}/backup`).set(H(admin))).body.data).toHaveLength(1);
  });
});
