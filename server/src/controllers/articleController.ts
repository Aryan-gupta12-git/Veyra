import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { calculateReadingTime, generateSlug } from '../utils/readingTime.js';
import { sanitizeHtml } from '../utils/sanitizeHtml.js';

/**
 * Public: Get published articles (with topic filtering & interest prioritization)
 */
export const getPublicArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const topicSlug = req.query.topic ? String(req.query.topic) : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const authorId = req.query.authorId ? String(req.query.authorId) : undefined;
    const authorName = req.query.authorName ? String(req.query.authorName) : undefined;
    const excludeId = req.query.excludeId ? String(req.query.excludeId) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    let whereClause: any = { published: true };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    if (authorId) {
      whereClause.authorId = authorId;
    } else if (authorName) {
      whereClause.OR = [
        { authorName: { equals: authorName, mode: 'insensitive' } },
        { author: { name: { equals: authorName, mode: 'insensitive' } } },
      ];
    }

    if (topicSlug && topicSlug !== 'for-you' && topicSlug !== 'all') {
      const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } });
      if (topic) {
        whereClause.topicId = topic.id;
      }
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit && !isNaN(limit) ? limit : undefined,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        topic: true,
      },
    });

    // If userId provided and no specific author/topic, prioritize articles matching user's interests
    if (userId && (!topicSlug || topicSlug === 'for-you') && !authorId && !authorName) {
      const userInterests = await prisma.userInterest.findMany({
        where: { userId },
        select: { topicId: true },
      });
      const interestTopicIds = new Set(userInterests.map((ui) => ui.topicId));

      articles.sort((a, b) => {
        const aMatches = a.topicId && interestTopicIds.has(a.topicId) ? 1 : 0;
        const bMatches = b.topicId && interestTopicIds.has(b.topicId) ? 1 : 0;
        if (aMatches !== bMatches) return bMatches - aMatches;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    res.json({ articles });
  } catch (error: any) {
    console.error('Error fetching public articles:', error);
    res.status(500).json({ error: 'Failed to retrieve articles', details: error?.message });
  }
};

/**
 * Public: Get single published article by ID or Slug
 * Increments view count in PostgreSQL upon opening article detail
 */
export const getPublicArticleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        topic: true,
      },
    });

    if (!article) {
      res.status(404).json({ error: 'Article not found or unavailable' });
      return;
    }

    const skipView = req.query.skipView === 'true' || req.user?.role === 'ADMIN';

    // Increment view count asynchronously in background without blocking response
    if (!skipView) {
      prisma.article
        .update({
          where: { id: article.id },
          data: { views: { increment: 1 } },
        })
        .catch((err) => console.error('Failed to increment article view:', err));
    }

    let hasLiked = false;
    if (req.user?.id) {
      const userLike = await prisma.articleLike.findUnique({
        where: {
          userId_articleId: {
            userId: req.user.id,
            articleId: article.id,
          },
        },
      });
      hasLiked = Boolean(userLike);
    }

    res.json({ article: { ...article, hasLiked } });
  } catch (error: any) {
    console.error('Error fetching public article:', error);
    res.status(500).json({ error: 'Failed to retrieve article', details: error?.message });
  }
};

/**
 * Toggle like/unlike status for an article by authenticated user
 */
export const toggleLikeArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Authentication required to like articles' });
      return;
    }

    if (req.user.role === 'ADMIN') {
      res.status(403).json({ error: 'Admins cannot like articles' });
      return;
    }

    const idOrSlug = String(req.params.id);
    const targetArticle = await prisma.article.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, likes: true },
    });

    if (!targetArticle) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const articleId = targetArticle.id;
    const userId = req.user.id;

    const existingLike = await prisma.articleLike.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    let liked = false;
    let updatedLikesCount = targetArticle.likes;

    if (existingLike) {
      // Unlike article safely
      await prisma.articleLike.delete({
        where: {
          userId_articleId: { userId, articleId },
        },
      });

      const updatedArticle = await prisma.article.update({
        where: { id: articleId },
        data: { likes: Math.max(0, targetArticle.likes - 1) },
        select: { likes: true },
      });
      updatedLikesCount = updatedArticle.likes;
      liked = false;
    } else {
      // Like article
      await prisma.articleLike.create({
        data: { userId, articleId },
      });

      const updatedArticle = await prisma.article.update({
        where: { id: articleId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });
      updatedLikesCount = updatedArticle.likes;
      liked = true;
    }

    res.json({ liked, likes: updatedLikesCount });
  } catch (error: any) {
    console.error('Error toggling article like:', error);
    res.status(500).json({ error: 'Failed to update article like status', details: error?.message });
  }
};

/**
 * Admin: Get all articles (Drafts & Published)
 */
export const getAdminArticles = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('[GET /api/admin/articles] Reached endpoint. AUTH USER:', req.user);
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        topic: true,
      },
    });

    res.json({ articles });
  } catch (error: any) {
    console.error('Error fetching admin articles:', error);
    res.status(500).json({ error: 'Failed to retrieve admin articles', details: error?.message });
  }
};

/**
 * Admin: Create new article
 */
