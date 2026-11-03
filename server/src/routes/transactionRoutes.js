import { validate } from '../middlewares/validate.js';
import { Router } from 'express';
import { checkout, getAllTransactions, getTransactionById } from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.post('/', authenticate, checkout);
router.post('/checkout', authenticate, checkout);
router.get('/', authenticate, getAllTransactions);
router.get('/:id', authenticate, getTransactionById);

export default router;
