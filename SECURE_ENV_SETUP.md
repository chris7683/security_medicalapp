# Securing Your .env File

## ⚠️ IMPORTANT: Change Default Secrets

The default secrets in your `.env` file (`change_me_access` and `change_me_refresh`) are **NOT SECURE** and must be changed before deploying to production or sharing your code.

## Why Change These Secrets?

- **ACCESS_TOKEN_SECRET** and **REFRESH_TOKEN_SECRET**: Used to sign and verify JWT tokens. If compromised, attackers could forge authentication tokens.
- **POSTGRES_PASSWORD**: Database password. If compromised, attackers could access all your data.

## Methods to Generate Secure Secrets

### Method 1: Using the Helper Script (Recommended)

```bash
cd server
node generate-secrets.js
```

This will output secure random secrets that you can copy directly into your `.env` file.

### Method 2: Using Node.js Command Line

```bash
# Generate ACCESS_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Method 3: Using OpenSSL

```bash
# Generate ACCESS_TOKEN_SECRET (128 hex characters = 64 bytes)
openssl rand -hex 64

# Generate REFRESH_TOKEN_SECRET
openssl rand -hex 64
```

### Method 4: Using Python

```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

### Method 5: Online Generator (Use with Caution)

⚠️ **Only use trusted online generators if you're on a secure network and trust the service.**

## Example Secure .env File

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:4200

# JWT Secrets - MUST be changed from defaults!
ACCESS_TOKEN_SECRET=f2684aaf80f6377a2f9cfb0fabddb9d35997a6ea4db2881870adff81fbe1891bd20f23eaa5217fc648e7ab8131a48aaca3fe506325d8411bac4db16ddb7702ca
REFRESH_TOKEN_SECRET=a4aa46da8eb4f9089eb4f6fb891953b9c56179a3ac300ae67b716251f8e0133541ac0a99214a1345b0687c129a9a3502258eb24cc0e119ba8e5b7281b021f1f0

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database Configuration
POSTGRES_DB=healthcare
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here  # Change this too!
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Email configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - Make sure `.env` is in your `.gitignore` file
   - Use `.env.example` with placeholder values instead

2. **Use different secrets for different environments**
   - Development, staging, and production should have different secrets
   - Never reuse production secrets in development

3. **Rotate secrets periodically**
   - Change secrets if you suspect they've been compromised
   - Rotate secrets every 6-12 months as a best practice

4. **Keep secrets long and random**
   - Use at least 64 bytes (128 hex characters) for JWT secrets
   - Use cryptographically secure random number generators

5. **Store production secrets securely**
   - Use environment variables or secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never hardcode secrets in your application code

## Quick Setup Commands

```bash
# Navigate to server directory
cd server

# Generate secrets
node generate-secrets.js

# Copy the output and paste into your .env file
# Make sure to replace the old values!
```

## Verifying Your Secrets Are Set

After updating your `.env` file, restart your server and verify:

```bash
# Check if secrets are loaded (don't do this in production!)
node -e "require('dotenv').config(); console.log('ACCESS_TOKEN_SECRET length:', process.env.ACCESS_TOKEN_SECRET?.length || 0);"
```

You should see a length of 128 characters (64 bytes × 2 hex characters per byte).

## What Happens If Secrets Are Compromised?

If your JWT secrets are compromised:
1. **Immediately rotate all secrets** - Generate new ones and update your `.env`
2. **Force all users to re-authenticate** - Invalidate all existing tokens
3. **Review access logs** - Check for any unauthorized access
4. **Update your security practices** - Review how the compromise occurred

## Additional Security Recommendations

- Use environment-specific `.env` files (`.env.development`, `.env.production`)
- Consider using a secrets management service for production
- Enable database SSL/TLS connections in production
- Use strong database passwords (at least 16 characters, mixed case, numbers, symbols)
- Regularly audit who has access to your secrets

