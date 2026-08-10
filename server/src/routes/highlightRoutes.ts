import { Router } from 'express';
import { deleteHighlight } from '../controllers/highlightController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.delete('/:highlightId', requireAuth, deleteHighlight);

export default router;
