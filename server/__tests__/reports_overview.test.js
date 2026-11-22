import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize } from '../src/models/index.js';

describe('Laporan /reports/overview', () => {
  let admin, kasir, data;
  const login = async (u, p) => (await request(app).post('/api/v1/auth/login').send({ username: u, password: p })).body.data.token;
  const sale = (token, qty, method) =>
    request(app).post('/api/v1/transactions/checkout').set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: data.product.id, unitId: data.unitSak.id, qty }], payments: [{ method, amount: qty * 64000 }] });

  beforeAll(async () => {
    data = await setupTestDatabase();
    admin = await login('admintest', 'admin123');
    kasir = await login('kasirtest', 'kasir123');
  });
  afterAll(async () => { await sequelize.close(); });

  it('hanya admin', async () => {
    expect((await request(app).get('/api/v1/reports/overview').set('Authorization', `Bearer ${kasir}`)).status).toBe(403);
  });

  it('menjumlah penjualan, metode bayar, dan kategori persis', async () => {
    expect((await sale(kasir, 2, 'CASH')).status).toBe(201);   // 128.000
    expect((await sale(kasir, 1, 'QRIS')).status).toBe(201);   // 64.000
    const r = await request(app).get('/api/v1/reports/overview').set('Authorization', `Bearer ${admin}`);
    expect(r.status).toBe(200);
    const d = r.body.data;
    expect(d.totals.count).toBe(2);
    expect(d.totals.sales).toBe(192000);
    expect(d.totals.average).toBe(96000);
    const byMethod = Object.fromEntries(d.methods.map((m) => [m.method, m.amount]));
    expect(byMethod.CASH).toBe(128000);
    expect(byMethod.QRIS).toBe(64000);
    expect(d.categories.reduce((a, c) => a + c.amount, 0)).toBe(192000);
    expect(d.daily.reduce((a, x) => a + x.sales, 0)).toBe(192000);
    expect(d.recent.length).toBe(2);
  });

  it('rentang tanggal di luar transaksi menghasilkan nol; rentang terbalik ditolak', async () => {
    const r = await request(app).get('/api/v1/reports/overview?from=2020-01-01&to=2020-01-31').set('Authorization', `Bearer ${admin}`);
    expect(r.body.data.totals.sales).toBe(0);
    const bad = await request(app).get('/api/v1/reports/overview?from=2026-02-01&to=2026-01-01').set('Authorization', `Bearer ${admin}`);
    expect(bad.status).toBe(400);
  });
});
