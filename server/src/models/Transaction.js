import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Null jika pembeli umum / anonim',
  },
  cashierId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transactionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  discount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Nominal yang sudah dibayarkan saat transaksi (Tunai/QRIS/Transfer)',
  },
  debtAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Nominal yang masuk kasbon / tempo',
  },
  paymentStatus: {
    type: DataTypes.ENUM('PAID', 'PARTIAL', 'UNPAID'),
    defaultValue: 'PAID',
    comment: 'PAID = Lunas, PARTIAL = DP/Sebagian, UNPAID = Tempo Penuh',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

export default Transaction;
