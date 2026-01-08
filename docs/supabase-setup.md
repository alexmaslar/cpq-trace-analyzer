# Supabase Setup Guide

This guide walks you through setting up Supabase for the CPQ Trace Analyzer, enabling baseline storage, user authentication, and raw trace file storage.

---

## Prerequisites

- **Supabase Account** - Sign up at https://supabase.com if you don't have one
- **Node.js 18+** and npm installed
- Project code cloned locally

---

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

This installs the Supabase JavaScript client library.

---

## Step 2: Create Supabase Project

### 2.1 Create New Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name**: `cpq-trace-analyzer` (or your preference)
   - **Database Password**: Generate a strong password and **save it**
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is sufficient to start

4. Click "Create new project"
5. Wait ~2 minutes for project to initialize

### 2.2 Get API Keys

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them next):
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (keep this SECRET - has admin access)

---

## Step 3: Configure Environment Variables

### 3.1 Create .env.local File

```bash
cp .env.local.example .env.local
```

### 3.2 Fill in Your Values

Edit `.env.local` with your actual Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Replace `your-project` with your actual project ID
- Use the **anon public** key (not service_role) for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Use the **service_role** key for `SUPABASE_SERVICE_ROLE_KEY`
- Never commit `.env.local` to git (it's in .gitignore)

---

## Step 4: Run Database Migration

### Option A: Using Supabase CLI (Recommended)

#### 4.1 Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

Or see https://supabase.com/docs/guides/cli for other installation methods.

#### 4.2 Link to Your Project

```bash
npx supabase link --project-ref your-project-id
```

Replace `your-project-id` with the ID from your project URL (e.g., if URL is `https://abcdefgh.supabase.co`, the ID is `abcdefgh`).

You'll be prompted to enter your database password (from Step 2.1).

#### 4.3 Run Migration

```bash
npx supabase db push
```

This executes `supabase/migrations/20240115000000_initial_schema.sql` on your database.

**Expected Output:**
```
Applying migration 20240115000000_initial_schema.sql...
Migration applied successfully.
```

---

### Option B: Using SQL Editor (Alternative)

If you prefer not to use the CLI:

1. Go to **SQL Editor** in Supabase dashboard
2. Open `supabase/migrations/20240115000000_initial_schema.sql` in your code editor
3. Copy the entire SQL content
4. Paste into SQL Editor in Supabase
5. Click "Run"
6. Verify: "Success. No rows returned"

---

## Step 5: Verify Setup

### 5.1 Check Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. Verify these tables exist:
   - `traces`
   - `baselines`
   - `user_storage_usage` (view)

### 5.2 Check Row Level Security

1. Go to **Authentication** → **Policies**
2. Verify RLS is enabled for:
   - `traces` table (4 policies)
   - `baselines` table (4 policies)

---

## Step 6: Enable Email Authentication

### 6.1 Configure Auth Settings

1. Go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure email settings:
   - **Enable email confirmations**: Optional (recommended for production)
   - **Secure email change**: Enabled (recommended)

### 6.2 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - **Confirm Signup** email
   - **Magic Link** email
   - **Reset Password** email

---

## Step 7: Test Connection

### 7.1 Start Development Server

```bash
npm run dev
```

### 7.2 Test Authentication

In your browser console:

```javascript
// Import Supabase client
import { supabase } from './lib/supabase-client';

// Test connection
const { data, error } = await supabase.from('traces').select('count');
console.log('Connection test:', data, error);

// Should return: { count: 0 } (empty table, no error)
```

If you get an error, check:
- Environment variables are set correctly
- `.env.local` file exists
- Development server was restarted after adding env vars

---

## Step 8: Create First User (Optional)

### Option A: Via Code

```javascript
import { supabase } from './lib/supabase-client';

// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'your-secure-password',
});

console.log('User created:', data, error);
```

### Option B: Via Dashboard

1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Fill in email and password
4. Click "Create user"

---

## Step 9: Migrate Existing Baselines (If Applicable)

If you have baselines in localStorage from the old implementation:

```typescript
import { performMigration, hasLocalStorageBaselines } from './lib/migrate-from-localstorage';

// Check if migration needed
if (hasLocalStorageBaselines()) {
  console.log('Found baselines in localStorage, migrating...');

  const results = await performMigration();

  console.log(`Migration complete: ${results.success} successful, ${results.failed} failed`);

  if (results.errors.length > 0) {
    console.error('Migration errors:', results.errors);
  }
}
```

**Note:** Migrated baselines will have reconstructed raw content (not perfect, but functional).

---

## Step 10: Update Baseline Storage Import

Update all imports from old localStorage implementation to new Supabase implementation:

```typescript
// OLD (localStorage)
import { addBaseline, getBaselines } from '@/lib/baseline-storage';

// NEW (Supabase)
import { addBaseline, getBaselines } from '@/lib/baseline-storage-supabase';
```

**Files to Update:**
- `app/page.tsx`
- Any components that use baseline storage

---

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Cause:** Environment variables not set or not loaded

**Fix:**
1. Verify `.env.local` exists
2. Check variable names match exactly
3. Restart development server: `npm run dev`
4. Clear Next.js cache: `rm -rf .next && npm run dev`

---

### Error: "Not authenticated"

**Cause:** User not signed in

**Fix:**
1. Create user account (Step 8)
2. Sign in before using baseline operations:

```typescript
import { supabase } from './lib/supabase-client';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'your-password',
});
```

---

### Error: "Failed to create baseline"

**Cause:** Database permission issue or missing tables

**Fix:**
1. Verify migration ran successfully (Step 4)
2. Check RLS policies exist (Step 5.2)
3. Verify user is authenticated
4. Check browser console for detailed error

---

### Error: "Storage quota exceeded"

**Cause:** User has stored >50MB of trace files

**Fix:**
1. Delete old baselines to free space
2. Or increase quota in SQL:

```sql
-- Increase quota to 100MB
UPDATE public.baselines
SET quota_mb = 100
WHERE user_id = 'user-uuid';
```

---

### Migration Errors

If migration fails:

```sql
-- Drop tables and start fresh
DROP TABLE IF EXISTS public.baselines CASCADE;
DROP TABLE IF EXISTS public.traces CASCADE;
DROP VIEW IF EXISTS public.user_storage_usage CASCADE;

-- Then re-run migration
```

---

## Production Deployment

### Vercel Environment Variables

When deploying to Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (Production)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production)
   - `SUPABASE_SERVICE_ROLE_KEY` (Secret, Production)

