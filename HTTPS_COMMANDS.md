# HTTPS Commands - Quick Reference

## Development Setup (Self-Signed Certificates)

### Step 1: Generate SSL Certificates (One-time setup)
```bash
cd server
npm run generate-certs
```

This creates:
- `server/certs/server.key` - Private key
- `server/certs/server.crt` - Certificate

### Step 2: Configure Environment
Add to `server/.env`:
```env
USE_HTTPS=true
HTTPS_PORT=4443
```

### Step 3: Start Backend Server with HTTPS
```bash
cd server
npm run dev:https
```

**OR** if `USE_HTTPS=true` is already in `.env`:
```bash
cd server
npm run dev
```

### Step 4: Start Frontend (Optional - with HTTPS)
```bash
cd client
npm start
```

The frontend will run on `http://localhost:4200` by default. To use HTTPS for frontend too, see below.

### Step 5: Access Your Application
- **Backend API:** `https://localhost:4443`
- **Frontend:** `http://localhost:4200` (or `https://localhost:4200` if configured)

**Important:** Your browser will show a security warning for self-signed certificates. Click "Advanced" → "Proceed to localhost" (this is safe for development).

---

## Complete Command Sequence

### First Time Setup:
```bash
# 1. Navigate to server directory
cd server

# 2. Generate certificates (one-time)
npm run generate-certs

# 3. Add HTTPS configuration to .env
echo "USE_HTTPS=true" >> .env
echo "HTTPS_PORT=4443" >> .env

# 4. Start server with HTTPS
npm run dev:https
```

### Daily Usage (After Setup):
```bash
# Terminal 1: Start Backend
cd server
npm run dev:https

# Terminal 2: Start Frontend (optional)
cd client
npm start
```

---

## Production Commands

### Option 1: Direct HTTPS (Node.js handles SSL)
```bash
# Set environment variables
export USE_HTTPS=true
export HTTPS_PORT=443
export SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
export SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
export NODE_ENV=production

# Build and start
cd server
npm run build
npm start
```

### Option 2: With PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
cd server
npm run build
pm2 start dist/server.js --name healthcare-api

# View logs
pm2 logs healthcare-api

# Restart
pm2 restart healthcare-api
```

### Option 3: With Reverse Proxy (Nginx)
```bash
# Node.js runs on HTTP (Nginx handles SSL)
export USE_HTTPS=false
export PORT=4000
export NODE_ENV=production

# Start server
cd server
npm run build
npm start
```

---

## Frontend with HTTPS (Development)

### Generate Frontend Certificates:
```bash
cd client
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### Start Frontend with HTTPS:
```bash
cd client
ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem
```

Access at: `https://localhost:4200`

---

## Testing HTTPS

### Test Backend Health Endpoint:
```bash
# With self-signed cert (development)
curl -k https://localhost:4443/health

# With valid cert (production)
curl https://yourdomain.com/health
```

### Test API Endpoint:
```bash
# Login test
curl -k -X POST https://localhost:4443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Troubleshooting Commands

### Check if certificates exist:
```bash
ls -la server/certs/
```

### Check if port is in use:
```bash
# macOS/Linux
lsof -i :4443

# Kill process on port
kill -9 $(lsof -t -i:4443)
```

### View server logs:
```bash
# If using nodemon (development)
# Logs appear in terminal

# If using PM2 (production)
pm2 logs healthcare-api
```

### Verify certificate:
```bash
openssl x509 -in server/certs/server.crt -text -noout
```

---

## Environment Variables Summary

### Development (.env):
```env
USE_HTTPS=true
HTTPS_PORT=4443
PORT=4000
NODE_ENV=development
```

### Production (.env):
```env
USE_HTTPS=true
HTTPS_PORT=443
PORT=4000
NODE_ENV=production
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
SSL_CA_PATH=/path/to/ca.crt  # Optional
```

---

## Quick Start Script

Create `start-https.sh`:
```bash
#!/bin/bash
cd server
if [ ! -f "certs/server.crt" ]; then
  echo "Generating certificates..."
  npm run generate-certs
fi
if ! grep -q "USE_HTTPS=true" .env; then
  echo "USE_HTTPS=true" >> .env
  echo "HTTPS_PORT=4443" >> .env
fi
npm run dev:https
```

Make it executable:
```bash
chmod +x start-https.sh
./start-https.sh
```

---

## Common Workflows

### Development Workflow:
```bash
# Terminal 1
cd server && npm run dev:https

# Terminal 2  
cd client && npm start

# Access: https://localhost:4443 (backend)
# Access: http://localhost:4200 (frontend)
```

### Production Build:
```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
# Deploy dist/ folder to web server
```

---

## Notes

- **Development:** Self-signed certificates will show browser warnings (normal)
- **Production:** Use Let's Encrypt or commercial certificates
- **Port 4443:** Default HTTPS port for development (avoids conflicts)
- **Port 443:** Standard HTTPS port for production
- **HTTP Redirect:** Automatically redirects HTTP to HTTPS in production