export const createArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('[POST /api/admin/articles] Reached endpoint');
  console.log('AUTH USER:', req.user);
  console.log('SUBMITTED BODY:', req.body);
  console.log('AUTHENTICATED USER ID:', req.user?.id);
  console.log('SUBMITTED TOPIC ID:', req.body.topicId);

  try {
    const { title, content, excerpt, coverImage, category, topicId, tags, authorName, published } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    if (String(title).trim().length > 100) {
      res.status(400).json({ error: 'Article title exceeds maximum length of 100 characters (~15 words).' });
      return;
    }

    if (excerpt && String(excerpt).trim().length > 180) {
      res.status(400).json({ error: 'Article excerpt/subtitle exceeds maximum length of 180 characters (~30 words).' });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'User context missing' });
      return;
    }

    // Verify user exists in Database
    const dbAuthor = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!dbAuthor) {
      console.error(`Author user ID '${req.user.id}' not found in User table`);
      res.status(400).json({ error: 'Authenticated user record does not exist in database' });
      return;
    }

    // Verify Topic foreign key relation
    let validTopicId: string | null = null;
    if (topicId) {
      const topicRecord = await prisma.topic.findFirst({
        where: {
          OR: [
            { id: topicId },
            { slug: String(topicId).toLowerCase() },
            { name: String(topicId) },
          ],
        },
      });

      if (topicRecord) {
        validTopicId = topicRecord.id;
      } else {
        console.log(`Topic '${topicId}' not found in DB, setting topicId = null`);
      }
    }

    const cleanContent = sanitizeHtml(content);
    const readingTime = calculateReadingTime(cleanContent);
    let slug = generateSlug(title);

    let existingSlug = await prisma.article.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content: cleanContent,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        category: category || null,
        topicId: validTopicId,
        tags: Array.isArray(tags) ? tags : [],
        readingTime,
        authorName: authorName && String(authorName).trim() ? String(authorName).trim() : dbAuthor.name,
        published: published !== undefined ? Boolean(published) : true,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        topic: true,
      },
    });

    console.log('[POST /api/admin/articles] Article created successfully:', article.id);
    res.status(201).json({ article });
  } catch (error: any) {
    console.error('Error creating article:', error);
    console.error('Prisma Error Code:', error.code);
    console.error('Prisma Error Message:', error.message);
    res.status(500).json({
      error: 'Failed to create article',
      details: error.message || String(error),
      code: error.code,
    });
  }
};

/**
 * Admin: Update existing article
 */
export const updateArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('[PUT /api/admin/articles/:id] Reached endpoint. ID:', req.params.id);
  console.log('AUTH USER:', req.user);
  console.log('SUBMITTED BODY:', req.body);

  try {
    const id = String(req.params.id);
    const { title, content, excerpt, coverImage, category, topicId, tags, authorName, published } = req.body;

    const existingArticle = await prisma.article.findUnique({ where: { id } });
    if (!existingArticle) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const updateData: any = {};

    if (title !== undefined && String(title).trim().length > 100) {
      res.status(400).json({ error: 'Article title exceeds maximum length of 100 characters (~15 words).' });
      return;
    }

    if (excerpt !== undefined && excerpt && String(excerpt).trim().length > 180) {
      res.status(400).json({ error: 'Article excerpt/subtitle exceeds maximum length of 180 characters (~30 words).' });
      return;
    }

    if (title !== undefined) {
      updateData.title = title;
      if (title !== existingArticle.title) {
        let newSlug = generateSlug(title);
        const existingSlug = await prisma.article.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });
        if (existingSlug) {
          newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
        }
        updateData.slug = newSlug;
      }
    }

    if (content !== undefined) {
      const cleanContent = sanitizeHtml(content);
      updateData.content = cleanContent;
      updateData.readingTime = calculateReadingTime(cleanContent);
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;
    if (category !== undefined) updateData.category = category || null;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (authorName !== undefined) updateData.authorName = authorName && String(authorName).trim() ? String(authorName).trim() : null;
    if (published !== undefined) updateData.published = Boolean(published);

    if (topicId !== undefined) {
      if (!topicId) {
        updateData.topicId = null;
      } else {
        const topicRecord = await prisma.topic.findFirst({
          where: {
            OR: [
              { id: topicId },
              { slug: String(topicId).toLowerCase() },
              { name: String(topicId) },
            ],
          },
        });
        updateData.topicId = topicRecord ? topicRecord.id : null;
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        topic: true,
      },
    });

    console.log('[PUT /api/admin/articles/:id] Article updated successfully:', article.id);
    res.json({ article });
  } catch (error: any) {
    console.error('Error updating article:', error);
    console.error('Prisma Error Code:', error.code);
    console.error('Prisma Error Message:', error.message);
    res.status(500).json({
      error: 'Failed to update article',
      details: error.message || String(error),
      code: error.code,
    });
  }
};

/**
 * Admin: Delete article
 */
export const deleteArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existingArticle = await prisma.article.findUnique({ where: { id } });
    if (!existingArticle) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    await prisma.article.delete({ where: { id } });
    res.json({ message: 'Article deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article', details: error?.message });
  }
};

/**
 * Admin: Toggle publish status
 */
export const togglePublishArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { published } = req.body;

    const article = await prisma.article.update({
      where: { id },
      data: { published: Boolean(published) },
    });

    res.json({ article });
  } catch (error: any) {
    console.error('Error toggling publish article:', error);
    res.status(500).json({ error: 'Failed to toggle publish status', details: error?.message });
  }
};
