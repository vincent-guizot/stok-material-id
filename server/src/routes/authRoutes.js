import { Router } from 'express';
import { login, register, me, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.post('/login', login);
// Pendaftaran akun hanya oleh admin (sebelumnya terbuka untuk umum)
router.post('/register', authenticate, authorize('admin'), register);
router.get('/me', authenticate, me);
router.put('/password', authenticate, changePassword);

export default router;
