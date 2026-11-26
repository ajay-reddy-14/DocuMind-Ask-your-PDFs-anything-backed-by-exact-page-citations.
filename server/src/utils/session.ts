import crypto from 'crypto';
import { env } from '../config/env';

interface SessionPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a signed session token (HMAC-SHA256 over a JSON payload).
 * We deliberately avoid JWT to keep the dependency footprint small.
 * Format: base64(payload) + "." + base64(signature)
 */
export function createSessionToken(userId: string, email: string): string {
  const payload: SessionPayload = {
    userId,
    email,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a session token and returns the payload, or null on failure.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    // Constant-time comparison to prevent timing attacks
    const expectedSig = sign(payloadBase64);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8')
    );

    if (payload.exp < Date.now()) return null; // expired

    return payload;
  } catch {
    return null;
  }
}

function sign(data: string): string {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(data).digest('base64url');
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_MS,
    path: '/',
  };
}

