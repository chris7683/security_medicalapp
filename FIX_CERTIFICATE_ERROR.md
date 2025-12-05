# Fix Certificate Error - Step by Step

## Problem
Browser is blocking API calls because it doesn't trust the self-signed certificate.

## Solution 1: Accept Certificate in Browser (Quickest)

### Step 1: Visit Backend Directly First
Before using the frontend, open in your browser:
```
https://localhost:4443/health
```

### Step 2: Accept the Certificate
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost" or "Accept the Risk and Continue"
3. You should see: `{"status":"ok"}`

### Step 3: Now Use Frontend
After accepting the backend certificate, refresh your frontend and try logging in again.

---

## Solution 2: Trust Certificate in macOS Keychain (Permanent)

### Step 1: Open Certificate
```bash
open server/certs/server.crt
```

### Step 2: Add to Keychain
1. Keychain Access will open
2. Find "localhost" in the "login" keychain
3. Double-click it
4. Expand "Trust" section
5. Change "When using this certificate" to "Always Trust"
6. Close and enter your password

### Step 3: Restart Browser
Close and reopen your browser completely.

---

## Solution 3: Check CORS Configuration

Make sure CORS allows your frontend origin. Check `server/src/app.ts`:

```typescript
const allowedOrigins = new Set<string>([
  'http://localhost:4200',
  'https://localhost:4200',  // Make sure this is included
  ...configuredOrigins
]);
```

---

## Solution 4: Use HTTP for Development (Temporary Workaround)

If you need to work immediately, you can temporarily use HTTP:

### Backend:
```bash
# In server/.env, comment out or remove:
# USE_HTTPS=true
```

### Frontend:
```bash
cd client
npm start  # Regular HTTP
```

Then update `client/src/app/core/auth.service.ts` to use `http://localhost:4000/api`

---

## Solution 5: Generate Certificate with Proper SAN (Recommended)

The certificate needs to include Subject Alternative Names. Regenerate it:

```bash
cd server
rm certs/server.crt certs/server.key
npm run generate-certs
```

Then update the certificate generation to include SAN (see below).

---

## Quick Fix Commands

```bash
# 1. Visit backend to accept certificate
open https://localhost:4443/health

# 2. After accepting, refresh frontend
# Frontend should now work
```

---

## Verify It's Working

1. **Backend Health Check:**
   ```bash
   curl -k https://localhost:4443/health
   ```
   Should return: `{"status":"ok"}`

2. **Browser Console:**
   - Open DevTools (F12)
   - Check Network tab
   - API calls should go through (no red errors)

3. **Test Login:**
   - Try logging in from frontend
   - Should work after accepting certificate

---

## Why This Happens

Browsers have strict security policies:
- Self-signed certificates are not trusted by default
- Browsers block mixed content (HTTPS frontend → invalid HTTPS backend)
- You must explicitly trust the certificate

This is **normal for development** with self-signed certificates. In production, you'll use trusted certificates from Let's Encrypt or a commercial CA.

