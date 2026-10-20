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
    type: DataTypes.ENUM('SALE', 'IN', 'ADJUSTMENT', 'RETURN'),
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'stock_movements',
  timestamps: true,
});

export default StockMovement;
