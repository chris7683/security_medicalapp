import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Security monitoring middleware
 * Tracks suspicious activities and security events without affecting functionality
 */
export function securityMonitoring(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Attach request ID for tracking
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Track suspicious patterns (logging only, no blocking)
  const suspiciousPatterns = [
    /\.\./, // Path traversal attempts
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection attempts
    /exec\(/i, // Command injection attempts
  ];

  const url = req.url || '';
  const body = JSON.stringify(req.body || {}).toLowerCase();
  const query = JSON.stringify(req.query || {}).toLowerCase();
  const combined = `${url} ${body} ${query}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combined)) {
      logSecurityEvent('suspicious_pattern_detected', {
        requestId,
        pattern: pattern.toString(),
        url: req.url,
        method: req.method,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
      }, req as AuthenticatedRequest);
    }
  }

  // Monitor response time for potential DoS
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log slow requests (potential DoS)
    if (duration > 5000) {
      logSecurityEvent('slow_request', {
        requestId,
        duration,
        statusCode,
        url: req.url,
        method: req.method,
      }, req as AuthenticatedRequest);
    }

    // Log error responses
    if (statusCode >= 400) {
      logSecurityEvent('error_response', {
        requestId,
        statusCode,
        url: req.url,
        method: req.method,
        duration,
      }, req as AuthenticatedRequest);
    }

    // Log authentication failures
    if (statusCode === 401 || statusCode === 403) {
      logSecurityEvent('authentication_failure', {
        requestId,
        statusCode,
        url: req.url,
        method: req.method,
        ip: getClientIp(req),
      }, req as AuthenticatedRequest);
    }
  });

  next();
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Log security event (imported from auditLogger)
 */
function logSecurityEvent(eventType: string, details: Record<string, any>, req: AuthenticatedRequest) {
  // Import dynamically to avoid circular dependencies
  try {
    const { logSecurityEvent: logEvent } = require('./auditLogger');
    logEvent(eventType, details, req);
  } catch (error) {
    // Fallback logging if auditLogger is not available
    console.warn(`[SECURITY EVENT] ${eventType}:`, details);
  }
}

