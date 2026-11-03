import { validate } from '../middlewares/validate.js';
import { Router } from 'express';
import { payDebt, getDebtHistory } from '../controllers/debtController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.post('/pay', authenticate, payDebt);
router.get('/history', authenticate, getDebtHistory);

export default router;
