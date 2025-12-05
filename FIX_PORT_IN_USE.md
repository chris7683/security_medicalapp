# Fix "Port Already in Use" Error

## Quick Fix

### Kill Process on Port 4443

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:4443 | xargs kill -9

# Or manually find and kill
lsof -i:4443
# Then kill the PID shown
kill -9 <PID>
```

**Windows:**
```cmd
netstat -ano | findstr :4443
taskkill /PID <PID> /F
```

### Then Restart Server

```bash
cd server
npm run dev:https
```

## Alternative: Use Different Port

If you want to keep the other process running, change the port:

1. Edit `server/.env`:
```env
HTTPS_PORT=4444  # or any other available port
```

2. Restart server:
```bash
npm run dev:https
```

3. Update frontend to use new port:
   - Update `client/src/app/core/auth.service.ts` if needed
   - Or set `API_BASE_URL` environment variable

## Check What's Using the Port

```bash
# See what process is using port 4443
lsof -i:4443

# Or use netstat
netstat -an | grep 4443
```

## Common Causes

1. **Previous server instance still running**
   - Solution: Kill the process (see above)

2. **Multiple terminal windows with servers**
   - Solution: Close other terminals or kill those processes

3. **Server crashed but port not released**
   - Solution: Wait a few seconds or kill the process

## Prevention

Always stop the server properly with `Ctrl+C` before starting a new one.

