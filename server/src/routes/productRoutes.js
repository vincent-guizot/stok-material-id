import { Router } from 'express';
import { getAllProducts, getProductById, createProduct } from '../controllers/productController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, authorize('admin', 'warehouse'), createProduct);

export default router;
