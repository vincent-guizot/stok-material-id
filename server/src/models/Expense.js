import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expenseDate: { type: DataTypes.DATEONLY, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  paymentMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: 'CASH' },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'expenses', timestamps: true });

export default Expense;
