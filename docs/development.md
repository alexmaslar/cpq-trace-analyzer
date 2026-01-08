# Development Guide

This guide covers setup, development workflow, common tasks, debugging, and build process for the CPQ Trace Analyzer.

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher
  - Check version: `node --version`
  - Download: https://nodejs.org/

- **npm** 9.0.0 or higher (comes with Node.js)
  - Check version: `npm --version`

- **Git** (for version control)
  - Check version: `git --version`

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - React Developer Tools (browser extension)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd cpq-trace-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Production dependencies**: Next.js 16, React 19, Lucide React
- **Development dependencies**: TypeScript 5, Tailwind CSS 4, ESLint 9

### 3. Verify Installation

```bash
npm run build
```

Should complete without errors. If successful, you're ready to develop!

---

## Project Scripts

### Development

```bash
npm run dev
```

**Purpose:** Starts development server with hot reload

**Details:**
- Runs on `http://localhost:3000`
- Hot module replacement (HMR) for instant updates
- Turbopack for fast builds
- Error overlay in browser
- Source maps enabled

**Use when:** Actively developing and testing changes

---

### Build

```bash
npm run build
```

**Purpose:** Production build with TypeScript checking and optimization

**Details:**
- Runs TypeScript compiler to check types
- Builds optimized production bundle
- Generates static pages
- Shows build output and bundle sizes
- Fails if TypeScript errors exist

**Use when:**
- Before committing changes
- Testing production behavior
- Validating TypeScript compliance

**Output:**
```
Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
```

---

### Start Production Server

```bash
npm run start
```

**Purpose:** Starts production server (requires `npm run build` first)

**Details:**
- Serves optimized production build
- No hot reload (rebuild required for changes)
- Production performance testing

**Use when:**
- Testing production build locally
- Performance benchmarking
- Pre-deployment validation

---

### Lint

```bash
npm run lint
```

**Purpose:** Runs ESLint to check code quality

**Details:**
- Uses `eslint-config-next` rules
- Checks TypeScript and JSX files
- Reports code style violations
- Identifies potential bugs

**Use when:**
- Before committing code
- As part of CI/CD pipeline
- Regular code quality checks

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

Open browser to `http://localhost:3000`

### 2. Make Changes

Edit files in:
- `app/` - Components, pages, layouts
- `lib/` - Business logic, parsers
- `docs/` - Documentation

Changes appear instantly (HMR).

### 3. Test Locally

- Upload trace files through UI
- Test features in browser
- Check console for errors
- Use React DevTools for component inspection

### 4. Verify TypeScript

```bash
npm run build
```

Ensures no type errors before committing.

### 5. Lint Code

```bash
npm run lint
```

Fix any reported issues.

### 6. Commit Changes

```bash
git add .
git commit -m "feat: Add new feature"
git push origin feature-branch
```

Follow [conventional commits](https://www.conventionalcommits.org/).

### 7. Create Pull Request

- Push branch to remote
- Open PR in GitHub/GitLab
- Add description and screenshots
- Request review

---

## Common Tasks

### Adding a New Component

#### 1. Determine Category

Choose appropriate directory:
- `app/components/tabs/` - Tab wrappers
- `app/components/sections/` - Content sections
- `app/components/shared/` - Reusable UI components
- `app/components/regression/` - Regression-specific
- `app/components/compare/` - Compare-specific
- `app/components/layout/` - Layout components

#### 2. Create Component File

```typescript
/**
 * MyComponent - Brief description
 */

'use client';

import { useState } from 'react';
import type { MyType } from '@/lib/trace-parser';

interface MyComponentProps {
  data: MyType;
  onAction?: () => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### 3. Import and Use

```typescript
import { MyComponent } from '@/app/components/shared/MyComponent';

<MyComponent data={someData} onAction={handleAction} />
```

#### 4. Document in components.md

Add entry to `docs/components.md` with props, usage, and features.

---

### Adding a New Tab

#### 1. Create Tab Component

```typescript
// app/components/tabs/MyTab.tsx
'use client';

import { MySection } from '@/app/components/sections/MySection';
import type { ParsedTrace } from '@/lib/trace-parser';

interface MyTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}

