import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DebtPayment = sequelize.define('DebtPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Opsional: jika pelunasan dialokasikan spesifik ke 1 nota',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'TRANSFER', 'QRIS'),
    defaultValue: 'CASH',
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  receivedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'debt_payments',
  timestamps: true,
});

export default DebtPayment;
