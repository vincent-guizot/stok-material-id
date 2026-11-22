import { Router } from 'express';
import { getNotifications } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/', authenticate, getNotifications);
export default router;
