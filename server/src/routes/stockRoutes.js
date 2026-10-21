import { Router } from 'express';
import {
  addStock,
  adjustStock,
  outStock,
  transferStock,
  getMovements,
} from '../controllers/stockController.js';

const router = Router();

router.post('/in', addStock);
router.post('/out', outStock);
router.post('/transfer', transferStock);
router.post('/adjust', adjustStock);
router.get('/movements', getMovements);

export default router;
