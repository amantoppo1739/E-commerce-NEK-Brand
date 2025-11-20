# Migration Guide: Supabase → Neon

## Step 1: Create Neon Account & Database

1. Go to https://neon.tech
2. Sign up (GitHub/Google/Email)
3. Click "Create Project"
4. Fill in:
   - **Project name:** `e-commerce-nek-brand` (or your choice)
   - **Region:** Choose closest to you (or your users)
   - **PostgreSQL version:** 15 or 16 (recommended)
5. Click "Create Project"

## Step 2: Get Connection String

1. After project creation, you'll see the connection string
2. It looks like: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`
3. **Copy this connection string** - you'll need it in Step 3

## Step 3: Update Environment Variables

### Local Development (.env.local)
Update your `DATABASE_URL`:
```
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Vercel Production
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `DATABASE_URL`
3. Update it with your Neon connection string
4. Save

## Step 4: Test Connection Locally

```bash
npm run db:test
```

Should show: ✅ Database connection successful!

## Step 5: Push Schema to Neon

```bash
npm run db:push
```

This will create all your tables in Neon.

## Step 6: Seed Database (Optional)

```bash
npm run db:seed
```

This will create:
- Admin user: `admin@nek.com` / `admin123`
- Regular user: `user@example.com` / `user123`
- Sample products

## Step 7: Test in Production

1. Redeploy on Vercel (or wait for auto-deploy)
2. Visit: `https://e-commerce-nek-brand.vercel.app/api/debug/db-connection`
3. Should show connection successful!

## Step 8: Verify Everything Works

Test these features:
- ✅ Homepage loads products
- ✅ Login works
- ✅ Product pages load
- ✅ Cart functionality
- ✅ Admin panel

## Connection String Format

Neon connection strings typically include:
- `sslmode=require` (already included)
- No need for `pgbouncer=true` (Neon handles pooling automatically)
- No need for `connection_limit=1` (Neon optimizes for serverless)

## Troubleshooting

### Connection fails?
1. Check connection string is correct
2. Verify database is active (Neon doesn't pause as aggressively)
3. Check firewall/network settings

### Schema push fails?
1. Make sure connection string is correct
2. Check Prisma schema is valid: `npx prisma validate`
3. Try: `npx prisma db push --force-reset` (⚠️ deletes all data)

### Data migration from Supabase?
If you have existing data in Supabase:
1. Export data from Supabase
2. Import to Neon using pg_dump/pg_restore
3. Or use a migration tool

## Benefits You'll Get

- ✅ Faster connection (no slow wake-up)
- ✅ Better serverless optimization
- ✅ More reliable connections
- ✅ 0.5 GB free storage (vs 500 MB)
- ✅ Database branching (for testing)

## Rollback Plan

If something goes wrong:
1. Keep your previous database connection string as backup
2. Update `DATABASE_URL` back to your previous database
3. Redeploy

Your code doesn't need any changes - it's just a connection string swap!

