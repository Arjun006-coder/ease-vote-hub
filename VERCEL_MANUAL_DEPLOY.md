# 🚀 Manual Vercel Deployment Guide

## Issue: Vercel Not Auto-Detecting New Commits

If Vercel isn't automatically deploying new commits, follow these steps:

## ✅ Solution 1: Manual Redeploy (Fastest)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your project** (`ease-vote-hub`)
3. **Go to "Deployments" tab**
4. **Find the latest deployment** (even if it's old)
5. **Click the three dots (⋯) menu** on that deployment
6. **Click "Redeploy"**
7. **IMPORTANT**: Uncheck "Use existing Build Cache"
8. **Click "Redeploy"**

This will pull the latest code from GitHub and deploy it.

## ✅ Solution 2: Check Vercel Settings

1. **Go to Vercel Dashboard** → Your Project
2. **Settings** → **Git**
3. **Verify**:
   - ✅ Repository: `Arjun006-coder/ease-vote-hub`
   - ✅ Production Branch: `main`
   - ✅ Auto-deploy: **Enabled**
4. **If Auto-deploy is OFF**: Toggle it ON

## ✅ Solution 3: Reconnect GitHub Repository

If settings look correct but still not working:

1. **Settings** → **Git**
2. **Click "Disconnect"** (don't worry, you can reconnect)
3. **Click "Connect Git Repository"**
4. **Select**: `Arjun006-coder/ease-vote-hub`
5. **Select branch**: `main`
6. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. **Click "Deploy"**

## ✅ Solution 4: Verify GitHub Webhook

1. **Go to GitHub**: https://github.com/Arjun006-coder/ease-vote-hub
2. **Settings** → **Webhooks**
3. **Look for Vercel webhook** (should be there if connected)
4. **If missing**: Reconnect in Vercel (Solution 3)

## 📋 Current Status

- ✅ **Latest Commit on GitHub**: `a36750c` - "Trigger Vercel deployment - API routes fix"
- ✅ **Branch**: `main`
- ✅ **All fixes included**: API routes use relative paths
- ❌ **Vercel**: Not auto-detecting (needs manual trigger)

## 🎯 What's Fixed in Latest Code

- ✅ `src/lib/otp.ts` - Uses relative paths (`/api/send-otp-email`)
- ✅ `vercel.json` - Configured for API routes
- ✅ API routes in `/api` directory
- ✅ Works in Vercel production (same domain)

## 🚀 After Manual Redeploy

Test these endpoints:
1. **Health Check**: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Backend API is running",...}`

2. **OTP Sending**: Try registering a new user
   - Should work without `ERR_BLOCKED_BY_CLIENT` errors

## 💡 Quick Command (If you have Vercel CLI)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from current directory
vercel --prod
```

This will deploy directly from your local code to Vercel.

---

**Note**: Manual redeploy (Solution 1) is the fastest way to get your latest code deployed right now!

