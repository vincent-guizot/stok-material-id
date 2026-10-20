import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  baseUnit: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Satuan dasar / terkecil (contoh: Kg, Meter, Pcs, Biji)',
  },
  minStock: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Batas minimal stok peringatan dalam satuan dasar',
  },
  currentStockBase: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Stok riil absolut tersimpan dalam satuan dasar (Base Unit)',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'products',
  timestamps: true,
});

export default Product;
