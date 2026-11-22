import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Purchase = sequelize.define('Purchase', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  number: { type: DataTypes.STRING, allowNull: false, unique: true },
  supplierId: { type: DataTypes.UUID, allowNull: false },
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: false },
  paymentTerm: { type: DataTypes.STRING, allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Diterima Lengkap' },
  paymentStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'LUNAS', comment: 'LUNAS | BELUM_LUNAS' },
  totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paidAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  paidAt: { type: DataTypes.DATEONLY, allowNull: true, comment: 'Tanggal kas keluar (saat lunas)' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'purchases', timestamps: true });

export default Purchase;
