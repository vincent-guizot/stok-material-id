import { Router } from 'express';
import { createBackup, listBackups } from '../controllers/backupController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', listBackups);
router.post('/', createBackup);
export default router;
