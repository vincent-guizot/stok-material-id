import { Router } from 'express';
import { addStock, adjustStock, getMovements } from '../controllers/stockController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.post('/in', authenticate, authorize('admin', 'warehouse'), addStock);
router.post('/adjust', authenticate, authorize('admin'), adjustStock);
router.get('/movements', authenticate, getMovements);

export default router;
