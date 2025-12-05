# Security Quick Start Guide

## ✅ Security Features Implemented

### Authentication & Access Control
- ✅ Strong password requirements (12+ chars, uppercase, lowercase, number, special char)
- ✅ Account lockout after 5 failed login attempts (15 minutes)
- ✅ JWT tokens with secure algorithm (HS256)
- ✅ Token expiration (15 minutes access, 7 days refresh)
- ✅ Role-based access control (RBAC)

### Rate Limiting
- ✅ General API: 100 requests/15min per IP
- ✅ Auth endpoints: 5 attempts/15min per IP
- ✅ Admin endpoints: 10 operations/hour per IP

### Input Security
- ✅ Input sanitization (XSS prevention)
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ Input validation on all endpoints
- ✅ HTTP Parameter Pollution prevention

### Database Security
- ✅ SSL support (enable in production)
- ✅ Connection pooling
- ✅ Least privilege user support (see `create_secure_db_user.sql`)

### Headers & Network
- ✅ Security headers (Helmet.js)
- ✅ Content Security Policy (CSP)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ CORS restrictions
- ✅ Request size limits (10MB)

### Monitoring
- ✅ Audit logging for sensitive operations
- ✅ Failed login tracking
- ✅ Security event logging

## 🚀 Quick Setup for Production

### 1. Database User Setup
```bash
# Run the SQL script to create a secure database user
psql -U postgres -d healthcare -f server/create_secure_db_user.sql
```

### 2. Environment Variables
Update your `.env` file with strong secrets:
```bash
# Generate strong secrets (use openssl or similar)
ACCESS_TOKEN_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)

# Enable SSL for database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Use dedicated database user
POSTGRES_USER=healthcare_app
POSTGRES_PASSWORD=your_strong_password_here

# Set production mode
NODE_ENV=production
```

### 3. Hash Existing Passwords
If you have existing users with plain-text passwords:
```bash
cd server
npm run hash-passwords
```

### 4. Security Checklist
- [ ] All passwords hashed
- [ ] Strong JWT secrets configured
- [ ] Database SSL enabled
- [ ] Dedicated DB user created
- [ ] CORS origins restricted
- [ ] NODE_ENV=production
- [ ] HTTPS enabled (via reverse proxy)
- [ ] Regular backups configured

## 📋 Password Requirements

**For New Users:**
- Minimum 12 characters
- Must include: uppercase letter, lowercase letter, number, special character (@$!%*?&)
- Username: 3-50 characters, alphanumeric + underscores only

## 🔒 Account Lockout

After **5 failed login attempts**, accounts are locked for **15 minutes**.

## 📊 Monitoring

Check audit logs in console output for:
- Login attempts
- User creation/deletion
- Admin operations
- Medication operations

## 🛡️ Additional Recommendations

1. **Use HTTPS** in production (reverse proxy like nginx)
2. **Regular Updates**: Run `npm audit` weekly
3. **Backup Strategy**: Regular database backups
4. **Monitoring**: Set up alerts for failed login spikes
5. **Security Reviews**: Quarterly security audits

## 📚 Full Documentation

See `server/SECURITY.md` for comprehensive security documentation.

## 🔍 Testing Security

### Test Rate Limiting
```bash
# Try to make more than 5 login attempts quickly
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Account Lockout
```bash
# Make 5 failed login attempts with same email
# 6th attempt should show lockout message
```

### Test Password Requirements
```bash
# Try to signup with weak password
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"weak","role":"patient"}'
```

## ⚠️ Important Notes

- **Development Mode**: Some security features are relaxed (e.g., plain-text password support for existing users)
- **Production Mode**: All security features are enforced
- **Secrets**: Never commit `.env` files or hardcode secrets
- **Updates**: Keep dependencies updated (`npm audit fix`)







