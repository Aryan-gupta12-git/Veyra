import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'veyra-secret-key-change-in-production-2026';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('veyra_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  console.log('[REGISTER] request received');

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.warn('[REGISTER] Validation error: missing required fields');
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      console.warn('[REGISTER] Validation error: password too short');
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[REGISTER] email:', normalizedEmail);
    console.log('[REGISTER] safe body:', { name: name.trim(), email: normalizedEmail });

    // 4. Duplicate Email Check -> 409 Conflict
    let existingUser: any = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr: any) {
      console.error('[REGISTER] DB Connection/Query error when searching email:');
      console.error('[REGISTER] Full DB Error Message:', dbErr?.message);
      console.error('[REGISTER] Error Code:', dbErr?.code);

      // Return safe message without exposing local file system paths to the UI
      res.status(500).json({
        error: 'Unable to connect to database. Please ensure PostgreSQL server is running.',
      });
      return;
    }

    if (existingUser) {
      console.warn('[REGISTER] Conflict: Email already registered');
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Hash password using bcrypt
    console.log('[REGISTER] Hashing password with bcrypt...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in PostgreSQL with USER role
    console.log('[REGISTER] Reaching prisma.user.create()...');
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        onboardingCompleted: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('[REGISTER] User record created in DB:', newUser.id);

    // Generate JWT token
    console.log('[REGISTER] Generating JWT token...');
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    // Set secure HttpOnly cookie
    setAuthCookie(res, token);
    console.log('[REGISTER] HttpOnly cookie set successfully');

    res.status(201).json({ user: newUser });
  } catch (error: any) {
    console.error('[REGISTER] Internal server error:', error?.message);

    res.status(500).json({
      error: 'Unable to create account. Please try again.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log('[LOGIN] request received');

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr: any) {
      console.error('[LOGIN] DB Connection error:', dbErr?.message);
      res.status(500).json({
        error: 'Unable to connect to database. Please ensure PostgreSQL server is running.',
      });
      return;
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ user: safeUser });
  } catch (error: any) {
    console.error('[LOGIN] Error during login:', error?.message);
    res.status(500).json({
      error: 'Unable to authenticate. Please try again.',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('veyra_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log out' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        interests: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Error fetching current user:', error?.message);
    res.status(500).json({ error: 'Failed to retrieve current user session' });
  }
};
