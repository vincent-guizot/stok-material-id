import { Router } from 'express';
import { createPurchase, listPurchases, getPurchase, payPurchase } from '../controllers/purchaseController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', authenticate, listPurchases);
router.get('/:id', authenticate, getPurchase);
router.post('/', authenticate, authorize('admin', 'warehouse'), createPurchase);
router.post('/:id/pay', authenticate, authorize('admin'), payPurchase);
export default router;
