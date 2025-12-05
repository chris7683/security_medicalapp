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
 * Enhanced with structured logging and severity levels
 */
export function logSecurityEvent(eventType: string, details: Record<string, any>, req: AuthenticatedRequest) {
  const severity = getSeverityLevel(eventType);
  const auditEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    userId: req.user?.id || 'anonymous',
    username: req.user?.username || 'anonymous',
    ip: Array.isArray(req.ip) ? req.ip[0] : (req.ip || req.socket.remoteAddress || getClientIp(req) || 'unknown'),
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    requestId: (req as any).requestId || 'unknown',
    ...details,
  };

  // Log based on severity
  if (severity === 'critical' || severity === 'high') {
    // eslint-disable-next-line no-console
    console.error(`[SECURITY ALERT - ${severity.toUpperCase()}] ${JSON.stringify(auditEntry)}`);
  } else if (severity === 'medium') {
    // eslint-disable-next-line no-console
    console.warn(`[SECURITY EVENT - ${severity.toUpperCase()}] ${JSON.stringify(auditEntry)}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[SECURITY EVENT - ${severity.toUpperCase()}] ${JSON.stringify(auditEntry)}`);
  }

  // In production, send to SIEM or security monitoring system (e.g., CloudWatch, ELK, Splunk)
  // Example: await sendToSIEM(auditEntry);
}

/**
 * Get severity level for security event
 */
function getSeverityLevel(eventType: string): 'critical' | 'high' | 'medium' | 'low' {
  const critical = ['sql_injection', 'xss_attempt', 'command_injection', 'path_traversal', 'unauthorized_access'];
  const high = ['authentication_failure', 'brute_force', 'privilege_escalation', 'data_breach'];
  const medium = ['suspicious_pattern', 'rate_limit_exceeded', 'invalid_input', 'error_response'];
  
  const lowerType = eventType.toLowerCase();
  if (critical.some(c => lowerType.includes(c))) return 'critical';
  if (high.some(h => lowerType.includes(h))) return 'high';
  if (medium.some(m => lowerType.includes(m))) return 'medium';
  return 'low';
}

/**
 * Get client IP address
 */
function getClientIp(req: AuthenticatedRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}







