# 🛠️ Local Development Setup Guide

## Current Issue: ERR_BLOCKED_BY_CLIENT

The error `ERR_BLOCKED_BY_CLIENT` when calling `localhost:3001/api/send-otp-email` means:
- The backend server is NOT running, OR
- An ad blocker/browser extension is blocking the request

## ✅ Solution: Use Vite Proxy (Recommended)

### Option 1: Use Vite Proxy (No Backend Server Needed for API Routes)

1. **Remove `VITE_API_URL` from `.env.local`**:
   ```env
   # Comment out or remove this line:
   # VITE_API_URL=http://localhost:3001
   ```

2. **Use Vercel Dev for Local API Routes**:
   ```bash
   # Install Vercel CLI (if not installed)
   npm i -g vercel
   
   # Run Vercel dev (this runs both frontend and API routes)
   vercel dev
   ```
   
   This will:
   - Start frontend on `http://localhost:3000`
   - Run API routes locally (same as production)
   - No backend server needed!
   - No `ERR_BLOCKED_BY_CLIENT` issues

### Option 2: Use Local Backend Server

1. **Start Backend Server**:
   ```bash
   npm run server
   ```
   This starts the Express server on `http://localhost:3001`

2. **Keep `VITE_API_URL` in `.env.local`** (or remove it to use Vite proxy):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```
   Vite will proxy `/api/*` requests to `http://localhost:3001`

4. **Disable Ad Blocker**:
   - Disable ad blocker for `localhost`
   - Check browser extensions
   - Try incognito mode

## 🔧 Quick Fix for Current Error

### Immediate Fix:

1. **Remove `VITE_API_URL` from `.env.local`**:
   ```bash
   # Edit .env.local and remove or comment out:
   # VITE_API_URL=http://localhost:3001
   ```

2. **Use Vercel Dev** (Recommended):
   ```bash
   vercel dev
   ```
   - Runs frontend + API routes locally
   - No backend server needed
   - Matches production environment

3. **OR Start Backend Server**:
   ```bash
   npm run server
   ```
   Then restart frontend: `npm run dev`

## 📋 Troubleshooting

### ERR_BLOCKED_BY_CLIENT

**Causes**:
- Ad blocker blocking `localhost:3001`
- Browser extension blocking requests
- Backend server not running

**Solutions**:
1. Disable ad blocker for localhost
2. Use Vercel dev (no separate backend needed)
3. Start backend server: `npm run server`
4. Try incognito mode

### Backend Server Not Running

**Check**:
```bash
netstat -ano | findstr :3001
```

**Start**:
```bash
npm run server
```

### Vite Proxy Not Working

**Check**:
- `vite.config.ts` has proxy configuration
- Frontend uses relative paths (`/api/...`) not absolute URLs
- `VITE_API_URL` is NOT set (or backend server is running)

## 🎯 Recommended Setup for Local Development

### Best Option: Vercel Dev

```bash
# Install Vercel CLI
npm i -g vercel

# Run Vercel dev
vercel dev
```

**Benefits**:
- ✅ No separate backend server needed
- ✅ API routes work exactly like production
- ✅ No `ERR_BLOCKED_BY_CLIENT` issues
- ✅ No ad blocker conflicts
- ✅ Matches production environment

### Alternative: Local Backend Server

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run dev
```

**Requirements**:
- Backend server must be running on port 3001
- Disable ad blocker for localhost
- Set `VITE_API_URL=http://localhost:3001` in `.env.local` (optional)

## 🚀 Quick Start

1. **Remove `VITE_API_URL` from `.env.local`**
2. **Install Vercel CLI**: `npm i -g vercel`
3. **Run Vercel Dev**: `vercel dev`
4. **Access app**: `http://localhost:3000`
5. **Test OTP**: Should work without errors!

---

**Note**: The code has been updated to always use relative paths (`/api/...`) which work with:
- Vite proxy (when backend server is running)
- Vercel dev (API routes run locally)
- Vercel production (API routes on same domain)

