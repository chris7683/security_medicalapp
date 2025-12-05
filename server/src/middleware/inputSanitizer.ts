import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Sanitize string inputs to prevent XSS and injection attacks
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  // Skip sanitization for OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Sanitize body (create new object instead of mutating)
  if (req.body && typeof req.body === 'object') {
    const sanitized = sanitizeObject(req.body);
    // Replace body with sanitized version
    Object.keys(req.body).forEach(key => delete req.body[key]);
    Object.assign(req.body, sanitized);
  }

  // Note: req.query and req.params are read-only in Express 5
  // They are already handled by express-validator in route validators
  // We'll sanitize them in the validators instead

  next();
}

function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === 'string' ? validator.escape(item) : sanitizeObject(item)));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Escape HTML entities to prevent XSS
        sanitized[key] = validator.escape(value.trim());
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return validator.isEmail(email) && validator.isLength(email, { min: 5, max: 100 });
}

/**
 * Validate and sanitize username
 */
export function sanitizeUsername(username: string): string {
  return validator.escape(validator.trim(username));
}

