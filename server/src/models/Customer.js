import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nama Langganan / Mandor / Kontraktor',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Plafon batas maksimal hutang kasbon (contoh: Rp 10.000.000)',
  },
  currentDebt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Total saldo hutang kasbon yang belum dilunasi',
  },
  termDays: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
    comment: 'Batas jatuh tempo hari pembayaran (misal 14 hari atau 30 hari)',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'customers',
  timestamps: true,
});

export default Customer;
