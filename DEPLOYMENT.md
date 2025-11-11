# 🚀 Deployment Guide - VoteEase

This guide covers deploying VoteEase to Vercel (frontend + backend API routes).

## 📋 Prerequisites

- Vercel account (free tier works)
- Supabase project (already set up)
- Gmail account with App Password (for email OTP)

## 🎯 Deployment Options

### Option 1: Deploy to Vercel (Recommended - Frontend + Backend)

Vercel can host both your frontend and backend API routes as serverless functions.

#### Step 1: Prepare for Deployment

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

2. **Test build locally**:
   ```bash
   npm run build
   ```

#### Step 2: Deploy to Vercel

1. **Via Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository: `Arjun006-coder/ease-vote-hub`
   - Vercel will auto-detect Vite framework

2. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

3. **Set Environment Variables** in Vercel:
   Go to Project Settings → Environment Variables and add:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```
   
   **Important**: 
   - Set these for **Production**, **Preview**, and **Development** environments
   - `VITE_API_URL` is NOT needed in production (API routes use same domain)

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Step 3: Verify Deployment

1. **Check API Routes**:
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Backend API is running",...}`

2. **Test Email OTP**:
   - Try registering a new user
   - Check if OTP email is sent

3. **Update Supabase CORS** (if needed):
   - In Supabase Dashboard → Settings → API
   - Add your Vercel domain to allowed origins

### Option 2: Separate Deployment (Frontend + Backend)

If you prefer to host backend separately:

#### Frontend: Vercel
- Deploy frontend to Vercel
- Set `VITE_API_URL` to your backend URL

#### Backend: Railway / Render / Fly.io
- Deploy `server.js` to Railway, Render, or Fly.io
- Set environment variables
- Update `VITE_API_URL` in Vercel to point to backend URL

## 📁 Vercel Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── send-otp-email.js  # Email OTP API
│   ├── test-gmail.js      # Gmail test API
│   └── health.js          # Health check API
├── src/                   # Frontend React app
├── vercel.json            # Vercel configuration
└── package.json
```

## 🔧 Environment Variables in Vercel

### Required Variables

1. **Supabase Configuration**:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key (for server-side operations)

2. **Gmail SMTP** (for email OTP):
   - `GMAIL_USER` - Your Gmail address
   - `GMAIL_APP_PASSWORD` - 16-character Gmail App Password

### How to Set Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - **Key**: Variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select Production, Preview, and/or Development
3. Click "Save"
4. **Redeploy** your project for changes to take effect

## 🚨 Important Notes

### API Routes

- Vercel API routes are serverless functions
- They automatically handle CORS
- No need to set `VITE_API_URL` in production (uses same domain)
- API routes are in `/api/*` directory

### Gmail App Password

- Must be 16 characters (no spaces)
- Enable 2-Step Verification first
- Generate from: https://myaccount.google.com/apppasswords
- Keep it secure - never commit to Git

### Supabase Storage

- Storage bucket must be created in Supabase Dashboard
- RLS is disabled (for development)
- For production, enable RLS and create proper policies

## 🔍 Troubleshooting

### "API route not found"
- Check that `api/` directory exists in project root
- Verify `vercel.json` configuration
- Check Vercel deployment logs

### "Gmail authentication failed"
- Verify `GMAIL_APP_PASSWORD` is correct (16 characters, no spaces)
- Check 2-Step Verification is enabled
- Verify environment variables are set in Vercel
- Check Vercel function logs for detailed errors

### "CORS error"
- Vercel API routes handle CORS automatically
- Check that frontend is calling API on same domain
- Verify `VITE_API_URL` is not set in production

### "Environment variable not found"
- Verify variables are set in Vercel Dashboard
- Check variable names match exactly
- Redeploy after adding/changing variables
- Variables starting with `VITE_` are exposed to frontend

## 📝 Post-Deployment Checklist

- [ ] Verify API routes are working (`/api/health`)
- [ ] Test user registration
- [ ] Test email OTP sending
- [ ] Test voting functionality
- [ ] Verify Supabase connection
- [ ] Check environment variables are set
- [ ] Update Supabase CORS settings
- [ ] Test on mobile devices
- [ ] Verify HTTPS is working
- [ ] Check browser console for errors

## 🎉 Success!

Your VoteEase application should now be live on Vercel!

**Live URL**: `https://your-project.vercel.app`

---

## 🔄 Alternative: Deploy Backend Separately

If you prefer to keep backend separate:

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

---

**Need Help?** Check Vercel documentation: https://vercel.com/docs

