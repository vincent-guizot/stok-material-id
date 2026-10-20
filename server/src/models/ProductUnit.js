import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductUnit = sequelize.define('ProductUnit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  unitName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nama satuan (contoh: Kg, Sak 40kg, Sak 50kg, Lonjor 12m, Dus)',
  },
  conversionFactor: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1,
    comment: 'Faktor pengali terhadap Base Unit (misal 1 Sak 50kg = 50 Kg)',
  },
  buyPrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Harga modal / HPP per unit satuan ini',
  },
  sellPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Harga jual kasir per unit satuan ini',
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Terkecil / Base, 2 = Menengah, 3 = Terbesar',
  },
  isBase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'product_units',
  timestamps: true,
});

export default ProductUnit;
