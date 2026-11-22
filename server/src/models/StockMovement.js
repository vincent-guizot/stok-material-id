import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('SALE', 'IN', 'ADJUSTMENT', 'RETURN', 'OUT', 'TRANSFER', 'OPNAME'),
    allowNull: false,
  },
  qtyBaseUnit: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Perubahan jumlah dalam satuan dasar (bisa negatif jika keluar)',
  },
  previousStock: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  newStock: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refNo: { type: DataTypes.STRING, allowNull: true, comment: 'Nomor dokumen (DO-/MUT-/PO-)' },
  fromLocation: { type: DataTypes.STRING, allowNull: true },
  toLocation: { type: DataTypes.STRING, allowNull: true },
  destination: { type: DataTypes.STRING, allowNull: true },
  receiver: { type: DataTypes.STRING, allowNull: true },
  driver: { type: DataTypes.STRING, allowNull: true },
  reason: { type: DataTypes.STRING, allowNull: true },
  unitName: { type: DataTypes.STRING, allowNull: true, comment: 'Satuan yang diinput pengguna' },
  qtyInput: { type: DataTypes.FLOAT, allowNull: true, comment: 'Jumlah dalam satuan input' },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'stock_movements',
  timestamps: true,
});

export default StockMovement;