export function MyTab({ trace, searchTerm }: MyTabProps) {
  return (
    <div className="space-y-6">
      <MySection data={trace.myData} searchTerm={searchTerm} />
    </div>
  );
}
```

#### 2. Update Types

```typescript
// app/types/index.ts
export type TabId = 'info' | 'debug' | 'integration' | 'compare' | 'regression' | 'mytab';
```

#### 3. Update TabNavigation

```typescript
// app/components/layout/TabNavigation.tsx
import { MyTabIcon } from 'lucide-react';

const TABS = [
  // ...existing tabs
  { id: 'mytab' as TabId, label: 'My Tab', icon: MyTabIcon, visibleIn: ['single'] as ViewMode[] },
];
```

#### 4. Update page.tsx

```typescript
// app/page.tsx
import { MyTab } from '@/app/components/tabs/MyTab';

{activeTab === 'mytab' && <MyTab trace={baselineTrace} searchTerm={searchTerm} />}
```

#### 5. Update useSearchMatches

```typescript
// app/hooks/useSearchMatches.ts
const counts: SearchMatchCounts = {
  info: 0,
  debug: 0,
  integration: 0,
  compare: 0,
  regression: 0,
  mytab: 0,  // Add new tab
};

// Add search logic for new tab
```

---

### Modifying Trace Parser

#### 1. Locate Parser Logic

```bash
lib/trace-parser.ts  # Main parsing engine (2,213 lines)
```

#### 2. Identify Section to Modify

Parser is organized by sections:
- `parseConfigurationMetadata()` - Header metadata
- `parseFeatures()` - Feature selections
- `parseRuleExecution()` - Rule execution data
- `parseVariableTracking()` - Variable assignments
- `parseConditionTracking()` - Condition evaluations
- `parseIntegrationOutputs()` - Integration data

#### 3. Make Changes

```typescript
function parseMySection(lines: string[]): MySectionData {
  const result: MySectionData = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Parsing logic
  }

  return result;
}
```

#### 4. Update ParsedTrace Type

```typescript
// In lib/trace-parser.ts
export interface ParsedTrace {
  metadata: ConfigurationMetadata;
  features: Map<string, FeatureData>;
  // ...existing fields
  mySection?: MySectionData;  // Add new section
}
```

#### 5. Integrate into Main Parse Function

```typescript
export function parseTrace(content: string): ParsedTrace {
  const lines = content.split(/\r?\n/);

  return {
    metadata: parseConfigurationMetadata(lines),
    features: parseFeatures(lines),
    // ...existing sections
    mySection: parseMySection(lines),  // Add new section
  };
}
```

#### 6. Test with Real Trace Files

Upload actual CPQ trace files to verify parsing works correctly.

---

### Adding New Trace Data Type

#### 1. Define Type in Parser

```typescript
// lib/trace-parser.ts
export interface MyDataType {
  id: string;
  name: string;
  value: string | number;
  lineNumber: number;
}
```

#### 2. Parse Data

```typescript
function parseMyData(lines: string[]): MyDataType[] {
  const results: MyDataType[] = [];
  // Parsing logic
  return results;
}
```

#### 3. Add to ParsedTrace

```typescript
export interface ParsedTrace {
  // ...existing fields
  myData?: MyDataType[];
}
```

#### 4. Create Section Component

```typescript
// app/components/sections/MyDataSection.tsx
export function MyDataSection({ data }: { data: MyDataType[] }) {
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}: {item.value}</div>
      ))}
    </div>
  );
}
```

#### 5. Add to Appropriate Tab

```typescript
// app/components/tabs/InfoTab.tsx (or other tab)
{trace.myData && <MyDataSection data={trace.myData} />}
```

---

### Extending Baseline Storage

#### 1. Locate Storage Logic

```bash
lib/baseline-storage.ts  # Baseline management (369 lines)
```

#### 2. Current Implementation

Uses browser `localStorage` with JSON serialization:

```typescript
export function addBaseline(name: string, filename: string, trace: ParsedTrace): BaselineTrace {
  const baselines = getBaselines();
  const newBaseline = {
    id: Date.now().toString(),
    name,
    filename,
    trace,
    selectionPath: extractSelectionPath(trace),
    timestamp: Date.now(),
  };
  baselines.push(newBaseline);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(baselines));
  return newBaseline;
}
```

#### 3. Migration to Supabase (Future)

When migrating to Supabase:

1. Create Supabase client:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

2. Replace localStorage calls with Supabase queries:
```typescript
export async function addBaseline(name: string, filename: string, trace: ParsedTrace): Promise<BaselineTrace> {
  const { data, error } = await supabase
    .from('baselines')
    .insert({
      name,
      filename,
      trace_id: trace.metadata.id,
      selection_path: extractSelectionPath(trace),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

3. Update all baseline functions similarly

---

## Debugging

### React DevTools

Install browser extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Features:**
- Component tree inspection
- Props and state viewing
- Performance profiling
- Context value inspection

**Usage:**
1. Open browser DevTools (F12)
2. Navigate to "Components" tab
3. Select component in tree
4. Inspect props, state, hooks on right panel

---

### Browser Console

Check console for errors and warnings:

**Common Issues:**

1. **Parse Errors:**
```
Failed to parse trace: Invalid feature syntax at line 123
```
Fix: Check trace file format at line 123

2. **Context Errors:**
```
useTraceViewerContext must be used within a TraceViewerProvider
```
Fix: Ensure component is wrapped in TraceViewerContextProvider

3. **Type Errors:**
```
Property 'myProp' does not exist on type 'MyType'
```
Fix: Check TypeScript interface definitions

---

### Raw Trace Viewer

Use built-in Raw Trace Viewer for debugging:

1. Click any line number in the UI
2. Modal opens showing raw trace at that line
3. Inspect actual trace content
4. Compare with parsed output

**Useful for:**
- Verifying parser correctness
- Understanding trace format
- Debugging parsing issues

---

### LocalStorage Inspection

Inspect baseline storage:

1. Open browser DevTools
2. Navigate to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "Local Storage" → `http://localhost:3000`
4. Look for `cpq-trace-analyzer-baselines` key
5. View JSON value

**Commands:**
```javascript
// In browser console
localStorage.getItem('cpq-trace-analyzer-baselines')
localStorage.removeItem('cpq-trace-analyzer-baselines')  // Clear all baselines
```

---

### TypeScript Errors

Run build to see all TypeScript errors:

```bash
npm run build
```

**Common Fixes:**

1. **Missing imports:**
```typescript
import type { MyType } from '@/lib/trace-parser';
```

2. **Incorrect prop types:**
```typescript
interface MyProps {
  data: string;  // Was: number
}
```

3. **Null/undefined handling:**
```typescript
const value = trace?.metadata?.configName ?? 'Unknown';
```

---

### Network Requests (Future)

When using Supabase backend:

1. Open browser DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Inspect requests to Supabase
4. Check request/response payloads
5. Verify authentication headers

---

## Build Process

### Development Build

```bash
npm run dev
```

**Process:**
1. Turbopack builds app in development mode
2. Hot Module Replacement (HMR) enabled
3. Source maps generated
4. No optimization (faster builds)
5. Error overlay in browser

---

### Production Build

```bash
npm run build
```

**Process:**
1. **TypeScript Compilation**
   - Runs `tsc --noEmit` to check types
   - Fails if any TypeScript errors exist

2. **Next.js Build**
   - Compiles app with Turbopack
   - Optimizes JavaScript bundles
   - Generates static pages
   - Extracts CSS

3. **Static Generation**
   - Pre-renders pages at build time
   - Generates HTML for each route

4. **Bundle Analysis**
   - Shows page sizes
   - Identifies large dependencies

5. **Output**
   - `.next/` directory with production assets

**Build Output:**
```
Route (app)
┌ ○ /                  # Static page
└ ○ /_not-found        # 404 page

○  (Static)  prerendered as static content
```

---

### Optimization

**Current:**
- Static page generation for optimal performance
- Automatic code splitting by route
- CSS extraction and minification
- JavaScript minification with Turbopack

**Future (with Supabase):**
- Server-side rendering for authenticated routes
- Edge functions for API routes
- Incremental Static Regeneration for baseline library

---

## Environment Configuration

### Current (Client-Side Only)

No environment variables needed.

### Target (Supabase Backend)

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel Analytics (auto-configured in production)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

**Note:** `.env.local` is git-ignored. Never commit secrets!

---

## Troubleshooting

### Port Already in Use

**Error:**
```
Port 3000 is already in use
```

**Fix:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

---

### Build Fails with TypeScript Errors

**Error:**
```
Type error: Property 'x' does not exist on type 'Y'
```

**Fix:**
1. Read error message carefully
2. Check interface definitions
3. Fix type mismatches
4. Re-run `npm run build`

---

### Module Not Found

**Error:**
```
Module not found: Can't resolve '@/app/components/MyComponent'
```

**Fix:**
1. Verify file exists at path
2. Check import path uses `@/` alias
3. Ensure file exports component
4. Restart dev server: `npm run dev`

---

### Changes Not Appearing

**Issue:** Made changes but UI not updating

**Fix:**
1. Check browser console for errors
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear browser cache
4. Restart dev server
5. Check if HMR is working (should see updates instantly)

---

### LocalStorage Quota Exceeded

**Error:**
```
QuotaExceededError: The quota has been exceeded
```

**Fix:**
```bash
# Clear baselines in browser console
localStorage.removeItem('cpq-trace-analyzer-baselines')
```

Or implement pagination/limits on baseline storage.

---

## Testing Strategy (Future)

### Unit Tests

```bash
npm run test
```

Test individual functions:
- Parser functions in `lib/trace-parser.ts`
- Utility functions in `lib/baseline-storage.ts`
- Expression parser in `lib/expression-parser.ts`

### Component Tests

Test React components:
- Snapshot tests for UI consistency
- Props validation
- Event handler behavior
- Context integration

### Integration Tests

Test complete workflows:
- Upload trace → Parse → Display
- Add to baselines → Load → Compare
- Regression testing flow

### E2E Tests

Test full user journeys:
- Upload and analyze trace
- Compare two traces
- Baseline management workflow

**Tools:**
- Jest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

---

## Performance Monitoring

### Current

Monitor in browser DevTools:
- Performance tab for profiling
- Network tab for loading times
- Memory tab for leaks

### Target (Vercel Analytics)

Automatic performance monitoring:
- Real User Monitoring (RUM)
- Core Web Vitals
- Page load times
- Error tracking

Access at: https://vercel.com/your-project/analytics

---

## Deployment (Target)

### Vercel Deployment

#### 1. Connect Repository

1. Go to https://vercel.com
2. Click "New Project"
3. Import Git repository
4. Select repository

#### 2. Configure Project

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 3. Environment Variables

Add in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### 4. Deploy

Click "Deploy"

**Results:**
- Automatic deployments on every push to main
- Preview deployments for PRs
- Production URL: `your-project.vercel.app`

---

## Resources

### Documentation
- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Tamagui Docs (target): https://tamagui.dev
- Supabase Docs (target): https://supabase.com/docs

### Community
- Next.js Discord: https://nextjs.org/discord
- React Discord: https://react.dev/community
- Stack Overflow: Tag `next.js`, `react`, `typescript`

### Tools
- React DevTools: Browser extension for debugging
- VS Code: Recommended editor
- GitHub Copilot: AI pair programmer (optional)
