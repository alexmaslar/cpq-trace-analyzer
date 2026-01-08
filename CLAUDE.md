# CPQ Trace Analyzer

## Project Overview

The CPQ Trace Analyzer is a web-based tool for analyzing and debugging Infor CPQ interactive trace files. It parses complex CPQ configuration traces, extracts metadata, features, rule executions, variable assignments, and condition evaluations, presenting them in an intuitive tab-based interface. The tool enables developers and configuration engineers to quickly identify issues, understand rule execution flows, and detect behavioral regressions by comparing traces against known-good baselines.

Built with Next.js 16, React 19, and TypeScript, the application emphasizes clean component architecture with 30+ focused components organized by function. The current implementation is client-side only with browser localStorage for baseline storage. The target architecture migrates to a full-stack solution deployed on Vercel with Tamagui for cross-platform UI components, Supabase for backend storage and authentication, and Vercel Analytics for usage insights.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: Tamagui (target), Tailwind CSS 4 (current)
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics
- **Icons**: Lucide React

## Project Structure

```
cpq-trace-analyzer/
├── app/
│   ├── components/
│   │   ├── tabs/              # 5 main feature tabs
│   │   │   ├── InfoTab.tsx
│   │   │   ├── DebugTab.tsx
│   │   │   ├── IntegrationTab.tsx
│   │   │   ├── CompareTab.tsx
│   │   │   └── RegressionTab.tsx
│   │   ├── sections/          # 8 content sections
│   │   │   ├── MetadataSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── IssuesSection.tsx
│   │   │   ├── VariableTrackingSection.tsx
│   │   │   ├── ConditionTracingSection.tsx
│   │   │   ├── TimelineSection.tsx
│   │   │   ├── IntegrationOutputSection.tsx
│   │   │   └── RuleExecutionSection.tsx
│   │   ├── shared/            # 7 reusable UI components
│   │   │   ├── TraceUploader.tsx
│   │   │   ├── RawTraceViewer.tsx
│   │   │   ├── LineNumber.tsx
│   │   │   ├── ExpressionTree.tsx
│   │   │   ├── MetadataItem.tsx
│   │   │   ├── RuleSummaryCard.tsx
│   │   │   └── SummaryBadge.tsx
│   │   ├── regression/        # 4 regression testing components
│   │   │   ├── RegressionResultsView.tsx
│   │   │   ├── BaselineLibraryPanel.tsx
│   │   │   ├── BehavioralIssueCard.tsx
│   │   │   └── AddToBaselineButton.tsx
│   │   ├── compare/           # 3 comparison components
│   │   │   ├── CompareView.tsx
│   │   │   ├── ConditionDiffSection.tsx
│   │   │   ├── VariableDiffSection.tsx
│   │   │   └── IntegrationOutputDiffSection.tsx
│   │   └── layout/            # 2 layout components
│   │       ├── Header.tsx
│   │       └── TabNavigation.tsx
│   ├── context/
│   │   └── TraceViewerContext.tsx    # Global state management
│   ├── hooks/
│   │   ├── useTraceViewer.ts
│   │   └── useSearchMatches.ts
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   ├── page.tsx                      # Main orchestration (292 lines)
│   └── globals.css                   # Global styles + animations
├── lib/
│   ├── trace-parser.ts               # 2,213 lines - Main parsing engine
│   ├── baseline-storage.ts           # 369 lines - Baseline management
│   └── expression-parser.ts          # 575 lines - CPQ expression AST parser
└── docs/
    ├── architecture.md               # System architecture & infrastructure
    ├── style-guide.md                # Coding conventions & patterns
    ├── components.md                 # Component catalog (30 components)
    ├── development.md                # Setup & development workflow
    ├── trace-format.md               # CPQ trace file specification
    └── regression-testing.md         # Baseline regression system
```

## Key Components

### Tab Components (5)
Tab wrappers that compose section components into feature-focused views:
- **InfoTab** - Configuration metadata, features, and issues
- **DebugTab** - Variables, conditions, and execution timeline
- **IntegrationTab** - Integration outputs and rule execution statistics
- **CompareTab** - Side-by-side trace comparison with diff highlighting
- **RegressionTab** - Baseline library and behavioral regression analysis

