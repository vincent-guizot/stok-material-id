import { validate } from '../middlewares/validate.js';
import { Router } from 'express';
import { login, register, me, listUsers, updateUser, deleteUser, changePassword } from '../controllers/authController.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.post('/login', login);
router.post('/register', authenticate, authorize('admin'), register);
router.get('/me', authenticate, me);

router.get('/users', authenticate, authorize('admin'), listUsers);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.put('/password', authenticate, changePassword);

export default router;
