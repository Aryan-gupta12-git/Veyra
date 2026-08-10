import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createKnowledgeItem, getUserKnowledgeItems } from '../controllers/knowledgeController.js';

const router = Router();

router.get('/knowledge', requireAuth, getUserKnowledgeItems);
router.post('/articles/:articleId/knowledge', requireAuth, createKnowledgeItem);

export default router;
