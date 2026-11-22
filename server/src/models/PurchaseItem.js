import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  purchaseId: { type: DataTypes.UUID, allowNull: false },
  productId: { type: DataTypes.UUID, allowNull: false },
  unitId: { type: DataTypes.UUID, allowNull: false },
  productName: { type: DataTypes.STRING, allowNull: false },
  unitName: { type: DataTypes.STRING, allowNull: false },
  qty: { type: DataTypes.FLOAT, allowNull: false },
  conversionFactor: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
  qtyBaseUnit: { type: DataTypes.FLOAT, allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, comment: 'Harga beli per satuan pembelian' },
  subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
}, { tableName: 'purchase_items', timestamps: true });

export default PurchaseItem;
