import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { Router } from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.get('/', authenticate, getAllSuppliers);
router.get('/:id', authenticate, getSupplierById);
router.post('/', authenticate, createSupplier);
router.put('/:id', authenticate, updateSupplier);
router.delete('/:id', authenticate, deleteSupplier);

export default router;
