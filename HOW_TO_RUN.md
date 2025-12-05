# How to Run the Application

## Prerequisites Checklist

Before running, make sure you have:
- ✅ Node.js 18.x or higher installed
- ✅ PostgreSQL 14+ running
- ✅ Database `healthcare` created
- ✅ `.env` file configured in `server/` directory

## Quick Start Guide

### Step 1: Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### Step 2: Set Up Database

Make sure PostgreSQL is running, then run migrations:

```bash
# From project root
psql -U postgres -d healthcare -f server/create_password_reset_tokens_table.sql
```

### Step 3: Configure Environment

Make sure `server/.env` exists with your configuration:

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:4200
ACCESS_TOKEN_SECRET=your_secure_secret_here
REFRESH_TOKEN_SECRET=your_secure_secret_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
POSTGRES_DB=healthcare
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Step 4: Run the Application

You need **TWO terminal windows** - one for backend, one for frontend.

#### Terminal 1: Start Backend Server
```bash
cd server
npm run dev
```

You should see:
```
Server listening on http://localhost:4000
```

#### Terminal 2: Start Frontend Client
```bash
cd client
npm start
```

You should see:
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

### Step 5: Access the Application

Open your browser and go to:
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:4000

## Running Commands Summary

### Backend Commands

```bash
cd server

# Development mode (with auto-reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production mode (after building)
npm start

# Generate secure secrets for .env
node generate-secrets.js
```

### Frontend Commands

```bash
cd client

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Troubleshooting

### Backend won't start?

1. **Check PostgreSQL is running:**
   ```bash
   psql -U postgres -c "SELECT version();"
   ```

2. **Check .env file exists:**
   ```bash
   ls server/.env
   ```

3. **Check database connection:**
   ```bash
   psql -U postgres -d healthcare -c "\dt"
   ```

4. **Check port 4000 is available:**
   ```bash
   lsof -i :4000
   ```

### Frontend won't start?

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Check port 4200 is available:**
   ```bash
   lsof -i :4200
   ```

3. **Clear cache and reinstall:**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

### Database connection errors?

1. **Verify PostgreSQL is running:**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Check database exists:**
   ```bash
   psql -U postgres -l | grep healthcare
   ```

3. **Create database if missing:**
   ```bash
   createdb -U postgres healthcare
   ```

## Development Workflow

### Typical Development Session:

1. **Start PostgreSQL** (if not running as a service)
2. **Terminal 1:** `cd server && npm run dev`
3. **Terminal 2:** `cd client && npm start`
4. **Browser:** Open http://localhost:4200
5. Make changes - both servers auto-reload!

### Stopping the Servers

- Press `Ctrl + C` in each terminal window
- Or close the terminal windows

## Production Build

### Build Backend:
```bash
cd server
npm run build
npm start
```

### Build Frontend:
```bash
cd client
npm run build
# Output will be in client/dist/client/browser/
```

## Quick Reference

| Service | Port | Command | URL |
|---------|------|---------|-----|
| Backend API | 4000 | `cd server && npm run dev` | http://localhost:4000 |
| Frontend App | 4200 | `cd client && npm start` | http://localhost:4200 |
| PostgreSQL | 5432 | (system service) | localhost:5432 |

## Need Help?

- Check `README.md` for more details
- Check `SECURE_ENV_SETUP.md` for environment configuration
- Check server logs in Terminal 1 for backend errors
- Check browser console (F12) for frontend errors

