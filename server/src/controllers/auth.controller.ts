import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { createSessionToken, getSessionCookieOptions } from '../utils/session';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';

const SALT_ROUNDS = 12;

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = createSessionToken(user.id, user.email);
  res.cookie('session', token, getSessionCookieOptions());

  successResponse(res, user, 201);
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt compare (even when user not found) to prevent timing-based
  // user enumeration attacks
  const dummyHash = '$2b$12$invalidhashfortimingnormalization';
  const passwordToCheck = user?.passwordHash ?? dummyHash;
  const isValid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !isValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = createSessionToken(user.id, user.email);
  res.cookie('session', token, getSessionCookieOptions());

  successResponse(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('session', { path: '/' });
  successResponse(res, { message: 'Logged out successfully.' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  successResponse(res, user);
});

