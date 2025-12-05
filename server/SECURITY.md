# Security Documentation

## Overview
This application implements comprehensive security measures to protect against common vulnerabilities and attacks.

## Security Features Implemented

### 1. Authentication & Authorization
- **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication with access and refresh tokens
- **Token Security**: 
  - Algorithm specified (HS256) to prevent algorithm confusion attacks
  - Issuer and audience validation
  - Short-lived access tokens (15 minutes default)
  - Refresh token rotation support
- **Account Lockout**: Accounts are locked after 5 failed login attempts for 15 minutes
- **Password Requirements**: 
  - Minimum 12 characters
  - Must contain uppercase, lowercase, number, and special character
  - Username validation (alphanumeric + underscores only)

### 2. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication Endpoints**: 5 login attempts per 15 minutes per IP
- **Sensitive Operations**: 10 operations per hour per IP (admin routes)
- **Successful requests excluded** from auth rate limiting

### 3. Input Validation & Sanitization
- **express-validator**: All inputs validated and sanitized
- **XSS Prevention**: HTML entities escaped in user inputs
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries (no raw SQL)
- **Input Trimming**: All string inputs trimmed
- **Email Validation**: Strict email format validation and normalization

### 4. Database Security
- **SSL Support**: Database connections support SSL (enabled in production)
- **Connection Pooling**: Configured with secure limits (max 10, min 2 connections)
- **Parameterized Queries**: All database queries use Sequelize ORM (prevents SQL injection)
- **Least Privilege**: Use dedicated database user with minimal required permissions

### 5. HTTP Security Headers
- **Helmet.js**: Comprehensive security headers
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
- **CORS**: Restricted to allowed origins only
- **HTTP Parameter Pollution**: Prevented using hpp middleware

### 6. Request Security
- **Request Size Limits**: 10MB limit to prevent DoS attacks
- **Compression**: Gzip compression enabled
- **Trust Proxy**: Configured for accurate IP addresses (important for rate limiting)

### 7. Audit Logging
All sensitive operations are logged with:
- Timestamp
- User ID and username
- IP address
- Action performed
- HTTP method and path

Logged operations include:
- User authentication (login, signup, logout, token refresh)
- Admin operations (user CRUD, patient assignments)
- Medication operations (create, delete)

### 8. Error Handling
- **Generic Error Messages**: Internal errors hidden in production
- **No Information Leakage**: Error messages don't reveal system details
- **Structured Error Responses**: Consistent error format

## Database Security Best Practices

### 1. Create a Dedicated Database User
```sql
-- Create a dedicated user for the application
CREATE USER healthcare_app WITH PASSWORD 'strong_random_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE healthcare TO healthcare_app;
GRANT USAGE ON SCHEMA public TO healthcare_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO healthcare_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO healthcare_app;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO healthcare_app;
```

### 2. Enable SSL for Database Connections
In production, set these environment variables:
```bash
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### 3. Regular Security Updates
- Keep PostgreSQL updated
- Regularly update npm dependencies
- Monitor security advisories

## Environment Variables Security

### Required Environment Variables
```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
POSTGRES_DB=healthcare
POSTGRES_USER=healthcare_app  # Use dedicated user, not postgres
POSTGRES_PASSWORD=strong_random_password  # Use strong password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DB_SSL=true  # Enable in production
DB_SSL_REJECT_UNAUTHORIZED=true

# JWT Secrets (MUST be strong random strings in production)
ACCESS_TOKEN_SECRET=generate_strong_random_secret_here
REFRESH_TOKEN_SECRET=generate_strong_random_secret_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_ORIGIN=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Security Recommendations
1. **Never commit .env files** to version control
2. **Use strong, unique secrets** for JWT tokens (minimum 32 characters)
3. **Rotate secrets regularly** (quarterly recommended)
4. **Use different secrets** for development and production
5. **Limit .env file permissions** (chmod 600)

## Production Deployment Security Checklist

- [ ] All passwords are hashed (run `npm run hash-passwords` if needed)
- [ ] Strong JWT secrets configured
- [ ] Database SSL enabled
- [ ] Dedicated database user created with least privileges
- [ ] CORS origins restricted to production domains
- [ ] NODE_ENV set to 'production'
- [ ] Rate limiting enabled (default)
- [ ] HTTPS enabled (use reverse proxy like nginx)
- [ ] Security headers configured (Helmet)
- [ ] Error logging configured (don't log sensitive data)
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Dependencies updated (run `npm audit` and fix vulnerabilities)
- [ ] Environment variables secured (use secrets management)

## Security Monitoring

### Regular Tasks
1. **Dependency Audits**: Run `npm audit` weekly
2. **Security Updates**: Apply security patches promptly
3. **Log Review**: Review audit logs for suspicious activity
4. **Rate Limit Monitoring**: Monitor rate limit violations
5. **Failed Login Attempts**: Review account lockout events

### Incident Response
1. **Immediate Actions**:
   - Review audit logs
   - Check for unauthorized access
   - Rotate compromised secrets
   - Block malicious IPs if needed

2. **Investigation**:
   - Analyze attack patterns
   - Review affected user accounts
   - Check database for unauthorized changes

3. **Recovery**:
   - Restore from backups if needed
   - Update security measures
   - Notify affected users
   - Document incident

## Additional Security Recommendations

1. **Two-Factor Authentication (2FA)**: Consider implementing for admin accounts
2. **Session Management**: Implement session timeout
3. **IP Whitelisting**: Consider for admin endpoints
4. **WAF (Web Application Firewall)**: Use in production
5. **DDoS Protection**: Use CDN or cloud provider protection
6. **Regular Penetration Testing**: Conduct quarterly security audits
7. **Security Training**: Train developers on secure coding practices

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do NOT** create a public issue
2. **Email** security concerns to the development team
3. **Provide** detailed information about the vulnerability
4. **Allow** time for the issue to be addressed before disclosure

## Compliance

This application follows security best practices aligned with:
- OWASP Top 10
- NIST Cybersecurity Framework
- HIPAA considerations (for healthcare data)

Note: For HIPAA compliance, additional measures may be required (encryption at rest, BAA with hosting providers, etc.).







