import { Router } from 'express';
import { getAllCustomers, getCustomerById, createCustomer } from '../controllers/customerController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', authenticate, createCustomer);

export default router;
