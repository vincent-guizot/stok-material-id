import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: 'system_settings',
  },
  storeName: {
    type: DataTypes.STRING,
    defaultValue: 'Toko Sentosa',
  },
  storeAddress: {
    type: DataTypes.TEXT,
    defaultValue: 'Jl. Raya Gresik No. 123, Gresik, Jawa Timur 61111',
  },
  storePhone: {
    type: DataTypes.STRING,
    defaultValue: '031-1234567',
  },
  storeEmail: {
    type: DataTypes.STRING,
    defaultValue: 'tokosentosa@gmail.com',
  },
  logoUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  headerReceipt: {
    type: DataTypes.TEXT,
    defaultValue: 'TOKO SENTOSA\nToko Bangunan & Material Konstruksi\nJl. Raya Gresik No. 123\nTelp. 031-1234567',
  },
  footerReceipt: {
    type: DataTypes.TEXT,
    defaultValue: 'Terima kasih telah berbelanja\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
  },
  showLogo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  showAddress: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  showPhone: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  showCashier: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  showThanks: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  autoPrint: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lowStockAlert: {
    type: DataTypes.STRING,
    defaultValue: '50',
  },
  emptyStockAlert: {
    type: DataTypes.STRING,
    defaultValue: '0',
  },
  allowMinusStock: {
    type: DataTypes.STRING,
    defaultValue: 'no',
  },
  showHppCashier: {
    type: DataTypes.STRING,
    defaultValue: 'no',
  },
  branches: {
    type: DataTypes.JSON,
    defaultValue: [
      { id: 1, name: 'Depo Pusat Sentosa', address: 'Jl. Raya Gresik No. 123', type: 'Toko Utama & Gudang Pusat', status: 'Aktif' },
      { id: 2, name: 'Cabang Sentosa Surabaya', address: 'Jl. Raya Darmo Indah No. 8', type: 'Depo Material Barat', status: 'Aktif' },
      { id: 3, name: 'Cabang Sentosa Sidoarjo', address: 'Jl. Pahlawan No. 56', type: 'Depo Material Selatan', status: 'Dalam Persiapan' },
    ],
  },
  usersList: {
    type: DataTypes.JSON,
    defaultValue: [
      { id: 1, name: 'Vincent (Owner)', username: 'admin', role: 'Admin (Bos)', status: 'Aktif', badge: '👑' },
      { id: 2, name: 'Siti Rahmawati', username: 'kasir', role: 'Kasir Toko', status: 'Aktif', badge: '🛒' },
      { id: 3, name: 'Agus Santoso', username: 'gudang', role: 'Staf Gudang', status: 'Aktif', badge: '📦' },
    ],
  },
}, {
  tableName: 'settings',
  timestamps: true,
});

export default Setting;
