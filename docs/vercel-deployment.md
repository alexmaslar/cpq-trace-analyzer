# Vercel Deployment Guide

Complete guide to deploying the CPQ Trace Analyzer on Vercel with Supabase backend.

---

## Overview

**Vercel** provides:
- ✅ Zero-config Next.js hosting
- ✅ Automatic deployments on git push
- ✅ Edge network (global CDN)
- ✅ Preview deployments for PRs
- ✅ Built-in analytics
- ✅ HTTPS by default

**Perfect for:** Next.js apps with Supabase backend

---

## Prerequisites

- ✅ GitHub/GitLab/Bitbucket repository with your code
- ✅ Supabase project set up (see `docs/supabase-setup.md`)
- ✅ Vercel account (free tier available)

---

## Quick Start (5 Minutes)

### 1. Connect Repository to Vercel

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. **Import Git Repository:**
   - Select your GitHub/GitLab/Bitbucket account
   - Choose your `cpq-trace-analyzer` repository
   - Click **"Import"**

### 2. Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
```
Build Command: npm run build
Output Directory: .next (default)
Install Command: npm install
Development Command: npm run dev
```

**Leave defaults** - Vercel auto-detects these from Next.js.

### 3. Add Environment Variables

**Critical:** Add these in Vercel dashboard before deploying.

Click **"Environment Variables"** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production (Secret) |

**Important:**
- Use **same values** from your `.env.local`
- Mark `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive** (hide from logs)
- Apply to **all environments** (Production, Preview, Development)

**Where to find these:**
- Supabase Dashboard → Settings → API
- Copy from your local `.env.local` file

### 4. Deploy

Click **"Deploy"**

**Wait ~2 minutes** for build to complete.

---

## Deployment Workflow

### Automatic Deployments

**Production Deployments:**
```
git push origin main
→ Vercel deploys to production
→ https://cpq-trace-analyzer.vercel.app
```

**Preview Deployments:**
```
git push origin feature-branch
→ Vercel creates preview deployment
→ https://cpq-trace-analyzer-git-feature-branch.vercel.app
```

**Pull Request Deployments:**
```
Create PR on GitHub
→ Vercel creates preview deployment
→ Comment on PR with preview URL
```

### Manual Deployments

**From Vercel Dashboard:**
1. Go to your project
2. Click **"Deployments"**
3. Click **"Redeploy"** on any deployment
4. Or use **"Deploy"** button to deploy from branch

**From CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

---

## Environment Variables Setup

### Production vs Preview vs Development

**Production Environment:**
- Used for `main` branch deployments
- Public URL: `cpq-trace-analyzer.vercel.app`
- Use production Supabase credentials

**Preview Environment:**
- Used for PR and branch deployments
- Public URL: `cpq-trace-analyzer-git-*.vercel.app`
- Can use same or separate Supabase project

**Development Environment:**
- Used for `vercel dev` local development
- Same as `.env.local`

### Adding Environment Variables

**Option 1: Vercel Dashboard**

1. Go to **Project Settings** → **Environment Variables**
2. Click **"Add New"**
3. Fill in:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://your-project.supabase.co`
   - **Environments:** Select all (Production, Preview, Development)
4. Click **"Save"**
5. Repeat for all variables

**Option 2: Vercel CLI**

```bash
# Add environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

# Add secret (sensitive)
vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive
# Paste value when prompted
```

**Option 3: Import from .env.local**

```bash
# Pull existing variables
vercel env pull .env.vercel

# Push to Vercel
vercel env add < .env.local
```

### Required Environment Variables

