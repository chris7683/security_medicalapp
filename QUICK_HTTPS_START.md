# Quick HTTPS Start Guide

## For Development (Self-Signed Certificates)

### Step 1: Generate Certificates
```bash
cd server
npm run generate-certs
```

### Step 2: Enable HTTPS
Add to `server/.env`:
```env
USE_HTTPS=true
HTTPS_PORT=4443
```

### Step 3: Start Server
```bash
npm run dev:https
# OR
npm run dev  # (if USE_HTTPS=true is in .env)
```

### Step 4: Access Application
- Backend: `https://localhost:4443`
- Frontend: Update to use `https://localhost:4443/api` or access frontend via HTTPS

**Note:** Browser will show security warning for self-signed cert. Click "Advanced" → "Proceed to localhost" (this is safe for development).

## For Production

### Option 1: Let's Encrypt (Free)
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

Then set in `.env`:
```env
USE_HTTPS=true
HTTPS_PORT=443
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Option 2: Reverse Proxy (Recommended)
Use Nginx/Apache as reverse proxy with SSL termination. See `HTTPS_SETUP_GUIDE.md` for details.

## Troubleshooting

**Certificate not found?**
- Run `npm run generate-certs` first

**Port already in use?**
- Change `HTTPS_PORT` in `.env`

**Browser security warning?**
- Normal for self-signed certs in development
- Accept the warning to proceed

For detailed instructions, see `HTTPS_SETUP_GUIDE.md`

