import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: 'admin' | 'doctor' | 'nurse' | 'patient'; username: string };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    // Log authentication failure for security monitoring
    const { logSecurityEvent } = require('./auditLogger');
    logSecurityEvent('authentication_failure', {
      reason: 'missing_or_invalid_header',
      path: req.path,
      method: req.method,
    }, req);
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role as any, username: payload.username };
    return next();
  } catch (error) {
    // Log authentication failure for security monitoring
    const { logSecurityEvent } = require('./auditLogger');
    logSecurityEvent('authentication_failure', {
      reason: 'invalid_or_expired_token',
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'unknown',
    }, req);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(roles: Array<'admin' | 'doctor' | 'nurse' | 'patient'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Log unauthorized access attempt
      const { logSecurityEvent } = require('./auditLogger');
      logSecurityEvent('unauthorized_access', {
        reason: 'no_user',
        path: req.path,
        method: req.method,
        requiredRoles: roles,
      }, req);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      // Log forbidden access attempt (role mismatch)
      const { logSecurityEvent } = require('./auditLogger');
      logSecurityEvent('unauthorized_access', {
        reason: 'insufficient_permissions',
        path: req.path,
        method: req.method,
        userRole: req.user.role,
        requiredRoles: roles,
      }, req);
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}