3. **Important:** Use Production values, not Development values

---

## Storage Limits

### Free Tier Limits

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| Database | 500MB | Includes all tables |
| Storage | 1GB | For files (not used yet) |
| Bandwidth | 2GB | API requests |
| Auth Users | Unlimited | No limit |

### Recommended Limits Per User

- **Baseline Count**: 20-50 baselines
- **Trace File Size**: 500KB average
- **Storage Per User**: 50MB (configurable in SQL)

---

## Security Best Practices

1. **Never commit .env.local**
   - Already in .gitignore
   - If accidentally committed, regenerate keys

2. **Use Row Level Security (RLS)**
   - Already configured in migration
   - Users can only access their own data

3. **Rotate Service Role Key**
   - If compromised, regenerate in Supabase dashboard
   - Update all deployments

4. **Enable Email Confirmation**
   - Prevents fake account creation
   - Recommended for production

5. **Monitor Usage**
   - Check Supabase dashboard regularly
   - Set up usage alerts

---

## Next Steps

After setup is complete:

1. ✅ Test creating a baseline
2. ✅ Test loading baselines
3. ✅ Test regression comparison
4. ✅ Verify raw trace content is stored
5. ✅ Test migration utility (if applicable)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Project Issues**: Create issue in repository

---

## Summary

You've successfully set up Supabase for CPQ Trace Analyzer! Your baselines now include:

✅ **Raw trace file content** - Full trace stored in database
✅ **Parsed data** - Quick access to structured data
✅ **User authentication** - Secure per-user storage
✅ **50MB quota per user** - Generous storage limits
✅ **Row Level Security** - Data isolation by user
✅ **Migration utility** - Import from localStorage

Start using the new Supabase-backed baseline storage and enjoy unlimited, secure trace storage!
