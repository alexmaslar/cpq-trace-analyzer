# Architecture

## System Overview

The CPQ Trace Analyzer is architected as a modern web application with a clear separation between frontend UI, business logic, and (target) backend services. The system follows a layered component architecture where complex UI is built from composition of smaller, focused components.

```
┌──────────────────────────────────────────────────────────────┐
│                         User Browser                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Next.js App                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │           React Component Tree                   │  │  │
│  │  │  - Tab Components (5)                            │  │  │
│  │  │  - Section Components (8)                        │  │  │
│  │  │  - Shared Components (7)                         │  │  │
│  │  │  - Layout Components (2)                         │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │         Context API (Global State)               │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │           Business Logic (lib/)                  │  │  │
│  │  │  - trace-parser.ts (2,213 lines)                │  │  │
│  │  │  - baseline-storage.ts (369 lines)              │  │  │
│  │  │  - expression-parser.ts (575 lines)             │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │             localStorage (Current)                     │  │
│  │  - Baseline traces (JSON serialized)                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                          ↓ (Target Architecture)
┌──────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Next.js App (Server + Client)                  │  │
│  │  - SSR/SSG for optimal performance                     │  │
│  │  - API Routes for backend communication                │  │
│  │  - Edge Functions for auth & data fetching             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                        Supabase                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                       │  │
│  │  - users (Supabase Auth)                               │  │
│  │  - traces (user_id, filename, content, parsed_data)    │  │
│  │  - baselines (user_id, name, trace_id, selection_path) │  │
│  │  - RLS policies for data isolation                     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Supabase Auth                             │  │
│  │  - Email/password authentication                       │  │
│  │  - Session management                                  │  │
│  │  - Row Level Security integration                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Infrastructure & Deployment

### Deployment Platform: Vercel

**Why Vercel:**
- Best-in-class Next.js hosting with zero configuration
- Automatic deployments from Git commits
- Edge network for global performance
- Built-in analytics and monitoring
- Preview deployments for PRs

**Vercel Features Used:**
- Static page generation for optimal performance
- Edge Functions for auth middleware
- Automatic HTTPS and CDN
- Environment variable management

### Frontend Framework: Next.js 16

**Configuration:**
- App Router for modern routing
- React Server Components where applicable
- Client Components for interactive UI
- TypeScript strict mode
- Turbopack for fast builds

### UI Component System

**Current: Tailwind CSS 4**
- Utility-first CSS framework
- Custom theme configuration
- Animation classes in globals.css
- Responsive design utilities

**Target: Tamagui**
- Cross-platform design system (Web + Native)
- Optimized for performance
- Theme system with variants
- Responsive breakpoints: `$sm`, `$md`, `$lg`, `$xl`
- Components: `<Button>`, `<Card>`, `<Stack>`, `<YStack>`, `<XStack>`, `<Text>`, `<Input>`

### Backend: Supabase

**Why Supabase:**
- PostgreSQL database with excellent developer experience
- Built-in authentication system
- Row Level Security (RLS) for data isolation
- Real-time subscriptions (future feature)
- Storage for large trace files
- Auto-generated REST API

**Supabase Services Used:**
- **Database**: PostgreSQL for traces and baselines
- **Auth**: User authentication and session management
- **Storage**: File uploads for large trace files (future)
- **RLS**: Secure user data isolation at database level

### Analytics: Vercel Analytics

- Page view tracking
- User engagement metrics
- Performance monitoring
- No external dependencies

### Storage Strategy

**Current State (Client-Side Only):**
```
User Action
  ↓
trace-parser.ts (parse trace)
  ↓
localStorage (store baseline)
  ↓
Context API (global state)
  ↓
UI Components
```

**Target State (Supabase Backend):**
```
User Action
  ↓
Next.js API Route (auth check)
  ↓
Supabase (store trace + baseline)
  ↓
trace-parser.ts (parse on server or client)
  ↓
Context API (global state)
  ↓
