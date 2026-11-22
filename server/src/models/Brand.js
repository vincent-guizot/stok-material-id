import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Brand = sequelize.define('Brand', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  origin: { type: DataTypes.STRING, allowNull: true, comment: 'Produsen / prinsipal' },
}, { tableName: 'brands', timestamps: true });

export default Brand;
