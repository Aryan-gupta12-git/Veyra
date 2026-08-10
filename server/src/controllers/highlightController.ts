import { Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getArticleHighlights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const articleParam = req.params.articleId;
    if (!articleParam) {
      res.status(400).json({ error: 'Article ID is required' });
      return;
    }
    const articleId = String(articleParam);

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

    const highlights = await prisma.highlight.findMany({
      where: {
        userId,
        articleId: article.id,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ highlights });
  } catch (err: any) {
    console.error('Error fetching highlights:', err);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
};

export const createArticleHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
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
      res.status(400).json({ error: 'selectedText is required and cannot be empty' });
      return;
    }

    if (selectedText.length > 5000) {
      res.status(400).json({ error: 'Selected text exceeds maximum length' });
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

    // Check for existing duplicate highlight for exact same range
    const existing = await prisma.highlight.findFirst({
      where: {
        userId,
        articleId: article.id,
        startOffset,
        endOffset,
        selectedText: selectedText.trim(),
      },
    });

    if (existing) {
      res.status(200).json({ highlight: existing });
      return;
    }

    const highlight = await prisma.highlight.create({
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

    res.status(201).json({ highlight });
  } catch (err: any) {
    console.error('Error creating highlight:', err);
    res.status(500).json({ error: 'Failed to create highlight' });
  }
};

export const deleteHighlight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const highlightParam = req.params.highlightId;
    if (!highlightParam) {
      res.status(400).json({ error: 'Highlight ID is required' });
      return;
    }
    const highlightId = String(highlightParam);

    const highlight = await prisma.highlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      res.status(404).json({ error: 'Highlight not found' });
      return;
    }

    if (highlight.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this highlight' });
      return;
    }

    await prisma.highlight.delete({
      where: { id: highlightId },
    });

    res.json({ success: true, message: 'Highlight removed successfully' });
  } catch (err: any) {
    console.error('Error deleting highlight:', err);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
};
