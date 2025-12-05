# Run Full Application with HTTPS

Complete guide to run both frontend and backend with HTTPS.

## 🎯 Overview

- **Backend:** HTTPS on port 4443
- **Frontend:** HTTPS on port 4200
- **API Calls:** Frontend automatically uses HTTPS backend

---

## 📋 Step-by-Step Setup

### Step 1: Generate Backend Certificates (Already Done ✅)

Your backend certificates are ready at `server/certs/`

### Step 2: Generate Frontend Certificates

```bash
cd client
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### Step 3: Configure Backend (.env)

Make sure `server/.env` has:
```env
USE_HTTPS=true
HTTPS_PORT=4443
FRONTEND_ORIGIN=https://localhost:4200
```

### Step 4: Update Frontend API URL

The frontend already auto-detects HTTPS, but you can verify in `client/src/app/core/auth.service.ts` it uses the correct protocol.

---

## 🚀 Running the Application

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev:https
```

**Terminal 2 - Frontend:**
```bash
cd client
ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem
```

### Option 2: Using npm scripts (if configured)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev:https
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run start:https  # (if you add this script)
```

---

## 📝 Add Frontend HTTPS Script (Optional)

Add to `client/package.json`:

```json
"scripts": {
  "start": "ng serve",
  "start:https": "ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem",
  ...
}
```

Then you can use:
```bash
cd client
npm run start:https
```

---

## 🌐 Access Your Application

Once both servers are running:

- **Frontend:** `https://localhost:4200`
- **Backend API:** `https://localhost:4443`
- **Health Check:** `https://localhost:4443/health`

---

## ⚠️ Browser Security Warnings

Both frontend and backend will show security warnings for self-signed certificates. This is **normal for development**.

**For each (frontend and backend):**
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost" or "Accept the Risk"
3. You may need to do this twice (once for frontend, once for backend API calls)

---

## 🔍 Verify Everything Works

### Test Backend:
```bash
curl -k https://localhost:4443/health
```
Should return: `{"status":"ok"}`

### Test Frontend:
Open browser: `https://localhost:4200`

### Test API Connection:
Open browser console (F12) and check Network tab when frontend makes API calls. They should go to `https://localhost:4443/api/*`

---

## 🛠️ Complete Startup Script

Create `start-full-https.sh` in project root:

```bash
#!/bin/bash

echo "🔒 Starting Full Application with HTTPS..."
echo ""

# Check backend certificates
if [ ! -f "server/certs/server.crt" ]; then
  echo "📝 Generating backend certificates..."
  cd server && npm run generate-certs && cd ..
fi

# Check frontend certificates
if [ ! -f "client/ssl/cert.pem" ]; then
  echo "📝 Generating frontend certificates..."
  cd client
  mkdir -p ssl
  openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost" 2>/dev/null
  cd ..
fi

# Configure backend .env
cd server
if ! grep -q "USE_HTTPS=true" .env 2>/dev/null; then
  echo "USE_HTTPS=true" >> .env
  echo "HTTPS_PORT=4443" >> .env
  echo "FRONTEND_ORIGIN=https://localhost:4200" >> .env
fi
cd ..

echo "✅ Starting backend on https://localhost:4443"
cd server
npm run dev:https &
BACKEND_PID=$!
cd ..

sleep 3

echo "✅ Starting frontend on https://localhost:4200"
cd client
ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Application started!"
echo "   Frontend: https://localhost:4200"
echo "   Backend:  https://localhost:4443"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
```

Make it executable:
```bash
chmod +x start-full-https.sh
./start-full-https.sh
```

---

## 📋 Quick Command Reference

| Task | Command |
|------|---------|
| **Start Backend HTTPS** | `cd server && npm run dev:https` |
| **Start Frontend HTTPS** | `cd client && ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem` |
| **Generate Frontend Certs** | `cd client && openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"` |
| **Test Backend** | `curl -k https://localhost:4443/health` |
| **Access Frontend** | Open `https://localhost:4200` in browser |

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
- Check backend is running: `curl -k https://localhost:4443/health`
- Check CORS in `server/src/app.ts` includes `https://localhost:4200`
- Check browser console for errors

### Certificate errors
- Accept the security warnings in browser
- Make sure certificates exist in both `server/certs/` and `client/ssl/`

### Port already in use
```bash
# Kill process on port 4443 (backend)
kill -9 $(lsof -t -i:4443)

# Kill process on port 4200 (frontend)
kill -9 $(lsof -t -i:4200)
```

### Mixed content warnings
- Make sure frontend uses `https://` for all API calls
- Check `auth.service.ts` uses correct protocol

---

## 🎯 Production Notes

For production:
- Use Let's Encrypt or commercial certificates
- Frontend typically served via Nginx/Apache with SSL
- Backend can use reverse proxy or direct HTTPS
- Update `FRONTEND_ORIGIN` in backend `.env` to production URL

---

## ✅ Checklist

- [ ] Backend certificates generated (`server/certs/`)
- [ ] Frontend certificates generated (`client/ssl/`)
- [ ] Backend `.env` configured with `USE_HTTPS=true`
- [ ] Backend running on `https://localhost:4443`
- [ ] Frontend running on `https://localhost:4200`
- [ ] Browser accepts security warnings
- [ ] Frontend can make API calls to backend

---

**You're all set!** Your entire application is now running with HTTPS. 🔒

