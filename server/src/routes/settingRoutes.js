import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

// Tarif PPN memengaruhi nominal uang, jadi mengubahnya wajib login sebagai admin.
const guardTaxChange = (req, res, next) => {
  if (req.body && req.body.taxRate !== undefined) {
    return authenticate(req, res, (err) => {
      if (err) return next(err);
      return authorize('admin')(req, res, next);
    });
  }
  return next();
};

router.get('/', getSettings);
router.put('/', authenticate, authorize('admin'), guardTaxChange, updateSettings);
router.post('/', authenticate, authorize('admin'), guardTaxChange, updateSettings);

export default router;