```bash
# Required for app to function
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for API routes (mark as sensitive!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Vercel Analytics (auto-configured in production)
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

---

## Custom Domain Setup (Optional)

### Add Custom Domain

1. Go to **Project Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `cpq-analyzer.yourdomain.com`
4. Click **"Add"**

### Configure DNS

**Option A: Vercel Nameservers (Recommended)**

If Vercel manages your domain:
1. Vercel provides nameservers
2. Update at your domain registrar
3. DNS configured automatically

**Option B: CNAME Record**

If you manage DNS elsewhere:
1. Add CNAME record:
   ```
   cpq-analyzer.yourdomain.com → cname.vercel-dns.com
   ```
2. Wait for DNS propagation (~5 minutes)

### SSL Certificate

- ✅ **Automatic:** Vercel provisions SSL certificate
- ✅ **Free:** Let's Encrypt certificate
- ✅ **Auto-renew:** Handled by Vercel
- ✅ **HTTPS redirect:** Enabled by default

---

## Build Configuration

### vercel.json

Already configured in your project:

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

**regions:** Deployment region (iad1 = Washington DC)
- Change to region closest to your users
- Options: `sfo1` (San Francisco), `lhr1` (London), `hnd1` (Tokyo)

### Build Optimizations

**Next.js Config (next.config.js - optional):**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ['supabase.co'],
  },

  // Enable SWC minification
  swcMinify: true,

  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};

module.exports = nextConfig;
```

---

## Performance & Monitoring

### Vercel Analytics

**Enable Analytics:**

1. Go to **Analytics** tab in Vercel dashboard
2. Click **"Enable Analytics"**
3. Analytics automatically enabled (free on Pro plan)

**What You Get:**
- Page view tracking
- Performance metrics (Web Vitals)
- Top pages and referrers
- Real User Monitoring (RUM)

**In Code:**

Analytics already work via Vercel platform. No code changes needed!

**Optional:** Add custom events:

```typescript
import { track } from '@vercel/analytics';

// Track custom event
track('baseline_created', { name: 'My Baseline' });
```

### Speed Insights

**Enable Speed Insights:**

1. Go to **Speed Insights** tab
2. Click **"Enable"**

**Provides:**
- Core Web Vitals
- Performance score
- Page load times
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

---

## Production Checklist

### Before First Deployment

- [ ] Environment variables configured in Vercel
- [ ] Supabase project in production mode
- [ ] Database migration applied to production
- [ ] `.env.local` NOT committed to git
- [ ] Build succeeds locally: `npm run build`
- [ ] TypeScript checks pass: `npm run build`
- [ ] ESLint passes: `npm run lint`

### After Deployment

- [ ] Visit production URL and test
- [ ] Sign up for test account
- [ ] Create test baseline
- [ ] Verify raw trace content stored
- [ ] Test regression comparison
- [ ] Check Vercel deployment logs
- [ ] Verify environment variables loaded
- [ ] Test all tabs (Info, Debug, Integration, Regression)

### Security Checklist

- [ ] RLS enabled in Supabase
- [ ] Service role key marked as sensitive
- [ ] HTTPS enabled (automatic)
- [ ] CORS configured correctly
- [ ] Auth working properly
- [ ] API routes require authentication

---

## Troubleshooting

### Build Fails: "Missing environment variables"

**Cause:** Environment variables not set in Vercel

**Fix:**
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Redeploy: Deployments → Redeploy

---

### "Not authenticated" in Production

**Cause:** Supabase Auth domain mismatch

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to **Site URL**:
   ```
   https://cpq-trace-analyzer.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://cpq-trace-analyzer.vercel.app/**
   ```

---

### API Routes Return 500

**Cause:** Missing or incorrect service role key

**Fix:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars
2. Check key is correct in Supabase Dashboard → Settings → API
3. Ensure key is added to **Production** environment
4. Redeploy

---

### Build Succeeds but App Doesn't Load

**Cause:** Client-side environment variables not prefixed with `NEXT_PUBLIC_`

**Fix:**

Ensure client-side variables start with `NEXT_PUBLIC_`:

```bash
# ✅ Correct (accessible in browser)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# ❌ Wrong (only available server-side)
SUPABASE_URL=...
```

---

### "Error: CORS policy" in Console

**Cause:** Missing CORS headers for API routes

**Fix:**

Already configured in `vercel.json`. If still having issues:

```typescript
// app/api/baselines/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE');

  return response;
}
```

---

### High Bandwidth Usage

**Cause:** Large trace files downloaded frequently

**Fix:**
1. Implement pagination for baseline list
2. Add caching headers
3. Consider Vercel Pro for higher bandwidth limits

---

## Vercel CLI Reference

### Installation

```bash
npm i -g vercel
```

### Common Commands

```bash
# Login
vercel login

# Link local project to Vercel project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME production

# Remove environment variable
vercel env rm VARIABLE_NAME production

# Pull environment variables locally
vercel env pull .env.vercel

# List deployments
vercel ls

# View project info
vercel inspect
```

