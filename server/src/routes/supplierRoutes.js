import { Router } from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/', authenticate, getAllSuppliers);
router.get('/:id', authenticate, getSupplierById);
router.post('/', authenticate, authorize('admin'), createSupplier);
router.put('/:id', authenticate, authorize('admin'), updateSupplier);
router.delete('/:id', authenticate, authorize('admin'), deleteSupplier);

export default router;
