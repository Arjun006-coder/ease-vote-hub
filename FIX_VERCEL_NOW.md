# 🚨 FIX VERCEL API ROUTES 404 - STEP BY STEP

## The Problem
Vercel is returning 404 for `/api/*` routes even though the code is correct.

## ✅ Code is CORRECT
- API routes in `/api` directory ✓
- Using `module.exports` (CommonJS) ✓
- `api/package.json` exists ✓
- All files pushed to GitHub ✓

## ❌ The Issue: Vercel Configuration

Vercel is NOT detecting your API routes. This is a **Vercel Dashboard configuration issue**.

## 🔧 FIX - Do This in Vercel Dashboard:

### Step 1: Check Framework Preset

1. Go to: https://vercel.com/dashboard
2. Click your project: `ease-vote-hub`
3. Go to: **Settings** → **General**
4. Check: **Framework Preset**
5. **MUST BE**: `Vite`
6. If it's NOT Vite:
   - Change it to **Vite**
   - Click **Save**
   - This is CRITICAL!

### Step 2: Verify Build Settings

In **Settings** → **General**, verify:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `./`

### Step 3: Check Functions Tab

1. Go to: **Functions** tab (in your project)
2. **Check if you see**:
   - `/api/health`
   - `/api/send-otp-email`
   - `/api/test-gmail`
   - `/api/test`

**If Functions tab is EMPTY:**
- Vercel is NOT detecting API routes
- This means the framework preset is wrong OR
- The project needs to be reconfigured

### Step 4: Reconnect GitHub Repository

If Functions tab is empty:

1. Go to: **Settings** → **Git**
2. Click: **Disconnect**
3. Click: **Connect Git Repository**
4. Select: `Arjun006-coder/ease-vote-hub`
5. **Configure Project**:
   - **Framework Preset**: **Vite** (CRITICAL!)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click: **Deploy**

### Step 5: Verify Environment Variables

1. Go to: **Settings** → **Environment Variables**
2. Verify these are set for **Production**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`

### Step 6: Redeploy

1. Go to: **Deployments** tab
2. Click: **Redeploy** on latest deployment
3. **UNCHECK**: "Use existing Build Cache"
4. Click: **Redeploy**
5. Wait 2-3 minutes

### Step 7: Test

After deployment:
1. Check: **Functions** tab - API routes should appear
2. Test: `https://ease-vote-hub.vercel.app/api/health`
3. Should return: `{"status":"ok",...}`

## 🚨 If Still Not Working:

### Check Deployment Logs

1. Go to: **Deployments** → Latest deployment
2. Click: **View Build Logs**
3. Look for errors related to API routes
4. Check: **Function Logs** for API route errors

### Contact Vercel Support

If Functions tab is still empty after reconnecting:
- This might be a Vercel platform issue
- Contact Vercel support with:
  - Deployment logs
  - Project configuration
  - Screenshot of Functions tab

## 📋 Quick Checklist

- [ ] Framework Preset is set to **Vite**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Environment variables are set
- [ ] GitHub repository is connected
- [ ] Functions tab shows API routes (after redeploy)
- [ ] `/api/health` returns JSON (not 404)

---

**The code is correct. The issue is Vercel configuration. Fix it in the Dashboard!**

