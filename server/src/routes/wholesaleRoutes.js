import { Router } from 'express';
import { listWholesale, createWholesale, updateWholesale, deleteWholesale } from '../controllers/wholesaleController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', authenticate, listWholesale);
router.post('/', authenticate, authorize('admin'), createWholesale);
router.put('/:id', authenticate, authorize('admin'), updateWholesale);
router.delete('/:id', authenticate, authorize('admin'), deleteWholesale);
export default router;
