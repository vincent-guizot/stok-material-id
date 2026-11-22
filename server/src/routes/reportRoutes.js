import { Router } from 'express';
import { getDashboardSummary, getOverview, getPurchasesReport, getProfitLoss, getCashFlow, getStockReport } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/summary', authenticate, authorize('admin'), getDashboardSummary);

router.get('/overview', authenticate, authorize('admin'), getOverview);
router.get('/purchases', authenticate, authorize('admin'), getPurchasesReport);
router.get('/profit-loss', authenticate, authorize('admin'), getProfitLoss);
router.get('/cash-flow', authenticate, authorize('admin'), getCashFlow);
router.get('/stock', authenticate, authorize('admin'), getStockReport);

export default router;
