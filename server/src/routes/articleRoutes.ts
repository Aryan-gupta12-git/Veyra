import { Router } from 'express';
import { getPublicArticles, getPublicArticleById, toggleLikeArticle } from '../controllers/articleController.js';
import { getArticleHighlights, createArticleHighlight } from '../controllers/highlightController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, getPublicArticles);
router.get('/:id', optionalAuth, getPublicArticleById);
router.post('/:id/like', requireAuth, toggleLikeArticle);

// Highlight routes (require auth)
router.get('/:articleId/highlights', requireAuth, getArticleHighlights);
router.post('/:articleId/highlights', requireAuth, createArticleHighlight);

export default router;
