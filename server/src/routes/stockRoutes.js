import { Router } from 'express';
import { addStock, outStock, transferStock, adjustStock, opnameStock, getMovements } from '../controllers/stockController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.post('/in', authenticate, addStock);
router.post('/out', authenticate, outStock);
router.post('/transfer', authenticate, transferStock);
router.post('/adjust', authenticate, authorize('admin'), adjustStock);
router.post('/opname', authenticate, authorize('admin'), opnameStock);
router.get('/movements', authenticate, getMovements);

export default router;
