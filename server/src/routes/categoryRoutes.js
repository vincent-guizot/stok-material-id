import { validate } from '../middlewares/validate.js';
import { Router } from 'express';
import { getAllCategories, createCategory } from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.get('/', authenticate, getAllCategories);
router.post('/', authenticate, authorize('admin'), createCategory);

export default router;
