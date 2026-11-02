import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.get('/', authenticate, getAllProducts);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;
