import { Request, Response, NextFunction } from 'express';

/**
 * Request validation middleware
 * Validates request structure and size without breaking functionality
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Validate request size (already limited in app.ts, but double-check)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({ 
      message: 'Request entity too large',
      maxSize: `${maxSize / 1024 / 1024}MB`
    });
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (contentType && !contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
      // Log but don't block (some clients might send different content types)
      const { logSecurityEvent } = require('./auditLogger');
      logSecurityEvent('unexpected_content_type', {
        contentType,
        path: req.path,
        method: req.method,
      }, req as any);
    }
  }

  next();
}

