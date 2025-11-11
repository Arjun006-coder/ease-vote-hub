# 🚀 Vercel Production Deployment Fix

## ✅ What's Fixed

1. **Simplified `vercel.json`** - Let Vercel auto-detect API routes (recommended approach)
2. **API routes use CommonJS** - Compatible with Vercel Node.js runtime
3. **Frontend uses relative paths** - Works on same domain (no CORS issues)

## 🎯 How It Works on Vercel

- **Frontend**: Deployed as static files from `dist/` directory
- **API Routes**: Auto-detected from `/api` directory as serverless functions
- **Same Domain**: Frontend and API routes on same domain (e.g., `https://your-app.vercel.app`)
- **No Backend Server**: Everything runs on Vercel serverless functions

## 📋 Deployment Checklist

### 1. Verify Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Make sure these are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

**Important**: Set for **Production**, **Preview**, and **Development** environments.

### 2. Deploy Latest Code

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click "Redeploy" on latest deployment
3. **UNCHECK** "Use existing Build Cache"
4. Click "Redeploy"
5. Wait for deployment to complete (2-3 minutes)

### 3. Verify API Routes

After deployment, test:
- `https://your-project.vercel.app/api/health`
- Should return: `{"status":"ok","message":"Backend API is running",...}`

If 404:
- Check Vercel Dashboard → Functions tab
- Verify `/api/health`, `/api/send-otp-email` are listed
- Check deployment logs for errors

### 4. Test OTP Sending

1. Visit your Vercel URL
2. Try registering a new user
3. Enter email address
4. OTP should be sent via email
5. Check email inbox (and spam folder)

## 🔧 Troubleshooting

### API Routes Return 404

**Check**:
1. Vercel Dashboard → Functions tab
2. Are API routes listed? If not, Vercel isn't detecting them
3. Check deployment logs for build errors
4. Verify API routes are in `/api` directory at project root

**Fix**:
- Make sure API routes use `module.exports` (CommonJS)
- Verify `api/package.json` exists with `{"type": "commonjs"}`
- Redeploy with fresh build (no cache)

### OTP Emails Not Sending

**Check**:
1. Environment variables set in Vercel?
2. Gmail credentials correct?
3. Check Vercel function logs for errors
4. Test: `https://your-project.vercel.app/api/test-gmail`

**Fix**:
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- Check Gmail App Password is 16 characters (no spaces)
- Verify 2-Step Verification is enabled on Gmail

### Frontend Calls localhost:3001

**This shouldn't happen in production!**

**Check**:
1. Is code using relative paths? (`/api/send-otp-email`)
2. Is `VITE_API_URL` set in Vercel? (It shouldn't be!)
3. Check browser console for actual API calls

**Fix**:
- Remove `VITE_API_URL` from Vercel environment variables
- Frontend should use relative paths (same domain)
- Redeploy to get latest code

## ✅ Success Criteria

After deployment, you should be able to:
- ✅ Visit `https://your-project.vercel.app`
- ✅ Register a new user
- ✅ Receive OTP email
- ✅ Verify email and create account
- ✅ Use the application without any local server

## 🎉 No Local Development Needed!

Once deployed on Vercel:
- ✅ Works for everyone (no local setup needed)
- ✅ API routes work automatically
- ✅ Email OTP works automatically
- ✅ No backend server to maintain
- ✅ Scales automatically

---

**Need Help?**
- Check Vercel deployment logs
- Check Vercel function logs
- Test API endpoints directly
- Verify environment variables

