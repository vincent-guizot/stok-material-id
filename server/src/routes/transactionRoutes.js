import { Router } from 'express';
import { checkout, getAllTransactions, getTransactionById } from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/checkout', authenticate, checkout);
router.get('/', authenticate, getAllTransactions);
router.get('/:id', authenticate, getTransactionById);

export default router;
