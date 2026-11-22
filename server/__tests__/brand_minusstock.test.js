import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize, Setting, Product } from '../src/models/index.js';

describe('Merek & stok minus', () => {
  let admin, kasir, data;
  const H = (t) => ({ Authorization: `Bearer ${t}` });
  const login = async (u, p) => (await request(app).post('/api/v1/auth/login').send({ username: u, password: p })).body.data.token;
  const sell = (qty) =>
    request(app).post('/api/v1/transactions/checkout').set(H(kasir))
      .send({ items: [{ productId: data.product.id, unitId: data.unitSak.id, qty }], payments: [{ method: 'CASH', amount: qty * 64000 }] });

  beforeAll(async () => {
    data = await setupTestDatabase();
    admin = await login('admintest', 'admin123');
    kasir = await login('kasirtest', 'kasir123');
  });
  afterAll(async () => { await sequelize.close(); });

  it('CRUD merek: hanya admin menulis, nama unik, hitung produk, tolak hapus bila dipakai', async () => {
    expect((await request(app).get('/api/v1/brands')).status).toBe(401);
    expect((await request(app).post('/api/v1/brands').set(H(kasir)).send({ name: 'X' })).status).toBe(403);
    expect((await request(app).post('/api/v1/brands').set(H(admin)).send({ name: '  ' })).status).toBe(400);

    const c = await request(app).post('/api/v1/brands').set(H(admin)).send({ name: 'Tiga Roda', origin: 'PT Indocement' });
    expect(c.status).toBe(201);
    expect((await request(app).post('/api/v1/brands').set(H(admin)).send({ name: 'Tiga Roda' })).status).toBe(409);

    await request(app).put(`/api/v1/products/${data.product.id}`).set(H(admin)).send({ brandId: c.body.data.id });
    const list = await request(app).get('/api/v1/brands').set(H(kasir));
    expect(list.body.data.find((b) => b.name === 'Tiga Roda').productCount).toBe(1);
    const prods = await request(app).get('/api/v1/products').set(H(kasir));
    expect(prods.body.data.find((p) => p.id === data.product.id).brand.name).toBe('Tiga Roda');

    expect((await request(app).delete(`/api/v1/brands/${c.body.data.id}`).set(H(admin))).status).toBe(409);
    await request(app).put(`/api/v1/products/${data.product.id}`).set(H(admin)).send({ brandId: null });
    expect((await request(app).delete(`/api/v1/brands/${c.body.data.id}`).set(H(admin))).status).toBe(200);
  });

  it('allowMinusStock = no: penjualan melebihi stok ditolak', async () => {
    await Setting.upsert({ id: 'system_settings', allowMinusStock: 'no' });
    const p = await Product.findByPk(data.product.id);
    const before = parseFloat(p.currentStockBase);
    const r = await sell(Math.ceil(before / 50) + 5);
    expect(r.status).toBe(400);
    expect(parseFloat((await Product.findByPk(data.product.id)).currentStockBase)).toBe(before);
  });

  it('allowMinusStock = yes: boleh melebihi stok, stok menjadi minus tepat sebesar selisih', async () => {
    await Setting.upsert({ id: 'system_settings', allowMinusStock: 'yes' });
    const before = parseFloat((await Product.findByPk(data.product.id)).currentStockBase);
    const qty = Math.ceil(before / 50) + 2;
    const r = await sell(qty);
    expect(r.status).toBe(201);
    expect(parseFloat((await Product.findByPk(data.product.id)).currentStockBase)).toBe(before - qty * 50);
    await Setting.upsert({ id: 'system_settings', allowMinusStock: 'no' });
  });
});
