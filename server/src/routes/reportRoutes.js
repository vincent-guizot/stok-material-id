import { validate } from '../middlewares/validate.js';
import { Router } from 'express';
import { getDashboardSummary } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.get('/summary', authenticate, authorize('admin'), getDashboardSummary);

export default router;
