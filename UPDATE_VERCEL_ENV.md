# Update Vercel Environment Variable - Quick Guide

## ⚠️ Current Issue
Your Vercel deployment is still using the Supabase connection string. You need to update it to Neon.

## 🔧 Quick Fix (2 minutes)

### Step 1: Get Your Neon Connection String
Your Neon connection string should be:
```
postgresql://neondb_owner:npg_mTGweXP9nh3Y@ep-calm-waterfall-a1cpgyy5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

(Or get it from your Neon dashboard if different)

### Step 2: Update in Vercel
1. Go to https://vercel.com/dashboard
2. Select your project: **E-commerce-NEK-Brand**
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Click **Edit** (or delete and add new)
6. **Paste your Neon connection string**
7. Make sure it's set for **Production** environment
8. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **three dots (⋯)** on the latest deployment
3. Click **Redeploy**
4. **Uncheck** "Use existing Build Cache" (important!)
5. Click **Redeploy**

### Step 4: Verify
After redeployment, visit:
```
https://e-commerce-nek-brand.vercel.app/api/debug/db-connection
```

Should show:
- ✅ Connection successful
- ✅ Provider: Neon
- ✅ Host: ep-calm-waterfall-a1cpgyy5-pooler.ap-southeast-1.aws.neon.tech

## ✅ Done!

Your production site will now use Neon instead of Supabase.

