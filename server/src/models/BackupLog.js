import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BackupLog = sequelize.define('BackupLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fileName: { type: DataTypes.STRING, allowNull: false },
  sizeBytes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  rowCounts: { type: DataTypes.JSONB, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'backup_logs', timestamps: true });

export default BackupLog;
