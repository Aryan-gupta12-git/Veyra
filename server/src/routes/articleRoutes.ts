import { Router } from 'express';
import { getPublicArticles, getPublicArticleById, toggleLikeArticle } from '../controllers/articleController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, getPublicArticles);
router.get('/:id', optionalAuth, getPublicArticleById);
router.post('/:id/like', requireAuth, toggleLikeArticle);

export default router;
