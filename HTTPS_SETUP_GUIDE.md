# HTTPS Setup Guide

This guide explains how to configure HTTPS for your healthcare application.

## Table of Contents
1. [Development Setup (Self-Signed Certificates)](#development-setup)
2. [Production Setup (Trusted Certificates)](#production-setup)
3. [Frontend Configuration](#frontend-configuration)
4. [Troubleshooting](#troubleshooting)

## Development Setup

### Step 1: Generate Self-Signed Certificates

For local development, you can use self-signed certificates:

```bash
cd server
npm run generate-certs
```

This will create:
- `server/certs/server.key` - Private key
- `server/certs/server.crt` - Self-signed certificate

**Note:** Your browser will show a security warning for self-signed certificates. This is normal for development.

### Step 2: Configure Environment Variables

Add to your `server/.env` file:

```env
# Enable HTTPS
USE_HTTPS=true
HTTPS_PORT=4443

# SSL Certificate Paths (optional - defaults to server/certs/)
# SSL_CERT_PATH=/path/to/server.crt
# SSL_KEY_PATH=/path/to/server.key
# SSL_CA_PATH=/path/to/ca.crt  # Optional: for certificate chain
```

### Step 3: Start the Server

```bash
# Development with HTTPS
npm run dev:https

# Or set USE_HTTPS=true in .env and run normally
npm run dev
```

### Step 4: Access the Application

- Backend: `https://localhost:4443`
- Frontend: Update `client/src/app/core/auth.service.ts` to use `https://localhost:4443/api`

**Important:** When accessing `https://localhost:4443` for the first time, your browser will show a security warning. Click "Advanced" → "Proceed to localhost" to continue.

## Production Setup

### Option 1: Let's Encrypt (Recommended - Free)

1. **Install Certbot:**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   ```

2. **Obtain Certificate:**
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

3. **Configure Environment Variables:**
   ```env
   USE_HTTPS=true
   HTTPS_PORT=443
   SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
   SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
   ```

4. **Auto-Renewal (Cron Job):**
   ```bash
   sudo certbot renew --dry-run
   # Add to crontab: 0 0 * * * certbot renew --quiet
   ```

### Option 2: Commercial SSL Certificate

1. Purchase an SSL certificate from a trusted CA (DigiCert, GlobalSign, etc.)

2. Configure paths in `.env`:
   ```env
   USE_HTTPS=true
   HTTPS_PORT=443
   SSL_CERT_PATH=/path/to/your/certificate.crt
   SSL_KEY_PATH=/path/to/your/private.key
   SSL_CA_PATH=/path/to/ca-bundle.crt  # If provided
   ```

### Option 3: Reverse Proxy (Nginx/Apache)

If using a reverse proxy (recommended for production):

1. **Nginx Configuration:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

2. **Node.js Configuration:**
   ```env
   # Don't use HTTPS in Node.js if using reverse proxy
   USE_HTTPS=false
   PORT=4000
   ```

3. **Trust Proxy:**
   The app already has `app.set('trust proxy', 1)` configured, which is required for reverse proxies.

## Frontend Configuration

### Update API Base URL

Update `client/src/app/core/auth.service.ts`:

```typescript
private readonly apiBase = 
  process.env['API_BASE_URL'] || 
  (process.env['NODE_ENV'] === 'production' 
    ? 'https://yourdomain.com/api' 
    : 'https://localhost:4443/api');
```

### Angular Development Server with HTTPS

For local development, you can also run Angular with HTTPS:

1. **Create `client/ssl` directory and generate certificates:**
   ```bash
   cd client
   mkdir ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
   ```

2. **Update `angular.json`:**
   ```json
   "serve": {
     "options": {
       "ssl": true,
       "sslKey": "ssl/key.pem",
       "sslCert": "ssl/cert.pem"
     }
   }
   ```

3. **Or use command line:**
   ```bash
   ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem
   ```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `USE_HTTPS` | Enable HTTPS server | `false` | No |
| `HTTPS_PORT` | HTTPS server port | `4443` | No |
| `SSL_CERT_PATH` | Path to SSL certificate | `server/certs/server.crt` | Yes (if USE_HTTPS=true) |
| `SSL_KEY_PATH` | Path to SSL private key | `server/certs/server.key` | Yes (if USE_HTTPS=true) |
| `SSL_CA_PATH` | Path to CA certificate chain | - | No |
| `NODE_ENV` | Environment (production enables HTTPS redirect) | `development` | No |

## Troubleshooting

### Certificate Errors

**Problem:** "SSL certificate files not found"
- **Solution:** Run `npm run generate-certs` or provide correct paths in `.env`

**Problem:** "NET::ERR_CERT_AUTHORITY_INVALID" in browser
- **Solution:** This is normal for self-signed certificates. Click "Advanced" → "Proceed to localhost"

### Port Already in Use

**Problem:** "EADDRINUSE: address already in use"
- **Solution:** Change `HTTPS_PORT` in `.env` or stop the process using the port

### Mixed Content Warnings

**Problem:** Frontend shows mixed content warnings
- **Solution:** Ensure all API calls use `https://` URLs

### Reverse Proxy Issues

**Problem:** App doesn't detect HTTPS behind reverse proxy
- **Solution:** Ensure `app.set('trust proxy', 1)` is set (already configured)
- **Solution:** Ensure reverse proxy sets `X-Forwarded-Proto: https` header

## Security Best Practices

1. ✅ **Always use HTTPS in production**
2. ✅ **Use strong SSL/TLS configuration**
3. ✅ **Keep certificates up to date**
4. ✅ **Use HSTS (already configured in Helmet)**
5. ✅ **Redirect HTTP to HTTPS (automatic in production)**
6. ✅ **Use secure cookie flags (already configured)**
7. ✅ **Regular certificate renewal (Let's Encrypt: 90 days)**

## Testing HTTPS

```bash
# Test certificate validity
openssl x509 -in server/certs/server.crt -text -noout

# Test HTTPS connection
curl -k https://localhost:4443/health  # -k ignores self-signed cert warning

# Test with proper certificate validation (production)
curl https://yourdomain.com/health
```

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP Transport Layer Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

