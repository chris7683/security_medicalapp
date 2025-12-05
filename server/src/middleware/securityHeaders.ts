import { Request, Response, NextFunction } from 'express';

/**
 * Additional security headers middleware
 * Complements Helmet with additional security headers
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security header
  res.setHeader('X-Content-Security-Policy', 'default-src \'self\'');
  
  next();
}