### Section Components (8)
Reusable content sections displayed within tabs:
- **MetadataSection** - Configuration metadata grid
- **FeaturesSection** - Feature selections table with search
- **IssuesSection** - Parse errors and warnings
- **VariableTrackingSection** - Variable assignment history with pagination
- **ConditionTracingSection** - Condition evaluations with expression trees
- **TimelineSection** - Rule execution flow with hierarchy
- **IntegrationOutputSection** - Integration output templates and rows
- **RuleExecutionSection** - Rule execution summary and statistics

### Core Libraries (lib/)
Business logic separated from UI components:
- **trace-parser.ts** - Parses CPQ trace files into structured data
- **baseline-storage.ts** - Manages baseline library in localStorage (target: Supabase)
- **expression-parser.ts** - Parses CPQ expressions into Abstract Syntax Trees

## Architecture Principles

1. **Keep Components Small** - Maximum ~350 lines per component file. If larger, split into focused sub-components.
2. **No God Files** - Avoid monolithic components that do everything. Extract logic into hooks and lib/ functions.
3. **Composition Over Inheritance** - Tab components compose sections, sections compose shared components.
4. **State Management** - Use Context API for global state, avoid prop drilling through multiple levels.
5. **Type Safety** - Strict TypeScript with comprehensive interfaces for all data structures.
6. **One Component Per File** - Clear file organization with co-located interfaces.
7. **Separation of Concerns** - UI components (app/components/), business logic (lib/), types (app/types/).

## Key Patterns

### Tab-Based UI
- 5 tabs with distinct purposes (Info, Debug, Integration, Compare, Regression)
- Keyboard shortcuts: Alt+1 through Alt+5 for quick navigation
- Global search with per-tab match count badges
- Smooth CSS animations for tab transitions

### View Modes
- **Single Mode** - Analyze one trace with tabs (Info, Debug, Integration, Regression)
- **Compare Mode** - Side-by-side comparison of two traces with diff highlighting
- Mode switcher in header auto-switches active tab

### Regression Testing
- Baseline library stores known-good traces
- Auto-matching algorithm compares current trace against baselines
- Selection path matching (feature choices)
- Behavioral comparison (variable values, conditions, integrations)
- Divergence detection and issue reporting

### State Management Flow
```
User Action
  ↓
Handler (page.tsx)
  ↓
Context Update (TraceViewerContext)
  ↓
Component Re-render (via useContext)
```

## Development Workflow

```bash
# Setup
npm install                    # Install dependencies
npm run dev                    # Start dev server (localhost:3000)

# Development
npm run build                  # Production build with TypeScript check
npm run lint                   # Run ESLint

# Common Tasks
- Add component: Create in app/components/{category}/
- Add type: Define in app/types/index.ts or co-locate with component
- Modify parser: Edit lib/trace-parser.ts
- Add tab: Create in app/components/tabs/, add to page.tsx
```

## Current vs Target Architecture

### Current (Client-Side Only)
- Pure client-side React application
- Tailwind CSS for styling
- localStorage for baseline storage
- No user authentication
- No persistent trace storage

### Target (Full-Stack)
- Vercel deployment with Edge Functions
- Tamagui UI components (cross-platform design system)
- Supabase backend:
  - PostgreSQL database for traces and baselines
  - Supabase Auth for user authentication
  - Row Level Security (RLS) for data isolation
- Vercel Analytics for usage tracking
- User accounts with personal baseline libraries

## Documentation

For detailed information, see:

- **Architecture & Data Flow**: @docs/architecture.md
- **Coding Conventions**: @docs/style-guide.md
- **Component Catalog**: @docs/components.md
- **Development Setup**: @docs/development.md
- **CPQ Trace Format**: @docs/trace-format.md
- **Regression Testing**: @docs/regression-testing.md

## Quick Reference

### Component Locations
- **Tabs**: `app/components/tabs/`
- **Sections**: `app/components/sections/`
- **Shared UI**: `app/components/shared/`
- **Layout**: `app/components/layout/`
- **Business Logic**: `lib/`

### Key Files
- `app/page.tsx` - Main orchestration, state management
- `app/context/TraceViewerContext.tsx` - Global context provider
- `lib/trace-parser.ts` - CPQ trace parsing engine
- `lib/baseline-storage.ts` - Baseline management (localStorage → Supabase migration)

### Common Commands
- `npm run dev` - Start development
- `npm run build` - Verify TypeScript and build
- `npm run lint` - Check code quality
