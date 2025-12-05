import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

interface FailedAttempt {
  count: number;
  windowStart: number;
  lockExpiresAt?: number;
}

// In-memory store for failed login attempts
// In production, use Redis or database
const failedAttempts = new Map<string, FailedAttempt>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function checkAccountLockout(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body as { email?: string };
  if (!email) return next();

  const emailNormalized = email.trim().toLowerCase();
  const key = `email:${emailNormalized}`;
  const attempt = failedAttempts.get(key);

  // Check if account is locked
  if (attempt?.lockExpiresAt && attempt.lockExpiresAt > Date.now()) {
    const remainingMinutes = Math.ceil((attempt.lockExpiresAt - Date.now()) / (60 * 1000));
    return res.status(429).json({
      message: `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
    });
  }

  // Clear expired attempts or lockouts after duration
  if (attempt && attempt.lockExpiresAt && attempt.lockExpiresAt <= Date.now()) {
    failedAttempts.delete(key);
  } else if (attempt && Date.now() - attempt.windowStart >= LOCKOUT_DURATION_MS) {
    failedAttempts.delete(key);
  }

  return next();
}

export function recordFailedLogin(email: string) {
  const emailNormalized = email.trim().toLowerCase();
  const key = `email:${emailNormalized}`;
  const now = Date.now();
  let attempt = failedAttempts.get(key);

  if (!attempt || now - attempt.windowStart >= LOCKOUT_DURATION_MS) {
    attempt = { count: 0, windowStart: now };
  }

  if (attempt.lockExpiresAt && attempt.lockExpiresAt > now) {
    // Already locked, keep lock duration
    failedAttempts.set(key, attempt);
    return;
  }

  attempt.count += 1;

  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.lockExpiresAt = now + LOCKOUT_DURATION_MS;
    attempt.count = 0;
    attempt.windowStart = now;
  }

  failedAttempts.set(key, attempt);
}

export function clearFailedLogin(email: string) {
  const emailNormalized = email.trim().toLowerCase();
  const key = `email:${emailNormalized}`;
  failedAttempts.delete(key);
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, attempt] of failedAttempts.entries()) {
    if ((attempt.lockExpiresAt && attempt.lockExpiresAt <= now) || now - attempt.windowStart >= LOCKOUT_DURATION_MS) {
      failedAttempts.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute







