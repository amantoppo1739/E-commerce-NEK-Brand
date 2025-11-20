# Vercel Database Connection Setup Guide

## Current Issue
Database connection failing on Vercel with error: "Can't reach database server"

## ✅ Verified Settings (All Correct)
- ✅ SSL enabled by default in Neon
- ✅ No IP restrictions (database accessible from all IPs)
- ✅ Connection pooling handled automatically by Neon
- ✅ Connection string format is correct

## 🔧 Solution Steps

### Step 1: Verify Database is Active
1. Go to https://neon.tech/dashboard
2. Select your project
3. Check the project status - Neon wakes up automatically on connection
4. If paused, it will wake up in 2-3 seconds when you connect

### Step 2: Update DATABASE_URL in Vercel
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. **Update** it with your Neon connection string:

```
postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**Important:**
- Replace `[YOUR-PASSWORD]` with your actual database password
- If password has special characters, URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - `+` → `%2B`
  - `=` → `%3D`

### Step 3: Redeploy WITHOUT Cache
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click the **three dots (⋯)** on the latest deployment
3. Click **"Redeploy"**
4. **IMPORTANT:** Check the box **"Use existing Build Cache"** → **UNCHECK IT**
5. Click **"Redeploy"**

This ensures Vercel picks up the new environment variable.

### Step 4: Verify Connection
After redeployment, visit:
```
https://e-commerce-nek-brand.vercel.app/api/debug/db-connection
```

This will show:
- Connection status
- Connection string format (masked)
- Any missing parameters
- Detailed suggestions

## 🔍 Troubleshooting

### If Still Not Working:

1. **Test Connection String Locally:**
   ```bash
   npm run db:test
   ```
   If this works locally but not on Vercel, it's a Vercel environment variable issue.

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Functions**
   - Look for error logs when you visit the site
   - Check for any connection timeout errors

3. **Verify Environment Variable Scope:**
   - In Vercel, make sure `DATABASE_URL` is set for **Production** environment
   - Check all three: Production, Preview, Development

4. **Try Direct Connection (if pooler fails):**
   - Note: Direct connection requires IPv6, but Vercel is IPv4-only
   - This won't work, but confirms the issue is with the pooler

5. **Check Neon Project Status:**
   - Go to Neon Dashboard
   - Check if project shows any warnings or errors
   - Verify the project is on the free tier and active

## 📋 Connection String Checklist

Your connection string must have:
- [x] Correct username: `postgres.szffflvgvdaxxphfpfsb` (with project ref)
- [x] Correct host: `ep-xxx-xxx.region.aws.neon.tech` (your Neon endpoint)
- [x] Correct port: `5432`
- [x] Correct database: `postgres`
- [x] Parameter: `?pgbouncer=true`
- [x] Parameter: `&connection_limit=1`
- [x] Parameter: `&sslmode=require`
- [x] Password is URL-encoded if it has special characters

## 🎯 Most Common Fix

**90% of the time, the issue is:**
1. Database is paused → Wake it up
2. Environment variable not updated in Vercel → Delete and re-add
3. Deployment used cached build → Redeploy without cache

Try these three steps first!

## 🔄 Handling 10-Minute Disconnections

Neon connections are optimized for serverless. The codebase includes:

### Automatic Retry Logic
- Connection errors are automatically retried (up to 3 times)
- Exponential backoff between retries
- Graceful error handling

### Connection String Parameters
Your connection string already includes:
- `connection_limit=1` - Limits connections per serverless function
- `pgbouncer=true` - Uses connection pooling
- `sslmode=require` - Ensures secure connections

### For Long-Running Operations
If you have long-running operations, use the retry helper:

```typescript
import { withDatabaseRetry } from '@/lib/prisma';

// This will automatically retry on connection errors
const result = await withDatabaseRetry(async (prisma) => {
  return await prisma.product.findMany();
});
```

### Keep-Alive (Development Only)
In development, you can use keep-alive to prevent timeouts:

```typescript
import { keepAlive } from '@/lib/prisma';

// Call this periodically (e.g., every 5 minutes)
await keepAlive();
```

**Note:** In serverless (Vercel), each function invocation is fresh, so keep-alive is less critical. The retry logic handles reconnections automatically.

