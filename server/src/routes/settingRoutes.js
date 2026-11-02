import { validate } from '../middlewares/validate.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('admin'), updateSettings);
router.post('/', authenticate, authorize('admin'), updateSettings);

export default router;
