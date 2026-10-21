import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize, Product } from '../src/models/index.js';

describe('CRUD Persistence & Real Database Operations Test', () => {
  let adminToken;
  let sampleProduct;

  beforeAll(async () => {
    await setupTestDatabase();

    // Login sebagai admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admintest', password: 'admin123' });
    adminToken = loginRes.body.data.token;

    sampleProduct = await Product.findOne();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Product Update & Delete Persistence', () => {
    it('Harus berhasil memperbarui data produk via PUT /api/v1/products/:id dan tersimpan di DB', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${sampleProduct.id}`)
        .send({
          name: 'Semen Gresik 50kg Super Perkasa',
          minStock: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Semen Gresik 50kg Super Perkasa');

      // Verifikasi langsung ke database
      const reloaded = await Product.findByPk(sampleProduct.id);
      expect(reloaded.name).toBe('Semen Gresik 50kg Super Perkasa');
      expect(reloaded.minStock).toBe(25);
    });

    it('Harus berhasil menghapus produk via DELETE /api/v1/products/:id', async () => {
      // Buat produk dummy
      const createRes = await request(app)
        .post('/api/v1/products')
        .send({
          name: 'Bata Merah Bakar Candi',
          sku: 'BTA-MRH-TEST',
          baseUnit: 'Pcs',
          minStock: 100,
          initialStock: 500,
        });

      const newId = createRes.body.data.id;

      const delRes = await request(app).delete(`/api/v1/products/${newId}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Pastikan di getAllProducts tidak muncul lagi
      const listRes = await request(app).get('/api/v1/products');
      const found = listRes.body.data.find((p) => p.id === newId);
      expect(found).toBeUndefined();
    });
  });

  describe('Customer / Mandor Update & Delete Persistence', () => {
    let customerId;

    it('Harus berhasil membuat, memperbarui, dan menghapus data Mandor', async () => {
      // 1. Create
      const createRes = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Mandor Supriadi',
          phone: '08123456789',
          address: 'Proyek Perumahan Gresik Regency',
          creditLimit: 15000000,
          termDays: 30,
        });

      expect(createRes.status).toBe(201);
      customerId = createRes.body.data.id;

      // 2. Update
      const updateRes = await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .send({
          name: 'Mandor Supriadi (Senior)',
          creditLimit: 20000000,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Mandor Supriadi (Senior)');

      // 3. Delete
      const delRes = await request(app).delete(`/api/v1/customers/${customerId}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  describe('Supplier Management Persistence', () => {
    let supplierId;

    it('Harus berhasil mengelola data Supplier (CRUD lengkap)', async () => {
      // GET All
      const listRes = await request(app).get('/api/v1/suppliers');
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      // Create
      const addRes = await request(app)
        .post('/api/v1/suppliers')
        .send({
          name: 'PT Holcim Indonesia Baru',
          category: 'Semen & Mortar',
          phone: '021-99887766',
          address: 'Jl. Raya Narogong, Bogor',
          paymentTerms: 'Tempo 30 Hari',
        });

      expect(addRes.status).toBe(201);
      supplierId = addRes.body.data.id;

      // Update
      const updateRes = await request(app)
        .put(`/api/v1/suppliers/${supplierId}`)
        .send({
          name: 'PT Solusi Bangun Indonesia (Holcim)',
          status: 'Aktif',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('PT Solusi Bangun Indonesia (Holcim)');

      // Delete
      const delRes = await request(app).delete(`/api/v1/suppliers/${supplierId}`);
      expect(delRes.status).toBe(200);
    });
  });

  describe('System Settings Persistence', () => {
    it('Harus menyimpan dan mengambil konfigurasi toko & nota secara permanen', async () => {
      const getRes = await request(app).get('/api/v1/settings');
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.storeName).toBeDefined();

      const updateRes = await request(app)
        .put('/api/v1/settings')
        .send({
          storeName: 'Toko Sentosa Material Gresik',
          storePhone: '031-7788990',
          branches: [
            { id: 1, name: 'Depo Pusat Sentosa', address: 'Jl. Raya Gresik', status: 'Aktif' },
            { id: 2, name: 'Cabang Driyorejo', address: 'Jl. Raya Petiken', status: 'Aktif' },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.storeName).toBe('Toko Sentosa Material Gresik');
      expect(updateRes.body.data.branches.length).toBe(2);

      // Verifikasi via GET kembali
      const verifyRes = await request(app).get('/api/v1/settings');
      expect(verifyRes.body.data.storeName).toBe('Toko Sentosa Material Gresik');
      expect(verifyRes.body.data.storePhone).toBe('031-7788990');
    });
  });

  describe('Stock Outbound & Transfer Persistence', () => {
    it('Harus berhasil mencatat barang keluar (Surat Jalan) dan memotong stok riil di DB', async () => {
      const prevStock = sampleProduct.currentStockBase;

      const outRes = await request(app)
        .post('/api/v1/stocks/out')
        .send({
          productId: sampleProduct.id,
          qty: 10,
          destination: 'Proyek Ruko Menganti',
          receiver: 'Pak Yono',
          driver: 'Slamet',
        });

      expect(outRes.status).toBe(201);
      expect(outRes.body.success).toBe(true);

      const updated = await Product.findByPk(sampleProduct.id);
      expect(updated.currentStockBase).toBe(prevStock - 10);
    });

    it('Harus berhasil mencatat mutasi lokasi stok', async () => {
      const mutRes = await request(app)
        .post('/api/v1/stocks/transfer')
        .send({
          productId: sampleProduct.id,
          qty: 5,
          fromLocation: 'Gudang Utama (G1)',
          toLocation: 'Toko Depan (Rak A)',
        });

      expect(mutRes.status).toBe(201);
      expect(mutRes.body.success).toBe(true);
    });
  });
});
