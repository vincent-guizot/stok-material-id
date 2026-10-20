import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TransactionItem = sequelize.define('TransactionItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unitName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Satuan yang dipilih kasir saat transaksi (misal: Sak 50kg)',
  },
  qty: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Jumlah dalam satuan yang dipilih',
  },
  conversionFactor: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1,
  },
  qtyBaseUnit: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Jumlah riil yang memotong stok dasar (qty * conversionFactor)',
  },
  unitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'transaction_items',
  timestamps: true,
});

export default TransactionItem;
