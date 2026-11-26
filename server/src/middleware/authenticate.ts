import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { verifySessionToken } from '../utils/session';

// Extend Express Request with the authenticated user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.session as string | undefined;

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      throw new AppError('Invalid or expired session. Please log in again.', 401);
    }

    // Verify the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new AppError('User account not found.', 401);
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err) {
    next(err);
  }
}

