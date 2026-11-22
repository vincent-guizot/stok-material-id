import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WholesalePrice = sequelize.define('WholesalePrice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: false },
  unitId: { type: DataTypes.UUID, allowNull: false },
  label: { type: DataTypes.STRING, allowNull: false },
  minQty: { type: DataTypes.FLOAT, allowNull: false },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, comment: 'Harga per satuan bila qty >= minQty' },
  target: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'wholesale_prices', timestamps: true });

export default WholesalePrice;
