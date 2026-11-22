import { Router } from 'express';
import { listBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', authenticate, listBranches);
router.post('/', authenticate, authorize('admin'), createBranch);
router.put('/:id', authenticate, authorize('admin'), updateBranch);
router.delete('/:id', authenticate, authorize('admin'), deleteBranch);
export default router;
