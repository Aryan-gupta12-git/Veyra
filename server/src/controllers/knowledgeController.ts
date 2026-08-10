import { Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const createKnowledgeItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const articleParam = req.params.articleId;
    const { selectedText, startOffset, endOffset, contextBefore, contextAfter } = req.body;

    if (!articleParam) {
      res.status(400).json({ error: 'Article ID is required' });
      return;
    }
    const articleId = String(articleParam);

    if (!selectedText || typeof selectedText !== 'string' || !selectedText.trim()) {
      res.status(400).json({ error: 'selectedText is required' });
      return;
    }

    if (
      typeof startOffset !== 'number' ||
      typeof endOffset !== 'number' ||
      startOffset < 0 ||
      endOffset <= startOffset
    ) {
      res.status(400).json({ error: 'Invalid text offsets provided' });
      return;
    }

    // Resolve article by ID or Slug
    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id: articleId }, { slug: articleId }],
      },
      select: { id: true },
    });

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    console.log('[KNOWLEDGE POST]', {
      userId,
      articleId: article.id,
      selectedTextLength: selectedText.trim().length,
    });

    // Check for existing duplicate knowledge item for exact same range
    const existingKnowledge = await prisma.knowledgeItem.findFirst({
      where: {
        userId,
        articleId: article.id,
        startOffset,
        endOffset,
        selectedText: selectedText.trim(),
      },
    });

    // Also ensure a visual Highlight exists for this range in the article
    let highlight = await prisma.highlight.findFirst({
      where: {
        userId,
        articleId: article.id,
        startOffset,
        endOffset,
      },
    });

    if (!highlight) {
      highlight = await prisma.highlight.create({
        data: {
          userId,
          articleId: article.id,
          selectedText: selectedText.trim(),
          startOffset,
          endOffset,
          contextBefore: contextBefore || null,
          contextAfter: contextAfter || null,
        },
      });
    }

    if (existingKnowledge) {
      console.log('[KNOWLEDGE SAVED (EXISTING)]', existingKnowledge.id);
      res.status(200).json({ knowledgeItem: existingKnowledge, highlight });
      return;
    }

    // Create Knowledge Item
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        userId,
        articleId: article.id,
        selectedText: selectedText.trim(),
        startOffset,
        endOffset,
        contextBefore: contextBefore || null,
        contextAfter: contextAfter || null,
      },
    });

    console.log('[KNOWLEDGE SAVED]', knowledgeItem.id);

    res.status(201).json({ knowledgeItem, highlight });
  } catch (err: any) {
    console.error('Error creating Knowledge Item:', err);
    res.status(500).json({ error: err.message || 'Failed to save to Knowledge' });
  }
};

export const getUserKnowledgeItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { userId },
      include: {
        article: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            authorName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ knowledgeItems });
  } catch (err: any) {
    console.error('Error fetching Knowledge Items:', err);
    res.status(500).json({ error: 'Failed to fetch Knowledge Items' });
  }
};