---

## Advanced Configuration

### Multiple Environments

**Staging Environment:**

1. Create separate Supabase project for staging
2. Add staging environment variables in Vercel
3. Deploy specific branch to staging

**Example Workflow:**
```
main → Production (cpq-analyzer.vercel.app)
staging → Staging (cpq-analyzer-staging.vercel.app)
feature-* → Preview (cpq-analyzer-git-feature.vercel.app)
```

### Custom Build Command

If you need custom build steps:

```json
// vercel.json
{
  "buildCommand": "npm run build && npm run postbuild",
  "installCommand": "npm ci"
}
```

### Edge Functions (Future)

Vercel supports Edge Functions for ultra-low latency:

```typescript
// app/api/baselines/route.ts
export const runtime = 'edge'; // Run on Edge network

export async function GET(request: Request) {
  // Runs on Vercel Edge Network (faster)
}
```

---

## Cost Considerations

### Free Tier (Hobby)

**Includes:**
- Unlimited deployments
- 100GB bandwidth/month
- 100 GB-hours compute/month
- Automatic HTTPS
- Preview deployments
- Web Analytics (basic)

**Limits:**
- 1 concurrent build
- 12 max build duration (minutes)
- 50MB max function size

**Good for:** Personal projects, development, testing

---

### Pro Plan ($20/month)

**Includes:**
- 1TB bandwidth/month
- 1000 GB-hours compute/month
- Advanced analytics
- Password protection
- 3 concurrent builds
- 45 min max build duration
- 250MB max function size

**Good for:** Production apps, teams

---

### Bandwidth Estimation

**Typical Usage:**
- Average trace file: 500KB
- Average baseline: 500KB raw + 100KB parsed = 600KB
- Page assets: ~200KB

**Monthly Bandwidth Example:**
```
100 users × 10 baselines each × 600KB = 600MB baseline downloads
100 users × 50 page views × 200KB = 1GB page views
Total: ~1.6GB/month (well within free tier)
```

---

## Monitoring & Alerts

### Deployment Notifications

**GitHub Integration:**
- Automatic deployment status on PRs
- Comment with preview URL
- Build success/failure notifications

**Slack Integration:**
1. Go to Project Settings → Integrations
2. Add Slack integration
3. Choose notification preferences

**Email Notifications:**
- Enabled by default
- Configure in Account Settings

---

## Security Best Practices

### Environment Variables

- ✅ **Never commit** `.env.local` to git
- ✅ Mark sensitive variables as **Sensitive**
- ✅ Rotate keys periodically
- ✅ Use different keys for staging/production

### Deployment Protection

**Enable Deployment Protection:**
1. Go to Project Settings → Deployment Protection
2. Enable **"Vercel Authentication"** for Preview deployments
3. Requires Vercel login to view previews

**Password Protection (Pro):**
1. Settings → Deployment Protection
2. Enable **"Password Protection"**
3. Set password for staging environment

### Allowed Domains

**Supabase CORS:**
1. Supabase Dashboard → API Settings
2. Add Vercel domains to allowed origins:
   ```
   https://cpq-trace-analyzer.vercel.app
   https://*.vercel.app
   ```

---

## Rollback & Recovery

### Rollback to Previous Deployment

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"..."** menu → **"Promote to Production"**
4. Confirm

**Instant rollback** to any previous deployment!

### Inspect Deployment

```bash
# View deployment details
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>
```

---

## Summary

**Deployment Steps:**
1. ✅ Connect GitHub repo to Vercel
2. ✅ Add environment variables
3. ✅ Deploy (automatic on git push)
4. ✅ Configure custom domain (optional)
5. ✅ Enable analytics

**Auto-Configured:**
- ✅ HTTPS/SSL
- ✅ CDN (global edge network)
- ✅ Preview deployments
- ✅ Build optimization

**Production Ready:**
- ✅ Zero-downtime deployments
- ✅ Instant rollbacks
- ✅ Edge network performance
- ✅ Automatic scaling

**Next Steps:**
1. Complete Supabase setup (if not done)
2. Deploy to Vercel
3. Add custom domain
4. Enable analytics
5. Share with users!

🚀 **Your CPQ Trace Analyzer is ready for production!**
