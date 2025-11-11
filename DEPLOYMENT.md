# 🚀 Deployment Guide - VoteEase

This guide covers deploying VoteEase to Vercel (frontend + backend API routes).

## 📋 Prerequisites

- Vercel account (free tier works)
- Supabase project (already set up)
- Gmail account with App Password (for email OTP)

## 🎯 Deployment to Vercel (Recommended)

Vercel can host both your frontend and backend API routes as serverless functions - **all in one deployment!**

### Step 1: Push Code to GitHub

Make sure all your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Sign in with GitHub

2. **Import Project**:
   - Click **"Add New Project"**
   - Select your repository: `Arjun006-coder/ease-vote-hub`
   - Click **"Import"**

3. **Configure Project** (Vercel auto-detects):
   - Framework Preset: **Vite** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Set Environment Variables**:
   Click **"Environment Variables"** and add:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```
   
   **Important**: 
   - Set for **Production**, **Preview**, and **Development** environments
   - Do NOT set `VITE_API_URL` in production (API routes use same domain)
   - Click **"Save"** after adding each variable

5. **Deploy**:
   - Click **"Deploy"**
   - Wait for deployment to complete (2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Verify Deployment

1. **Check API Health**:
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Backend API is running",...}`

2. **Test Application**:
   - Visit your Vercel URL
   - Try registering a new user
   - Check if OTP email is sent
   - Test voting functionality

## 🔧 Local Development

### Option 1: Local Backend Server (Recommended for Development)

1. **Start Backend Server**:
   ```bash
   npm run server
   ```
   This starts the Express server on `http://localhost:3001`

2. **Set Environment Variable** (in `.env.local`):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```
   Vite will proxy `/api/*` requests to `http://localhost:3001`

### Option 2: Vercel Dev (Testing API Routes Locally)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Run Vercel Dev**:
   ```bash
   vercel dev
   ```
   This starts both frontend and API routes locally

3. **Access Application**:
   - Frontend: `http://localhost:3000`
   - API routes work automatically (same domain)

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── send-otp-email.js  # Email OTP API
│   ├── test-gmail.js      # Gmail test API
│   └── health.js          # Health check API
├── src/                   # Frontend React app
├── vercel.json            # Vercel configuration
└── package.json
```

## 🔧 Environment Variables

### Required Variables (Set in Vercel)

1. **Supabase Configuration**:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key

2. **Gmail SMTP** (for email OTP):
   - `GMAIL_USER` - Your Gmail address
   - `GMAIL_APP_PASSWORD` - 16-character Gmail App Password

### Optional Variables

- `VITE_API_URL` - Only set for local development with separate backend server
  - Local: `http://localhost:3001`
  - Production: Leave unset (API routes use same domain)

## 🚨 Troubleshooting

### API Routes Return 404

**Problem**: `/api/health` returns 404 on Vercel

**Solution**:
1. **Verify API routes exist**:
   - Check that `/api/health.js`, `/api/send-otp-email.js` exist in project root
   - Files must be in `/api` directory (not in `/src/api`)

2. **Check vercel.json**:
   - Ensure rewrites exclude `/api/*` routes
   - Example: `"source": "/((?!api).*)"` excludes API routes

3. **Check deployment logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → View Function Logs
   - Check if API routes are being built

4. **Verify API route format**:
   - Must export default function: `export default function handler(req, res)`
   - Use ES modules (since `package.json` has `"type": "module"`)

5. **Redeploy**:
   - Push changes to GitHub
   - Vercel will auto-deploy
   - Check deployment status

6. **Manual verification**:
   - Check Vercel Dashboard → Functions tab
   - You should see `/api/health`, `/api/send-otp-email` listed
   - If not listed, API routes aren't being detected

### "Failed to fetch" Error

**Problem**: Frontend can't call API routes

**Solution**:
1. **In Production (Vercel)**:
   - Don't set `VITE_API_URL` environment variable
   - API routes use same domain automatically
   - Check browser console for CORS errors

2. **In Development**:
   - If using local backend: Set `VITE_API_URL=http://localhost:3001`
   - If using Vercel dev: Don't set `VITE_API_URL`
   - Make sure backend server is running (`npm run server`)

### "ERR_BLOCKED_BY_CLIENT" Error

**Problem**: Browser blocking API requests

**Solution**:
1. Check if ad blocker is enabled (disable for localhost)
2. Check browser extensions
3. Try in incognito mode
4. Check browser console for detailed errors

### Gmail Authentication Failed

**Problem**: OTP emails not sending

**Solution**:
1. Verify `GMAIL_APP_PASSWORD` is 16 characters (no spaces)
2. Check 2-Step Verification is enabled
3. Verify environment variables are set in Vercel
4. Check Vercel function logs for detailed errors
5. Test Gmail connection: `https://your-project.vercel.app/api/test-gmail`

### Environment Variables Not Working

**Problem**: Variables not available in production

**Solution**:
1. Verify variables are set in Vercel Dashboard
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding/changing variables
4. Variables starting with `VITE_` are exposed to frontend
5. Other variables are only available in API routes

## 📝 Post-Deployment Checklist

- [ ] Verify API routes are working (`/api/health`)
- [ ] Test user registration
- [ ] Test email OTP sending
- [ ] Test voting functionality
- [ ] Verify Supabase connection
- [ ] Check environment variables are set
- [ ] Update Supabase CORS settings (if needed)
- [ ] Test on mobile devices
- [ ] Verify HTTPS is working
- [ ] Check browser console for errors

## 🔄 Updating Deployment

After making changes:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update deployment"
   git push origin main
   ```

2. **Vercel Auto-Deploys**:
   - Vercel automatically detects GitHub pushes
   - New deployment starts automatically
   - Check Vercel Dashboard for deployment status

3. **Manual Redeploy** (if needed):
   - Go to Vercel Dashboard
   - Click on your project
   - Click "Redeploy" on latest deployment

## 💡 Tips

1. **API Routes**: Vercel automatically detects files in `/api` directory
2. **Environment Variables**: Set in Vercel Dashboard, not in code
3. **CORS**: API routes handle CORS automatically
4. **Logs**: Check Vercel function logs for debugging
5. **Testing**: Use Vercel Preview deployments for testing

## 🎉 Success!

Your VoteEase application should now be live on Vercel!

**Live URL**: `https://your-project.vercel.app`

---

## 🔄 Alternative: Separate Backend Deployment

If you prefer to host backend separately:

### Backend: Railway / Render

1. **Railway**:
   - Create account at [Railway](https://railway.app)
   - Create new project
   - Connect GitHub repository
   - Set root directory to project root
   - Add environment variables
   - Deploy

2. **Render**:
   - Create account at [Render](https://render.com)
   - Create new Web Service
   - Connect GitHub repository
   - Build command: `npm install`
   - Start command: `node server.js`
   - Add environment variables
   - Deploy

3. **Update Frontend**:
   - Set `VITE_API_URL` in Vercel to your backend URL
   - Example: `VITE_API_URL=https://your-backend.railway.app`
   - Redeploy frontend

---

**Need Help?** Check Vercel documentation: https://vercel.com/docs
