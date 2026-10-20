import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import customerRoutes from './customerRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import debtRoutes from './debtRoutes.js';
import stockRoutes from './stockRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/debts', debtRoutes);
router.use('/stocks', stockRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'StokMaterial.id API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
