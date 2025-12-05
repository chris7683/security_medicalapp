import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

const tokens = new Tokens();

// Store secrets in memory (keyed by IP address)
// In production, use Redis or database for distributed systems
const secrets = new Map<string, string>();

// Cleanup old secrets periodically (every hour)
setInterval(() => {
  // In production, implement proper cleanup with TTL
}, 3600000);

/**
 * Generate CSRF token for the session
 * Note: For JWT-based APIs, CSRF is less critical but still useful for cookie-based operations
 */
export function generateCSRFToken(req: Request, res: Response, next: NextFunction) {
  // Use IP address as session identifier (for stateless API)
  const sessionId = req.ip || 'unknown';
  
  // Get or create secret for this IP
  let sessionSecret = secrets.get(sessionId);
  
  if (!sessionSecret) {
    sessionSecret = tokens.secretSync();
    secrets.set(sessionId, sessionSecret);
  }
  
  // Generate token (sessionSecret is guaranteed to be defined here)
  const token = tokens.create(sessionSecret as string);
  
  // Store token in response locals
  res.locals.csrfToken = token;
  
  // Set CSRF token in response header
  res.setHeader('X-CSRF-Token', token);
  
  // Also set as cookie for easier access (if using cookies)
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Allow JavaScript to read it (needed for Angular)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  });
  
  next();
}

/**
 * Verify CSRF token from request
 * Note: CSRF protection is optional for JWT-based APIs but recommended for cookie-based auth
 */
export function verifyCSRF(optional: boolean = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip if JWT token is present (JWT is immune to CSRF)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return next();
    }
    
    // Get secret for this IP
    const sessionId = req.ip || 'unknown';
    const sessionSecret = secrets.get(sessionId);
    
    if (!sessionSecret) {
      if (optional) {
        return next();
      }
      return res.status(403).json({ message: 'CSRF token validation failed: No session secret' });
    }
    
    // Get token from header, body, or cookie
    const token = req.headers['x-csrf-token'] 
      || req.headers['x-xsrf-token']
      || req.body._csrf 
      || req.query._csrf 
      || req.cookies['XSRF-TOKEN'];
    
    if (!token) {
      if (optional) {
        return next();
      }
      return res.status(403).json({ message: 'CSRF token missing' });
    }
    
    // Verify token
    if (!tokens.verify(sessionSecret, token as string)) {
      if (optional) {
        return next();
      }
      return res.status(403).json({ message: 'CSRF token validation failed: Invalid token' });
    }
    
    next();
  };
}

/**
 * Get CSRF token endpoint (for frontend to retrieve token)
 */
export function getCSRFToken(req: Request): string | null {
  const sessionId = req.ip || 'unknown';
  const sessionSecret = secrets.get(sessionId);
  
  if (!sessionSecret) {
    return null;
  }
  
  return tokens.create(sessionSecret);
}

