import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

/**
 * Public: Get all available topics
 */
export const getTopics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to retrieve topics' });
  }
};

/**
 * Authenticated: Save user selected topic interests
 */
export const saveUserInterests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User authentication required' });
      return;
    }

    const { topicIds } = req.body;
    if (!Array.isArray(topicIds) || topicIds.length < 3) {
      res.status(400).json({ error: 'Please select at least 3 topics of interest' });
      return;
    }

    const userId = req.user.id;

    // Delete existing interests and recreate new selections
    await prisma.userInterest.deleteMany({
      where: { userId },
    });

    const interestData = topicIds.map((topicId: string) => ({
      userId,
      topicId,
    }));

    await prisma.userInterest.createMany({
      data: interestData,
    });

    // Mark onboarding as completed
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      include: {
        interests: {
          include: {
            topic: true,
          },
        },
      },
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error saving user interests:', error);
    res.status(500).json({ error: 'Failed to save user interests' });
  }
};

/**
 * Authenticated: Get all articles liked by current user
 */
export const getUserLikedArticles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const likedRecords = await prisma.articleLike.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        article: {
          include: {
            author: { select: { id: true, name: true, email: true, role: true } },
            topic: true,
          },
        },
      },
    });

    const articles = likedRecords.map((record) => ({
      ...record.article,
      hasLiked: true,
    }));

    res.json({ articles });
  } catch (error) {
    console.error('Error fetching user liked articles:', error);
    res.status(500).json({ error: 'Failed to retrieve liked articles' });
  }
};
