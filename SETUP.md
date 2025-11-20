# Setup Guide - Free Stack Implementation

This guide will help you set up the production-ready e-commerce platform with the free stack.

## Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm
- Accounts for free services (see below)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Free Services

### 2.1 Supabase (Database) - FREE

1. Go to [supabase.com](https://supabase.com)
2. Sign up for free account
3. Create a new project
4. Go to Project Settings → Database
5. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
6. Replace `[YOUR-PASSWORD]` with your database password
7. Save this for Step 3

### 2.2 Resend (Email) - FREE (3,000 emails/month)

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Go to API Keys
4. Create a new API key
5. Save this for Step 3

**Note:** For production, you'll need to verify your domain. For development, you can use `onboarding@resend.dev`.

### 2.3 Cloudinary (Image Storage) - FREE (25GB)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Go to Dashboard
4. Copy your:
   - Cloud Name
   - API Key
   - API Secret
5. Save these for Step 3

### 2.4 Sentry (Error Tracking) - FREE (5,000 errors/month) - Optional

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create a new project (Next.js)
4. Copy your DSN
5. Save this for Step 3

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your values:

```env
# Database - From Supabase
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-generated-secret-here"

# Resend - From Resend dashboard
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="NEK <onboarding@resend.dev>"

# Cloudinary - From Cloudinary dashboard
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Sentry - Optional, from Sentry dashboard
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-sentry-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

> **Heads up:** The admin product drawer uploads directly to Cloudinary. If any of the three Cloudinary variables are missing, file uploads will fail (you can still paste full image URLs manually). Double-check these before testing `/admin/products`.

### Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in your `.env.local`.

## Step 4: Set Up Database

1. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

2. Push database schema to Supabase:
   ```bash
   npm run db:push
   ```

3. Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

This will create:
- Admin user: `admin@nek.com` / `admin123`
- Regular user: `user@example.com` / `user123`
- 6 sample products with variants

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Test the Setup

1. **Test Login:**
   - Go to `/login`
   - Try logging in with `admin@nek.com` / `admin123`
   - You should be redirected to `/admin`

2. **Test Registration:**
   - Go to `/register`
   - Create a new account
   - Check your email (if Resend is configured) for welcome email

3. **Test Products:**
   - Browse products at `/products`
   - View product details
   - Add items to cart

4. **Test Checkout:**
   - Add items to cart
   - Go to checkout
   - Complete an order
   - Check email for order confirmation

5. **Test Forgot Password:**
   - Go to `/forgot-password`
   - Submit one of the demo emails
   - Click the link in the email (Resend dashboard shows the message if using onboarding domain)
   - Reset the password on `/reset-password`

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure your IP is allowed (Supabase allows all by default)

### Email Not Sending

- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for any errors
- For development, emails might be in Resend's logs

### Images Not Loading

- Verify Cloudinary credentials
- Check that images are publicly accessible
- For development, Unsplash images should still work

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your current URL
- Clear browser cookies and try again

## Production Deployment

### Vercel (Recommended - FREE)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add all environment variables from `.env.local`
5. Deploy!

### Environment Variables for Production

Make sure to update:
- `NEXTAUTH_URL` to your production domain
- `RESEND_FROM_EMAIL` to your verified domain email
- All other variables remain the same

## Next Steps

- [ ] Verify your domain with Resend for production emails
- [ ] Set up custom domain with Vercel
- [ ] Configure production database backups
- [ ] Set up monitoring and alerts
- [ ] Add payment processing (Stripe) when ready

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all services are properly configured
4. Check service dashboards for any errors

---

**Congratulations!** Your production-ready e-commerce platform is now set up with the free stack! 🎉

