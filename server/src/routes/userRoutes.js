import { Router } from 'express';
import { listUsers, createUser, updateUser } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
export default router;
