import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import customerRoutes from './customerRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import debtRoutes from './debtRoutes.js';
import stockRoutes from './stockRoutes.js';
import reportRoutes from './reportRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import brandRoutes from './brandRoutes.js';
import purchaseRoutes from './purchaseRoutes.js';
import userRoutes from './userRoutes.js';
import branchRoutes from './branchRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import wholesaleRoutes from './wholesaleRoutes.js';
import helpRoutes from './helpRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import backupRoutes from './backupRoutes.js';
import settingRoutes from './settingRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/debts', debtRoutes);
router.use('/stocks', stockRoutes);
router.use('/reports', reportRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/brands', brandRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/expenses', expenseRoutes);
router.use('/wholesale', wholesaleRoutes);
router.use('/help', helpRoutes);
router.use('/notifications', notificationRoutes);
router.use('/backup', backupRoutes);
router.use('/settings', settingRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'StokMaterial.id API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
