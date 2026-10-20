import bcrypt from 'bcryptjs';
import {
  sequelize,
  User,
  Category,
  Product,
  ProductUnit,
  Customer,
} from '../../src/models/index.js';
import { ensureDatabaseExists } from '../../src/config/database.js';

export async function setupTestDatabase() {
  await ensureDatabaseExists();
  await sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash('admin123', 10);
  const kasirPasswordHash = await bcrypt.hash('kasir123', 10);

  // Users
  const admin = await User.create({
    name: 'Admin Test',
    username: 'admintest',
    password: passwordHash,
    role: 'admin',
  });

  const kasir = await User.create({
    name: 'Kasir Test',
    username: 'kasirtest',
    password: kasirPasswordHash,
    role: 'cashier',
  });

  // Category
  const category = await Category.create({
    name: 'Semen & Mortar',
    icon: '🧱',
  });

  // Product with 3-tier units
  const product = await Product.create({
    sku: 'TEST-SMN-01',
    name: 'Semen Gresik Test',
    categoryId: category.id,
    baseUnit: 'Kg',
    minStock: 100,
    currentStockBase: 1000, // 1000 Kg = 20 Sak @ 50kg
  });

  const unitKg = await ProductUnit.create({
    productId: product.id,
    unitName: 'Kg',
    conversionFactor: 1,
    buyPrice: 1200,
    sellPrice: 1500,
    level: 1,
    isBase: true,
  });

  const unitSak = await ProductUnit.create({
    productId: product.id,
    unitName: 'Sak 50kg',
    conversionFactor: 50,
    buyPrice: 57000,
    sellPrice: 64000,
    level: 2,
    isBase: false,
  });

  // Customer
  const customer = await Customer.create({
    name: 'Pak Mandor Test',
    phone: '08123456789',
    creditLimit: 5000000,
    currentDebt: 1000000,
    termDays: 14,
  });

  return {
    admin,
    kasir,
    category,
    product,
    unitKg,
    unitSak,
    customer,
  };
}
