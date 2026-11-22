import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize } from '../src/models/index.js';

describe('Keamanan rute: wajib login & peran', () => {
  let kasir;
  beforeAll(async () => {
    await setupTestDatabase();
    kasir = (await request(app).post('/api/v1/auth/login').send({ username: 'kasirtest', password: 'kasir123' })).body.data.token;
  });
  afterAll(async () => { await sequelize.close(); });

  it.each(['products', 'customers', 'suppliers', 'stocks/movements'])('GET /%s tanpa token -> 401', async (p) => {
    expect((await request(app).get(`/api/v1/${p}`)).status).toBe(401);
  });
  it.each([['post', 'products'], ['post', 'stocks/in'], ['post', 'stocks/out'], ['put', 'settings'], ['post', 'suppliers']])('%s /%s tanpa token -> 401', async (m, p) => {
    expect((await request(app)[m](`/api/v1/${p}`).send({})).status).toBe(401);
  });
  it('kasir boleh membaca katalog tetapi tidak boleh ubah produk, supplier, penyesuaian stok, atau hapus mandor', async () => {
    const h = { Authorization: `Bearer ${kasir}` };
    expect((await request(app).get('/api/v1/products').set(h)).status).toBe(200);
    expect((await request(app).post('/api/v1/products').set(h).send({ name: 'x' })).status).toBe(403);
    expect((await request(app).post('/api/v1/suppliers').set(h).send({ name: 'x' })).status).toBe(403);
    expect((await request(app).post('/api/v1/stocks/adjust').set(h).send({})).status).toBe(403);
    expect((await request(app).delete('/api/v1/customers/00000000-0000-0000-0000-000000000000').set(h)).status).toBe(403);
  });
});
