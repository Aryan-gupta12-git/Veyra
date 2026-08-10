import { Router } from 'express';
import { getTopics, saveUserInterests, getUserLikedArticles } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public topics endpoint
router.get('/topics', getTopics);

// Authenticated user interests endpoint
router.post('/interests', requireAuth, saveUserInterests);

// Authenticated user liked articles endpoint
router.get('/liked', requireAuth, getUserLikedArticles);

export default router;
