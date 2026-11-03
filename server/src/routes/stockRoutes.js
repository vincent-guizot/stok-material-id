import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { Router } from 'express';
import {
  addStock,
  adjustStock,
  outStock,
  transferStock,
  getMovements,
} from '../controllers/stockController.js';

const router = Router();
router.use(validate);
router.param('id', (req, res, next) => validate(req, res, next));

router.post('/in', authenticate, addStock);
router.post('/out', authenticate, outStock);
router.post('/transfer', authenticate, transferStock);
router.post('/adjust', authenticate, adjustStock);
router.get('/movements', authenticate, getMovements);

export default router;
