import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize, Customer } from '../src/models/index.js';

describe('Ringkasan piutang mandor (/debts/summary)', () => {
  let kasir, data, cust;

  const login = async (u, p) => (await request(app).post('/api/v1/auth/login').send({ username: u, password: p })).body.data.token;
  const summary = async () => (await request(app).get('/api/v1/debts/summary').set('Authorization', `Bearer ${kasir}`)).body.data;
  const bon = (amount, dueDate) =>
    request(app)
      .post('/api/v1/transactions/checkout')
      .set('Authorization', `Bearer ${kasir}`)
      .send({
        customerId: cust.id,
        items: [{ productId: data.product.id, unitId: data.unitSak.id, qty: amount / 64000 }],
        payments: [{ method: 'DEBT', amount }],
        ...(dueDate ? { dueDate } : {}),
      });

  beforeAll(async () => {
    data = await setupTestDatabase();
    kasir = await login('kasirtest', 'kasir123');
    cust = await Customer.create({ name: 'Mandor Ringkasan', creditLimit: 100000000, currentDebt: 0, termDays: 14 });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('butuh login', async () => {
    const r = await request(app).get('/api/v1/debts/summary');
    expect(r.status).toBe(401);
  });

  it('menghitung total, jatuh tempo (FIFO), dan jumlah transaksi dari data nyata', async () => {
    const a = await bon(128000, '2020-01-01'); // sudah jatuh tempo
    const b = await bon(64000); // belum jatuh tempo (default 14 hari)
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    let s = await summary();
    expect(s.customers[cust.id].txCount).toBe(2);
    expect(s.customers[cust.id].overdue).toBe(128000);
    expect(s.totals.outstanding).toBeGreaterThanOrEqual(192000);

    // cicilan 128.000 melunasi nota tertua (FIFO) -> tidak ada lagi yang jatuh tempo
    const pay = await request(app)
      .post('/api/v1/debts/pay')
      .set('Authorization', `Bearer ${kasir}`)
      .send({ customerId: cust.id, amount: 128000 });
    expect(pay.status).toBe(201);

    s = await summary();
    expect(s.customers[cust.id].overdue).toBe(0);
    expect(s.customers[cust.id].lastPaymentAt).toBeTruthy();
    expect(s.totals.paidThisMonthAmount).toBe(128000);
    expect(s.totals.paidThisMonthCount).toBe(1);
  });

  it('saldo awal (tanpa nota di sistem) tidak dihitung jatuh tempo', async () => {
    const c2 = await Customer.create({ name: 'Saldo Awal', creditLimit: 50000000, currentDebt: 9000000, termDays: 14 });
    const s = await summary();
    expect(s.customers[c2.id].overdue).toBe(0);
    expect(s.customers[c2.id].txCount).toBe(0);
  });

  it('riwayat transaksi bisa difilter per mandor', async () => {
    const r = await request(app).get(`/api/v1/transactions?customerId=${cust.id}&limit=50`).set('Authorization', `Bearer ${kasir}`);
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBe(2);
    expect(r.body.data.every((t) => t.customerId === cust.id)).toBe(true);
  });
});
