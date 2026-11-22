import { Router } from 'express';
import { getHelp } from '../controllers/helpController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/', authenticate, getHelp);
export default router;
