# Resend Domain Verification Setup Guide (FREE)

Domain verification in Resend is **completely free** and allows you to send emails to any recipient (not just your own email).

## Prerequisites

You need:
1. ✅ A Resend account (free)
2. ✅ A domain name (see options below if you don't have one)
3. ✅ Access to your domain's DNS settings

## Option 1: If You Already Have a Domain

### Step 1: Log in to Resend
1. Go to https://resend.com
2. Log in to your account

### Step 2: Add Your Domain
1. Go to https://resend.com/domains
2. Click **"Add Domain"** button
3. Enter your domain (e.g., `yourdomain.com` or `nekbrand.com`)
4. Click **"Add"**

### Step 3: Get DNS Records
Resend will show you DNS records to add. You'll typically see:
- **SPF Record** (TXT record)
- **DKIM Record** (TXT record)
- Sometimes a CNAME record

Example:
```
Type: TXT
Name: @ (or your domain)
Value: v=spf1 include:resend.com ~all
```

### Step 4: Add DNS Records to Your Domain
1. Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Go to DNS Management / DNS Settings
3. Add the DNS records Resend provided:
   - **Type**: TXT (or CNAME if specified)
   - **Name**: As shown in Resend (usually `@` or `_resend`)
   - **Value**: Copy exactly from Resend
   - **TTL**: 3600 (or default)

### Step 5: Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours
- Usually takes 10-30 minutes
- You can check status at: https://dnschecker.org

### Step 6: Verify Domain in Resend
1. Go back to https://resend.com/domains
2. Find your domain in the list
3. Click **"Verify"** button
4. Resend will check if DNS records are correct
5. Once verified, you'll see a green checkmark ✅

### Step 7: Update Your .env.local
```env
RESEND_FROM_EMAIL="NEK <noreply@yourdomain.com>"
```
Replace `yourdomain.com` with your actual domain.

### Step 8: Restart Your Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 9: Test It!
Visit:
```
http://localhost:3000/api/test-email?to=any-email@example.com
```
Now you can send to any email address! 🎉

---

## Option 2: If You Don't Have a Domain (Free Options)

### Free Domain Options:

#### A. Use a Subdomain (Free)
If you have any domain (even a free one), you can use a subdomain:
- Example: `mail.yourdomain.com` or `noreply.yourdomain.com`

#### B. Get a Free Domain
1. **Freenom** (https://www.freenom.com) - Free .tk, .ml, .ga domains
2. **GitHub Student Pack** - Free domain with .me TLD (if you're a student)
3. **Cloudflare** - Sometimes offers free domains for developers

#### C. Use a Domain You Already Own
- Check if you have any domains registered
- Even if it's not being used, you can verify it for email

### Quick Setup with Free Domain:

1. **Get a free domain** from Freenom (or use existing)
2. **Follow Steps 1-9 above** with your free domain
3. **Note**: Free domains may have limitations, but work fine for email

---

## Common DNS Providers Setup

### Cloudflare
1. Log in → Select your domain
2. Go to **DNS** → **Records**
3. Click **"Add record"**
4. Add the TXT records from Resend
5. Save

### GoDaddy
1. Log in → My Products → Domains
2. Click **"DNS"** next to your domain
3. Scroll to **"Records"**
4. Click **"Add"** → Add TXT records
5. Save

### Namecheap
1. Log in → Domain List
2. Click **"Manage"** next to your domain
3. Go to **"Advanced DNS"**
4. Add new records → Add TXT records
5. Save

### Google Domains
1. Log in → My domains
2. Click your domain → **"DNS"**
3. Scroll to **"Custom resource records"**
4. Add TXT records
5. Save

---

## Troubleshooting

### DNS Records Not Verifying?

1. **Check DNS Propagation:**
   - Visit: https://dnschecker.org
   - Enter your domain
   - Check if TXT records appear

2. **Wait Longer:**
   - DNS can take up to 48 hours (usually 10-30 min)
   - Be patient and try verifying again later

3. **Check Record Format:**
   - Make sure you copied the value exactly
   - No extra spaces or quotes
   - Name field is correct (@ or _resend)

4. **Check TTL:**
   - Lower TTL (300-600) helps propagation
   - Higher TTL (3600) is fine once set

### Still Having Issues?

1. **Check Resend Dashboard:**
   - Go to https://resend.com/domains
   - Look for error messages
   - Resend shows what's missing

2. **Contact Your Domain Registrar:**
   - They can help with DNS settings
   - Some registrars have specific formats

3. **Resend Support:**
   - Email: support@resend.com
   - They're very helpful!

---

## After Verification

Once your domain is verified:

✅ You can send emails to **any recipient**  
✅ Better email deliverability  
✅ Professional "from" address  
✅ No more test domain restrictions  

### Update Your App

Make sure to update `.env.local`:
```env
RESEND_FROM_EMAIL="NEK <noreply@yourdomain.com>"
```

And for production, use:
```env
RESEND_FROM_EMAIL="NEK <noreply@yourdomain.com>"
NEXTAUTH_URL="https://yourdomain.com"
```

---

## Quick Checklist

- [ ] Have a domain (or get a free one)
- [ ] Log in to Resend
- [ ] Add domain in Resend dashboard
- [ ] Copy DNS records from Resend
- [ ] Add DNS records to your domain registrar
- [ ] Wait for DNS propagation (10-30 min)
- [ ] Verify domain in Resend
- [ ] Update `.env.local` with your domain email
- [ ] Restart dev server
- [ ] Test with `/api/test-email?to=any-email@example.com`

---

## Need Help?

If you get stuck:
1. Check Resend's docs: https://resend.com/docs/dashboard/domains/introduction
2. Check DNS propagation: https://dnschecker.org
3. Contact Resend support: support@resend.com

Good luck! 🚀

