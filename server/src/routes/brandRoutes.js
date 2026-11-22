import { Router } from 'express';
import { getAllBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brandController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', authenticate, getAllBrands);
router.post('/', authenticate, authorize('admin'), createBrand);
router.put('/:id', authenticate, authorize('admin'), updateBrand);
router.delete('/:id', authenticate, authorize('admin'), deleteBrand);
export default router;
