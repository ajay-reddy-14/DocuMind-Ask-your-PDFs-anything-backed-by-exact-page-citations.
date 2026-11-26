import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { registerSchema, loginSchema } from '../validators/auth.validators';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

authRouter.post('/register', authLimiter, validateBody(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validateBody(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);

