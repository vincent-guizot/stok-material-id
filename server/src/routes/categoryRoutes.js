import { Router } from 'express';
import { getAllCategories, createCategory } from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/', getAllCategories);
router.post('/', authenticate, authorize('admin'), createCategory);

export default router;
