import { Router } from 'express';
import { payDebt, getDebtHistory } from '../controllers/debtController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/pay', authenticate, payDebt);
router.get('/history', authenticate, getDebtHistory);

export default router;
