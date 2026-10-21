import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize, Supplier } from '../src/models/index.js';

describe('All API Endpoints Contract & Response Verification', () => {
  let adminToken;
  let cashierToken;
  let testData;
  let testSupplier;
  let createdTransactionId;

  beforeAll(async () => {
    testData = await setupTestDatabase();

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admintest',
        password: 'admin123',
      });
    adminToken = adminLogin.body.data.token;

    // Login Cashier
    const cashierLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'kasirtest',
        password: 'kasir123',
      });
    cashierToken = cashierLogin.body.data.token;

    // Seed a supplier for testing
    testSupplier = await Supplier.create({
      code: 'SUP-TEST-001',
      name: 'PT Semen Gresik Distributor',
      category: 'Semen & Mortar',
      contactPerson: 'Pak Hendra',
      phone: '081233445566',
      address: 'Jl. Raya Gresik No. 88',
      paymentTerms: 'Tempo 30 Hari',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('1. Health Check & Root API', () => {
    it('GET /api/v1/health harus mengembalikan status online dan nama aplikasi', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.appName).toBe('StokMaterial.id API');
      expect(res.body.version).toBe('1.0.0');
    });
  });

  describe('2. Categories Endpoint Contract', () => {
    it('GET /api/v1/categories harus mengembalikan daftar kategori publik', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toBeDefined();
    });

    it('POST /api/v1/categories harus berhasil membuat kategori baru jika diotorisasi admin', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bata Ringan Hebel',
          icon: '🧱',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Bata Ringan Hebel');
    });

    it('POST /api/v1/categories harus menolak jika tanpa token JWT', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Tanpa Token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/categories harus validasi input nama kategori', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ icon: '🧱' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Products Endpoint Contract', () => {
    it('GET /api/v1/products harus mengembalikan katalog produk lengkap dengan unit dan stok', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const prod = res.body.data[0];
      expect(prod.id).toBeDefined();
      expect(prod.name).toBeDefined();
      expect(prod.baseUnit).toBeDefined();
      expect(Array.isArray(prod.units)).toBe(true);
      expect(prod.humanReadableStock).toBeDefined();
    });

    it('GET /api/v1/products/:id harus mengembalikan rincian satu produk', async () => {
      const res = await request(app).get(`/api/v1/products/${testData.product.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testData.product.id);
      expect(res.body.data.name).toBe(testData.product.name);
    });

    it('POST /api/v1/products harus berhasil membuat produk baru lengkap dengan satuan bertingkat', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'BTA-HBL-001',
          name: 'Bata Hebel Citicon 7.5cm',
          categoryId: testData.category.id,
          baseUnit: 'Pcs',
          minStock: 200,
          currentStockBase: 1000,
          units: [
            {
              unitName: 'Pcs',
              conversionFactor: 1,
              buyPrice: 8000,
              sellPrice: 9500,
              level: 1,
            },
            {
              unitName: 'Palet (100 Pcs)',
              conversionFactor: 100,
              buyPrice: 750000,
              sellPrice: 900000,
              level: 2,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Bata Hebel Citicon 7.5cm');
      expect(res.body.data.units.length).toBe(2);
    });
  });

  describe('4. Customers & Mandor Proyek Endpoint Contract', () => {
    it('GET /api/v1/customers harus mengembalikan daftar mandor beserta saldo hutang dan batas limit', async () => {
      const res = await request(app).get('/api/v1/customers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const mandor = res.body.data[0];
      expect(mandor.name).toBeDefined();
      expect(mandor.creditLimit).toBeDefined();
      expect(mandor.currentDebt).toBeDefined();
    });

    it('GET /api/v1/customers/:id harus mengembalikan data mandor spesifik', async () => {
      const res = await request(app).get(`/api/v1/customers/${testData.customer.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testData.customer.id);
      expect(res.body.data.name).toBe(testData.customer.name);
    });
  });

  describe('5. Transactions Endpoint Contract', () => {
    it('POST /api/v1/transactions harus berhasil memproses transaksi POS kasir', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          customerId: testData.customer.id,
          paymentMethod: 'cash',
          paidAmount: 200000,
          items: [
            {
              productId: testData.product.id,
              unitId: testData.unitSak.id,
              qty: 1,
              unitPrice: 64000,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoiceNumber).toBeDefined();
      expect(Number(res.body.data.totalAmount)).toBe(64000);
      createdTransactionId = res.body.data.id;
    });

    it('GET /api/v1/transactions harus mengembalikan riwayat semua transaksi', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/transactions/:id harus mengembalikan rincian lengkap invoice transaksi', async () => {
      const res = await request(app)
        .get(`/api/v1/transactions/${createdTransactionId}`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdTransactionId);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('6. Debts & Kasbon Mandor Contract', () => {
    it('GET /api/v1/debts/history harus mengembalikan riwayat mutasi pembayaran cicilan hutang', async () => {
      const res = await request(app)
        .get('/api/v1/debts/history')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('7. Stocks Movements & Inbound Contract', () => {
    it('POST /api/v1/stocks/in harus berhasil menambah stok material masuk (PO Penerimaan)', async () => {
      const res = await request(app).post('/api/v1/stocks/in').send({
        productId: testData.product.id,
        unitId: testData.unitSak.id,
        qty: 5, // 5 Sak @ 50kg = 250 Kg
        notes: 'Penerimaan PO Semen dari Distributor',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.movement.qtyBaseUnit)).toBe(250);
      expect(Number(res.body.data.product.currentStockBase)).toBeGreaterThan(250);
    });

    it('GET /api/v1/stocks/movements harus mengembalikan riwayat kartu stok mutasi', async () => {
      const res = await request(app).get('/api/v1/stocks/movements');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('8. Reports Dashboard Summary Contract', () => {
    it('GET /api/v1/reports/summary harus mengembalikan ringkasan omset, piutang, dan stok untuk admin', async () => {
      const res = await request(app)
        .get('/api/v1/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.totalRevenue).toBeDefined();
      expect(res.body.data.totalCashReceived).toBeDefined();
      expect(res.body.data.totalOutstandingDebt).toBeDefined();
      expect(res.body.data.transactionCount).toBeDefined();
      expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
    });
  });

  describe('9. Suppliers Endpoint Contract', () => {
    it('GET /api/v1/suppliers harus mengembalikan daftar mitra supplier', async () => {
      const res = await request(app).get('/api/v1/suppliers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/suppliers/:id harus mengembalikan rincian supplier', async () => {
      const res = await request(app).get(`/api/v1/suppliers/${testSupplier.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testSupplier.id);
      expect(res.body.data.name).toBe(testSupplier.name);
    });
  });

  describe('10. System Settings Endpoint Contract', () => {
    it('GET /api/v1/settings harus mengembalikan konfigurasi toko dan struk', async () => {
      const res = await request(app).get('/api/v1/settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('POST /api/v1/settings harus berhasil menyimpan konfigurasi toko baru', async () => {
      const res = await request(app)
        .post('/api/v1/settings')
        .send({
          storeName: 'TB Maju Jaya Sentosa Abadi',
          storePhone: '081299988877',
          storeAddress: 'Jl. Merdeka Raya No. 100',
          receiptHeader: 'TB Maju Jaya Sentosa',
          receiptFooter: 'Barang yang sudah dibeli tidak dapat ditukar',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storeName).toBe('TB Maju Jaya Sentosa Abadi');
    });
  });
});
