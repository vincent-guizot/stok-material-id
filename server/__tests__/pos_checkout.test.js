import request from 'supertest';
import app from '../src/app.js';
import { setupTestDatabase } from './helpers/testHelper.js';
import { sequelize, Product, Customer } from '../src/models/index.js';

describe('POS Checkout & Konversi Multi-Satuan Test', () => {
  let kasirToken;
  let testData;

  beforeAll(async () => {
    testData = await setupTestDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'kasirtest',
        password: 'kasir123',
      });
    kasirToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('Harus berhasil mengambil katalog produk dengan informasi satuan bertingkat', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const product = res.body.data[0];
    expect(product.units.length).toBe(2);
    expect(product.humanReadableStock).toBeDefined();
  });

  it('Harus memotong stok satuan dasar (Base Unit) secara tepat saat kasir menjual satuan tingkat atas (Sak)', async () => {
    // Awal: stok 1.000 Kg
    // Kasir menjual 2 Sak 50kg (= 100 Kg)
    const res = await request(app)
      .post('/api/v1/transactions/checkout')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        items: [
          {
            productId: testData.product.id,
            unitId: testData.unitSak.id,
            qty: 2,
            unitPrice: 64000,
          },
        ],
        paymentMethod: 'CASH',
        notes: 'Uji potong stok 2 sak',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-/);
    expect(parseFloat(res.body.data.totalAmount)).toBe(128000);

    // Cek stok riil produk di database: harus berkurang 100 Kg (1.000 - 100 = 900 Kg)
    const updatedProduct = await Product.findByPk(testData.product.id);
    expect(updatedProduct.currentStockBase).toBe(900);
  });

  it('Harus menolak transaksi jika kuantitas barang melebihi sisa stok riil', async () => {
    // Sisa stok saat ini 900 Kg. Kasir mencoba menjual 20 Sak 50kg (= 1.000 Kg) -> Harus ditolak!
    const res = await request(app)
      .post('/api/v1/transactions/checkout')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        items: [
          {
            productId: testData.product.id,
            unitId: testData.unitSak.id,
            qty: 20,
          },
        ],
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('tidak mencukupi');
  });

  it('Harus menolak transaksi Kasbon jika melebihi plafon batas kredit mandor', async () => {
    // Mandor limit 5.000.000, hutang saat ini 1.000.000 (sisa plafon 4.000.000)
    // Mencoba kasbon Rp 4.500.000 -> Harus ditolak!
    const res = await request(app)
      .post('/api/v1/transactions/checkout')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerId: testData.customer.id,
        items: [
          {
            productId: testData.product.id,
            unitId: testData.unitKg.id,
            qty: 10,
            unitPrice: 1500, // Rp 15.000
          },
        ],
        payments: [
          { method: 'DEBT', amount: 4500000 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('terlampaui');
  });

  it('Harus sukses mencatat pembayaran cicilan kasbon dan mengurangi saldo hutang mandor', async () => {
    // Hutang mandor saat ini Rp 1.000.000, dibayar cicilan Rp 400.000 -> sisa Rp 600.000
    const res = await request(app)
      .post('/api/v1/debts/pay')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerId: testData.customer.id,
        amount: 400000,
        paymentMethod: 'CASH',
        notes: 'Cicilan proyek tahap 1',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remainingDebt).toBe(600000);

    const updatedCustomer = await Customer.findByPk(testData.customer.id);
    expect(parseFloat(updatedCustomer.currentDebt)).toBe(600000);
  });
});
