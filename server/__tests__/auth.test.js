import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize } from '../src/models/index.js';

describe('Auth Endpoints (Otentikasi Pengguna POS)', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('Harus sukses login dengan kredensial yang benar', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admintest',
        password: 'admin123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('admin');
  });

  it('Harus menolak login dengan password yang salah', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admintest',
        password: 'password_salah',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Harus mengembalikan data profil pengguna saat menyertakan token JWT valid', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admintest',
        password: 'admin123',
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.username).toBe('admintest');
  });

  it('Harus menolak akses /me jika tidak menyertakan token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