UI Components
```

---

## Component Hierarchy

The application follows a strict layered architecture with clear component composition:

### Layer 1: Page Orchestration
**File**: `app/page.tsx` (292 lines)

**Responsibilities:**
- State management (14 state variables)
- Event handlers (7 callbacks)
- Context provider
- Layout structure

**Key State:**
```typescript
- viewMode: 'single' | 'compare'
- activeTab: 'info' | 'debug' | 'integration' | 'compare' | 'regression'
- baselineTrace: ParsedTrace | null
- currentTrace: ParsedTrace | null
- diff: TraceDiff | null
- baselineLibrary: BaselineTrace[]
- regressionResult: RegressionResult | null
```

### Layer 2: Tab Components (5)
Tab wrappers that compose section components:

| Tab | Sections Composed | Lines |
|-----|-------------------|-------|
| InfoTab | MetadataSection, FeaturesSection, IssuesSection | ~30 |
| DebugTab | VariableTrackingSection, ConditionTracingSection, TimelineSection | ~35 |
| IntegrationTab | IntegrationOutputSection, RuleExecutionSection | ~25 |
| CompareTab | CompareView (with diff sections) | ~40 |
| RegressionTab | RegressionResultsView, BaselineLibraryPanel | ~50 |

### Layer 3: Section Components (8)
Reusable content sections with specific responsibilities:

| Section | Purpose | Lines | Key Features |
|---------|---------|-------|--------------|
| MetadataSection | Display config metadata | ~80 | Grid layout, metadata items |
| FeaturesSection | Feature options table | ~150 | Search, auto-expand, pagination |
| IssuesSection | Parse errors/warnings | ~120 | Severity filtering, expandable cards |
| VariableTrackingSection | Variable assignments | ~312 | Pagination, search, history tracking |
| ConditionTracingSection | Condition evaluations | ~347 | Expression trees, filtering |
| TimelineSection | Rule execution flow | ~370 | Hierarchy tree, ruleset nesting |
| IntegrationOutputSection | Integration outputs | ~180 | Template expansion, row display |
| RuleExecutionSection | Rule statistics | ~150 | Summary cards, top rules table |

### Layer 4: Shared Components (7)
Reusable UI primitives:

| Component | Purpose | Lines |
|-----------|---------|-------|
| TraceUploader | File upload + paste | ~120 |
| RawTraceViewer | Modal trace viewer | ~180 |
| LineNumber | Clickable line number | ~25 |
| ExpressionTree | AST visualization | ~150 |
| MetadataItem | Key-value display | ~20 |
| RuleSummaryCard | Rule stat card | ~60 |
| SummaryBadge | Colored badge | ~30 |

### Layer 5: Layout Components (2)
| Component | Purpose | Lines |
|-----------|---------|-------|
| Header | Search, mode toggle | ~100 |
| TabNavigation | Tab bar with badges | ~65 |

### Layer 6: Tamagui UI Primitives (Target)
```typescript
<Button>
<Card>
<Stack> / <YStack> / <XStack>
<Text>
<Input>
<ScrollView>
<Sheet>
```

---

## State Management

### Context API Architecture

**TraceViewerContext** provides global state to all components:

```typescript
interface TraceViewerContextType {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Trace data
  baselineTrace: ParsedTrace | null;
  currentTrace: ParsedTrace | null;
  diff: TraceDiff | null;

  // UI state
  error: string | null;
  isLoading: boolean;
  rawTraceContent: string;
  viewerLine: number | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Baseline library
  baselineLibrary: BaselineTrace[];
  regressionResult: RegressionResult | null;
  selectedBaselineId: string | null;
  traceFilename: string;

  // Actions
  handleTraceInput: (content: string, slot: 'baseline' | 'current') => void;
  handleFileUpload: (file: File, slot: 'baseline' | 'current') => void;
  handleAddToBaselines: (name: string) => BaselineTrace | undefined;
  handleRemoveBaseline: (id: string) => void;
  handleSelectBaseline: (baseline: BaselineTrace) => void;
  showLine: (lineNumber: number) => void;
  clearAll: () => void;
}
```

**Context Consumption:**
```typescript
// In any component
import { useTraceViewerContext } from '@/app/context/TraceViewerContext';

