import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TransactionPayment = sequelize.define('TransactionPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('CASH', 'TRANSFER', 'QRIS', 'DEBT'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  referenceNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'transaction_payments',
  timestamps: true,
});

export default TransactionPayment;
