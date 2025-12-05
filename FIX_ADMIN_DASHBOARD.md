# Fix "No Patients/Doctors Found" in Admin Dashboard

## Problem
Admin dashboard shows "No patients found" and "No doctors found" even though users exist in the database.

## Root Cause
The admin dashboard was using hardcoded HTTP URL (`http://localhost:4000/api`) but the server is running on HTTPS (`https://localhost:4443`).

## Fixes Applied ✅

1. **Updated API Base URL** - Now automatically detects HTTPS
2. **Added Error Logging** - Better debugging information
3. **Improved Error Handling** - Shows user-friendly error messages

## What to Check

### 1. Verify You're Logged In as Admin
- Make sure you're logged in with an admin account
- Check browser console for authentication errors

### 2. Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for errors like:
  - "Loading users from: https://localhost:4443/api/admin/users"
  - "Users loaded: X users"
  - Any error messages

- **Network tab**: 
  - Check if requests to `/api/admin/users` and `/api/patients` are being made
  - Check the response status (should be 200)
  - Check if requests are being blocked (red entries)

### 3. Verify Backend is Running
```bash
# Check if backend is running
curl -k https://localhost:4443/health
# Should return: {"status":"ok"}
```

### 4. Check Certificate Acceptance
Make sure you've accepted the backend certificate:
- Visit `https://localhost:4443/health` in browser
- Accept the security warning
- Then refresh the admin dashboard

### 5. Verify Database Has Data
```bash
# Check users
psql -U postgres -d healthcare -c "SELECT role, COUNT(*) FROM users GROUP BY role;"

# Check patients
psql -U postgres -d healthcare -c "SELECT COUNT(*) FROM patients;"
```

## Debugging Steps

### Step 1: Check Browser Console
1. Open admin dashboard
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for:
   - "Loading users from: ..."
   - "Users loaded: X users"
   - Any error messages

### Step 2: Check Network Requests
1. In DevTools, go to Network tab
2. Refresh the admin dashboard
3. Look for:
   - `/api/admin/users` request
   - `/api/patients` request
4. Check:
   - Status code (should be 200)
   - Response (should contain data)
   - Request URL (should be `https://localhost:4443/api/...`)

### Step 3: Test API Directly
```bash
# Get a valid JWT token first (login via frontend or API)
# Then test:
curl -k -H "Authorization: Bearer YOUR_TOKEN" https://localhost:4443/api/admin/users
curl -k -H "Authorization: Bearer YOUR_TOKEN" https://localhost:4443/api/patients
```

## Common Issues

### Issue 1: Certificate Not Accepted
**Symptom**: Network requests show "Failed to load resource: The certificate for this server is invalid"

**Solution**: 
1. Visit `https://localhost:4443/health` directly
2. Accept the security warning
3. Refresh admin dashboard

### Issue 2: CORS Errors
**Symptom**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution**: 
- Backend CORS is already configured
- Make sure frontend is accessing via HTTPS if backend is HTTPS
- Check server logs for CORS errors

### Issue 3: Authentication Errors
**Symptom**: "401 Unauthorized" or "Invalid or expired token"

**Solution**:
1. Make sure you're logged in
2. Check if JWT token is in localStorage
3. Try logging out and logging back in

### Issue 4: API URL Mismatch
**Symptom**: Requests going to wrong URL

**Solution**:
- The API base URL now auto-detects HTTPS
- If frontend is on `https://localhost:4200`, API calls go to `https://localhost:4443/api`
- If frontend is on `http://localhost:4200`, API calls go to `http://localhost:4000/api`

## Expected Behavior

After fixes:
1. **Console should show**:
   ```
   Loading users from: https://localhost:4443/api/admin/users
   Users loaded: X users
   Users data: [...]
   Loading patients from: https://localhost:4443/api/patients
   Patients loaded: X patients
   Patients data: [...]
   ```

2. **Network tab should show**:
   - `/api/admin/users` - Status 200, Response with user array
   - `/api/patients` - Status 200, Response with patient array

3. **Dashboard should display**:
   - Users table with all users
   - Patient assignments table with all patients
   - Doctor and nurse dropdowns populated

## If Still Not Working

1. **Check server logs** for errors
2. **Verify authentication** - Make sure you're logged in as admin
3. **Check browser console** for specific error messages
4. **Verify database** has the data
5. **Test API directly** with curl using a valid token

## Quick Test

```bash
# 1. Login as admin via frontend
# 2. Open browser console (F12)
# 3. Check localStorage for accessToken
# 4. Test API:
TOKEN=$(cat ~/.local_storage_token)  # Get from browser localStorage
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:4443/api/admin/users
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:4443/api/patients
```

