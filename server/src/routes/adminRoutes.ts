import { Router } from 'express';
import {
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  togglePublishArticle,
} from '../controllers/articleController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Protect ALL admin routes with Auth & Admin Role verification
router.use(requireAuth, requireAdmin);

router.get('/articles', getAdminArticles);
router.post('/articles', createArticle);
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);
router.patch('/articles/:id/publish', togglePublishArticle);

export default router;
