import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Branch = sequelize.define('Branch', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Aktif' },
  isMain: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'branches', timestamps: true });

export default Branch;
