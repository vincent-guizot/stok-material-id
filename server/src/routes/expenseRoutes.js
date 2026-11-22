import { Router } from 'express';
import { listExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', listExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);
export default router;
