import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Enhanced audit logger middleware for sensitive operations
 * In production, this should integrate with a centralized logging system
 */
export function auditLog(action: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const userId = req.user?.id || 'anonymous';
    const username = req.user?.username || 'anonymous';
    const ip = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();

    // Log all sensitive operations
    const sensitiveActions = ['login', 'signup', 'delete', 'update', 'create', 'assign', 'remove', 'reset', 'forgot', 'logout'];
    const isSensitive = sensitiveActions.some((a) => action.toLowerCase().includes(a));

    if (isSensitive) {
      const auditEntry = {
        timestamp,
        action,
        userId,
        username,
        ip: Array.isArray(ip) ? ip[0] : ip,
        userAgent,
        method,
        path,
        status: 'initiated', // Will be updated by response interceptor if needed
      };

      // In production, send to centralized logging system (e.g., CloudWatch, ELK, Splunk)
      // eslint-disable-next-line no-console
      console.log(`[AUDIT] ${JSON.stringify(auditEntry)}`);

      // Log security events (failed logins, unauthorized access, etc.)
      if (action.includes('login') || action.includes('unauthorized') || action.includes('forbidden')) {
        // eslint-disable-next-line no-console
        console.warn(`[SECURITY EVENT] ${JSON.stringify(auditEntry)}`);
      }
    }

    next();
  };
}

/**
 * Log security events for monitoring and alerting
 */
export function logSecurityEvent(eventType: string, details: Record<string, any>, req: AuthenticatedRequest) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    userId: req.user?.id || 'anonymous',
    username: req.user?.username || 'anonymous',
    ip: req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    ...details,
  };

  // In production, send to SIEM or security monitoring system
  // eslint-disable-next-line no-console
  console.error(`[SECURITY ALERT] ${JSON.stringify(auditEntry)}`);
}







