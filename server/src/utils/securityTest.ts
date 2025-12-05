/**
 * Security testing utilities
 * These functions help test security features without affecting production code
 */

/**
 * Test if a string contains potential SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(\+)|(%))/,
    /(\bOR\b.*=.*)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Test if a string contains potential XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<img.*src.*=/i,
    /<svg.*onload/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Test if a string contains potential path traversal patterns
 */
export function containsPathTraversal(input: string): boolean {
  const pathPatterns = [
    /\.\./,
    /\.\.\//,
    /\.\.\\/,
    /\/\.\./,
    /\\\.\./,
  ];
  
  return pathPatterns.some(pattern => pattern.test(input));
}

/**
 * Test if a string contains potential command injection patterns
 */
export function containsCommandInjection(input: string): boolean {
  const commandPatterns = [
    /[;&|`$()]/,
    /\|\|/,
    /&&/,
    /`.*`/,
    /\$\(.*\)/,
    /<\(.*\)/,
  ];
  
  return commandPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate input against common attack patterns
 * Returns true if input appears safe, false if suspicious
 */
export function isInputSafe(input: string): boolean {
  if (!input || typeof input !== 'string') return true;
  
  return !(
    containsSQLInjection(input) ||
    containsXSS(input) ||
    containsPathTraversal(input) ||
    containsCommandInjection(input)
  );
}

/**
 * Get security score for input (0-100, higher is safer)
 */
export function getSecurityScore(input: string): number {
  if (!input || typeof input !== 'string') return 100;
  
  let score = 100;
  if (containsSQLInjection(input)) score -= 30;
  if (containsXSS(input)) score -= 30;
  if (containsPathTraversal(input)) score -= 20;
  if (containsCommandInjection(input)) score -= 20;
  
  return Math.max(0, score);
}

