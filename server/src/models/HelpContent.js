import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HelpContent = sequelize.define('HelpContent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  kind: { type: DataTypes.STRING, allowNull: false, comment: 'guide | video | faq | shortcut | contact | about' },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: true },
  extra: { type: DataTypes.STRING, allowNull: true, comment: 'guide: nama ikon | video: durasi | contact: jam layanan | about: versi' },
}, { tableName: 'help_contents', timestamps: true });

export default HelpContent;
