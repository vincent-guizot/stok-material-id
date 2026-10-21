import sequelize from '../config/database.js';
import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import ProductUnit from './ProductUnit.js';
import Customer from './Customer.js';
import Transaction from './Transaction.js';
import TransactionItem from './TransactionItem.js';
import TransactionPayment from './TransactionPayment.js';
import DebtPayment from './DebtPayment.js';
import StockMovement from './StockMovement.js';
import Supplier from './Supplier.js';
import Setting from './Setting.js';

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Product <-> ProductUnit (1 Produk punya banyak satuan bertingkat 1, 2, 3)
Product.hasMany(ProductUnit, { foreignKey: 'productId', as: 'units', onDelete: 'CASCADE' });
ProductUnit.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Product <-> StockMovement
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Customer <-> Transaction
Customer.hasMany(Transaction, { foreignKey: 'customerId', as: 'transactions' });
Transaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Customer <-> DebtPayment
Customer.hasMany(DebtPayment, { foreignKey: 'customerId', as: 'debtPayments' });
DebtPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Transaction <-> TransactionItem
Transaction.hasMany(TransactionItem, { foreignKey: 'transactionId', as: 'items', onDelete: 'CASCADE' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Transaction <-> TransactionPayment
Transaction.hasMany(TransactionPayment, { foreignKey: 'transactionId', as: 'payments', onDelete: 'CASCADE' });
TransactionPayment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Transaction <-> User (Cashier)
User.hasMany(Transaction, { foreignKey: 'cashierId', as: 'sales' });
Transaction.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });

// User <-> DebtPayment (Collector)
User.hasMany(DebtPayment, { foreignKey: 'receivedBy', as: 'receivedPayments' });
DebtPayment.belongsTo(User, { foreignKey: 'receivedBy', as: 'collector' });

export {
  sequelize,
  User,
  Category,
  Product,
  ProductUnit,
  Customer,
  Transaction,
  TransactionItem,
  TransactionPayment,
  DebtPayment,
  StockMovement,
  Supplier,
  Setting,
};

export default {
  sequelize,
  User,
  Category,
  Product,
  ProductUnit,
  Customer,
  Transaction,
  TransactionItem,
  TransactionPayment,
  DebtPayment,
  StockMovement,
  Supplier,
  Setting,
};
