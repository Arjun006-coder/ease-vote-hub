# 🔧 Vercel API Routes Fix Guide

## Problem
- API routes return 404 on Vercel
- `ERR_BLOCKED_BY_CLIENT` error in development

## Solution

### For Vercel Deployment:

1. **API Routes Format**:
   - Vercel automatically detects files in `/api` directory
   - Use ES modules (since `package.json` has `"type": "module"`)
   - Export default function: `export default function handler(req, res)`

2. **vercel.json Configuration**:
   ```json
   {
     "rewrites": [
       {
         "source": "/((?!api).*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   - This ensures API routes (`/api/*`) are NOT rewritten to `index.html`
   - All other routes go to `index.html` (for React Router)

3. **Environment Variables in Vercel**:
   - Set all required variables in Vercel Dashboard
   - **DO NOT** set `VITE_API_URL` in production
   - API routes use same domain automatically

### For Local Development:

1. **Option 1: Use Local Backend Server** (Recommended):
   - Start backend: `npm run server`
   - Set `VITE_API_URL=http://localhost:3001` in `.env.local`
   - Start frontend: `npm run dev`
   - Vite proxy handles `/api` requests

2. **Option 2: Use Vercel Dev**:
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel dev`
   - API routes work automatically (same domain)

### Fixing ERR_BLOCKED_BY_CLIENT:

This error usually means:
1. **Ad Blocker**: Disable ad blocker for localhost
2. **Browser Extension**: Check browser extensions
3. **CORS Issue**: API routes handle CORS automatically
4. **Wrong URL**: Make sure API URL is correct

### Testing:

1. **Local Development**:
   - Backend server must be running
   - Check: `http://localhost:3001/api/health`
   - Frontend calls: `http://localhost:3001/api/send-otp-email`

2. **Vercel Production**:
   - Check: `https://your-project.vercel.app/api/health`
   - Frontend calls: `/api/send-otp-email` (relative path)

### Troubleshooting:

1. **404 on Vercel**:
   - Check API routes are in `/api` directory
   - Verify `vercel.json` configuration
   - Check deployment logs in Vercel Dashboard
   - Make sure API route files export default function

2. **ERR_BLOCKED_BY_CLIENT**:
   - Disable ad blocker
   - Check browser console for detailed errors
   - Verify backend server is running (for local dev)
   - Check if request URL is correct

3. **API Not Working**:
   - Check environment variables are set
   - Verify Gmail credentials
   - Check Vercel function logs
   - Test API endpoint directly in browser

## Quick Fix Checklist:

- [ ] API routes are in `/api` directory
- [ ] API routes use ES module format (`export default`)
- [ ] `vercel.json` has correct rewrites
- [ ] Environment variables are set in Vercel
- [ ] `VITE_API_URL` is NOT set in production
- [ ] Backend server is running (for local dev)
- [ ] Ad blocker is disabled (for local dev)
- [ ] Code is pushed to GitHub
- [ ] Vercel deployment is updated

## Next Steps:

1. Push code to GitHub
2. Redeploy on Vercel
3. Test `/api/health` endpoint
4. Test OTP sending
5. Check Vercel function logs if issues persist