export function MyComponent() {
  const { baselineTrace, searchTerm, showLine } = useTraceViewerContext();
  // Use context values...
}
```

**Why Context API over Redux:**
- Simpler for single-page application
- No additional dependencies
- Built into React
- Sufficient for current state complexity
- Easy to migrate to Zustand if needed

---

## Data Flow

### Current Implementation (Client-Side)

```
┌─────────────────┐
│  User Action    │
│  (Upload/Paste) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ handleFileUpload│
│  (page.tsx)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  trace-parser   │
│  .parseTrace()  │
│  (2,213 lines)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ParsedTrace    │
│  (typed object) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ setBaselineTrace│
│  (Context API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tab Components │
│  Re-render      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Section Components│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  UI Display     │
└─────────────────┘
```

### Regression Testing Flow

```
┌──────────────────┐
│Load Known-Good   │
│Trace             │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Add to Baselines │
│ (localStorage)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Extract Selection │
│Path              │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Store in          │
│baselineLibrary[] │
└────────┬─────────┘
         │
        ... (Later)
         │
         ▼
┌──────────────────┐
│ Load New Trace   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│findBestMatch()   │
│- Compare features│
│- Calculate score │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│compareBehavior() │
│- Variable diffs  │
│- Condition diffs │
│- Integration diff│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│RegressionResult  │
│Display in Tab    │
└──────────────────┘
```

### Target Implementation (Supabase Backend)

```
┌─────────────────┐
│  User Action    │
│  (Upload)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Next.js API Route│
│/api/traces      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Check      │
│(Supabase)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ INSERT traces   │
│ (PostgreSQL)    │
│ user_id, content│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Parse on Server  │
│or Client        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UPDATE traces   │
│ parsed_data JSON│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fetch & Display│
└─────────────────┘
```

---

## Database Schema (Supabase Target)

### Tables

#### users (Supabase Auth Managed)
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### traces
```sql
CREATE TABLE public.traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,  -- Raw trace file content
  parsed_data JSONB,       -- ParsedTrace object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traces_user_id ON public.traces(user_id);
CREATE INDEX idx_traces_created_at ON public.traces(created_at DESC);

-- Row Level Security
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own traces"
  ON public.traces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own traces"
  ON public.traces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traces"
  ON public.traces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own traces"
  ON public.traces FOR DELETE
  USING (auth.uid() = user_id);
```

#### baselines
```sql
CREATE TABLE public.baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  trace_id UUID REFERENCES public.traces(id) ON DELETE CASCADE,
  selection_path JSONB NOT NULL,  -- Array of {featureName, selectedValue, optionCount}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_baselines_user_id ON public.baselines(user_id);
CREATE INDEX idx_baselines_trace_id ON public.baselines(trace_id);

-- Row Level Security
ALTER TABLE public.baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baselines"
  ON public.baselines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baselines"
  ON public.baselines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own baselines"
  ON public.baselines FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Environment Variables

### .env.local (Development)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel Analytics (auto-configured in production)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Vercel Environment Variables (Production)
Configure in Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` (Production)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production)
- `SUPABASE_SERVICE_ROLE_KEY` (Secret)

---

## Key Design Decisions

### 1. Why Vercel?
**Decision**: Deploy on Vercel instead of self-hosted or AWS

**Rationale**:
- Best Next.js hosting with zero configuration
- Automatic optimizations and CDN
- Preview deployments for every PR
- Built-in analytics
- Edge network for global performance

**Trade-offs**:
- Vendor lock-in (mitigated by standard Next.js app)
- Cost scales with usage (acceptable for this use case)

### 2. Why Tamagui?
**Decision**: Migrate from Tailwind CSS to Tamagui

**Rationale**:
- Cross-platform design system (future mobile app potential)
- Better performance with optimized components
- Theme system with built-in variants
- Excellent developer experience
- Growing ecosystem

**Trade-offs**:
- Migration effort from Tailwind
- Smaller community than Tailwind
- Learning curve for team

### 3. Why Supabase?
**Decision**: Use Supabase instead of building custom backend

**Rationale**:
- PostgreSQL with excellent developer experience
- Built-in authentication system
- Row Level Security for data isolation
- Real-time subscriptions (future features)
- Generated REST API and TypeScript types

**Trade-offs**:
- Vendor lock-in (mitigated by PostgreSQL standard)
- Limited customization of auth flow
- Cost scales with database size

### 4. Why Context API?
**Decision**: Use Context API instead of Redux/Zustand

**Rationale**:
- Built into React (no dependencies)
- Simple for current state complexity
- Easy to understand and maintain
- Sufficient for single-page app

**Trade-offs**:
- Not ideal for very complex state
- Can cause unnecessary re-renders if not careful
- Migration path exists to Zustand if needed

### 5. Why Component Composition?
**Decision**: Build tabs from sections, sections from shared components

**Rationale**:
- Reusability across tabs
- Easier to test individual sections
- Clear separation of concerns
- Smaller, focused component files
- No god components

**Trade-offs**:
- More files to navigate
- Need to understand component hierarchy

### 6. Why localStorage (Current)?
**Decision**: Start with localStorage before backend

**Rationale**:
- Simplest possible implementation
- No backend complexity initially
- Validate UX before investing in backend
- Easy to migrate to Supabase later

**Trade-offs**:
- Data not shared across devices
- No user accounts
- Limited storage (5-10MB)
- Data persists only in one browser

### 7. Why Local Storage → Supabase Migration?
**Decision**: Migrate from localStorage to Supabase

**Rationale**:
- Enable user accounts and authentication
- Share baselines across devices
- Persistent, reliable storage
- Enable team collaboration (future)

**Migration Path**:
- Keep localStorage as fallback
- Provide "Import from localStorage" button
- Sync on login
- Clear localStorage after migration

---

## Performance Considerations

### Current Optimizations
- Pagination for large datasets (variables, conditions)
- Windowed rendering for raw trace viewer (200 lines at a time)
- useMemo for expensive computations (search matches, baseline ranking)
- useCallback for event handlers to prevent re-renders
- React.lazy for code splitting (future)

### Target Optimizations
- Server-side trace parsing for large files
- Edge caching for frequently accessed traces
- Incremental Static Regeneration for baseline library
- Image optimization for trace visualizations (future)

---

## Security Considerations

### Current (Client-Side)
- No authentication required
- No data leaves user's browser
- XSS protection via React escaping

### Target (Supabase)
- Row Level Security (RLS) for data isolation
- Supabase Auth for secure authentication
- API routes protected with auth middleware
- HTTPS enforced by Vercel
- Environment variables for secrets
- CORS configuration for API routes
- SQL injection prevention (Supabase client)

---

## Scalability

### Current Limitations
- Client-side parsing limits trace file size
- localStorage size limits (~10MB)
- No collaboration features

### Target Scalability
- Server-side parsing for unlimited file size
- PostgreSQL scales to large datasets
- Supabase connection pooling
- Vercel Edge Network for global performance
- Real-time subscriptions for collaboration (future)

---

## Future Architecture Considerations

### Potential Enhancements
1. **Real-time Collaboration**: Multiple users analyzing same trace
2. **Mobile App**: React Native with shared Tamagui components
3. **AI-Powered Analysis**: Automatic issue detection using LLMs
4. **Trace Visualization**: D3.js charts for rule execution flow
5. **Team Workspaces**: Shared baseline libraries
6. **Webhooks**: Integration with CI/CD pipelines
7. **Batch Processing**: Analyze multiple traces automatically
