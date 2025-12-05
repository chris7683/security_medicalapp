# Start Application with HTTPS - Simple Guide

## ✅ You Already Have Certificates!

Your certificates are ready at:
- `server/certs/server.key`
- `server/certs/server.crt`

## 🚀 Start the Server (Choose One Method)

### Method 1: Using npm script (Recommended)
```bash
cd server
npm run dev:https
```

### Method 2: Using the startup script
```bash
# From project root
./start-https.sh
```

### Method 3: Manual start
```bash
cd server
USE_HTTPS=true npm run dev
```

## 📝 Configure .env (If Not Already Done)

If you haven't added HTTPS config to `.env` yet, run:
```bash
cd server
echo "" >> .env
echo "USE_HTTPS=true" >> .env
echo "HTTPS_PORT=4443" >> .env
```

Or manually edit `server/.env` and add:
```env
USE_HTTPS=true
HTTPS_PORT=4443
```

## 🌐 Access Your Application

Once the server starts, you'll see:
```
🔒 HTTPS Server listening on https://localhost:4443
```

**Access points:**
- Backend API: `https://localhost:4443`
- Health Check: `https://localhost:4443/health`
- API Endpoints: `https://localhost:4443/api/*`

## ⚠️ Browser Security Warning

Your browser will show a security warning because you're using self-signed certificates. This is **normal for development**.

**To proceed:**
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost" or "Accept the Risk"
3. This is safe for local development

## 🔍 Verify It's Working

Test the HTTPS connection:
```bash
curl -k https://localhost:4443/health
```

You should see: `{"status":"ok"}`

## 📋 Quick Command Reference

| What You Want | Command |
|---------------|---------|
| Start with HTTPS | `cd server && npm run dev:https` |
| Check certificates | `ls -la server/certs/` |
| Test HTTPS | `curl -k https://localhost:4443/health` |
| View .env config | `cat server/.env \| grep HTTPS` |

## 🛑 Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

## 🔄 Restart After Changes

The server uses `nodemon` which auto-restarts on file changes. If you need to manually restart:
1. Press `Ctrl+C` to stop
2. Run `npm run dev:https` again

---

**That's it!** Your application is now running with HTTPS. 🎉

