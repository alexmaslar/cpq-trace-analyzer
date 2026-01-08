# Component Catalog

This document provides a comprehensive catalog of all 30 components in the CPQ Trace Analyzer application, organized by category.

---

## Table of Contents

- [Tab Components (5)](#tab-components)
- [Section Components (8)](#section-components)
- [Shared Components (7)](#shared-components)
- [Regression Components (4)](#regression-components)
- [Compare Components (4)](#compare-components)
- [Layout Components (2)](#layout-components)
- [Context & Hooks (4)](#context--hooks)

---

## Tab Components

Tab components compose section components into feature-focused views. They act as containers that orchestrate the display of multiple sections.

### InfoTab

**Path:** `app/components/tabs/InfoTab.tsx`

**Purpose:** Displays configuration metadata, features & options, and parse issues in a single view.

**Props:**
```typescript
interface InfoTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}
```

**Composed Sections:**
- MetadataSection
- FeaturesSection
- IssuesSection

**Usage:**
```tsx
<InfoTab trace={baselineTrace} searchTerm={searchTerm} />
```

**Key Features:**
- Converts features Map to array for FeaturesSection
- Conditionally renders sections based on data availability
- Passes searchTerm to filterable sections

---

### DebugTab

**Path:** `app/components/tabs/DebugTab.tsx`

**Purpose:** Provides debugging tools including variable tracking, condition tracing, and execution timeline.

**Props:**
```typescript
interface DebugTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}
```

**Composed Sections:**
- VariableTrackingSection
- ConditionTracingSection
- TimelineSection

**Usage:**
```tsx
<DebugTab trace={baselineTrace} searchTerm={searchTerm} />
```

**Key Features:**
- Comprehensive debugging information
- Each section independently filterable and paginated
- Timeline provides visual execution flow

---

### IntegrationTab

**Path:** `app/components/tabs/IntegrationTab.tsx`

**Purpose:** Displays integration outputs and rule execution statistics.

**Props:**
```typescript
interface IntegrationTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}
```

**Composed Sections:**
- IntegrationOutputSection
- RuleExecutionSection

**Usage:**
```tsx
<IntegrationTab trace={baselineTrace} searchTerm={searchTerm} />
```

**Key Features:**
- Integration output templates with rows
- Rule execution summary and statistics
- Top rules breakdown by execution count

---

### CompareTab

**Path:** `app/components/tabs/CompareTab.tsx`

**Purpose:** Side-by-side comparison of two traces with diff highlighting.

**Props:**
```typescript
interface CompareTabProps {
  baseline: ParsedTrace;
  current: ParsedTrace;
  diff: TraceDiff;
}
```

**Composed Components:**
- CompareView (contains ConditionDiffSection, VariableDiffSection, IntegrationOutputDiffSection)

**Usage:**
```tsx
<CompareTab
  baseline={baselineTrace}
  current={currentTrace}
  diff={diff}
/>
```

**Key Features:**
- Shows feature selection changes
- Highlights added, removed, and modified values
- Diff sections for variables, conditions, and integrations

---

### RegressionTab

**Path:** `app/components/tabs/RegressionTab.tsx`

**Purpose:** Displays regression test results and baseline library management.

**Props:**
```typescript
interface RegressionTabProps {
  regressionResult: RegressionResult | null;
  baselineLibrary: BaselineTrace[];
  currentTrace: ParsedTrace | null;
  selectedBaselineId: string | null;
  onRemoveBaseline: (id: string) => void;
  onSelectBaseline: (baseline: BaselineTrace) => void;
}
```

**Composed Components:**
- RegressionResultsView
- BaselineLibraryPanel

**Usage:**
```tsx
<RegressionTab
  regressionResult={regressionResult}
  baselineLibrary={baselineLibrary}
  currentTrace={baselineTrace}
  selectedBaselineId={selectedBaselineId}
  onRemoveBaseline={handleRemoveBaseline}
  onSelectBaseline={handleSelectBaseline}
/>
```

**Key Features:**
- Automatic baseline matching
- Behavioral regression detection
- Inline baseline library management
- Selection path comparison

---

## Section Components

Section components are reusable content displays used within tabs. They focus on specific data types and provide filtering, pagination, and interactive features.

### MetadataSection

**Path:** `app/components/sections/MetadataSection.tsx`

**Purpose:** Displays configuration metadata in a structured grid format.

**Props:**
```typescript
interface MetadataSectionProps {
  trace: ParsedTrace;
  featuresCount: number;
}
```

**Usage:**
```tsx
<MetadataSection trace={trace} featuresCount={trace.features.size} />
```

**Key Features:**
- Grid layout for metadata items
- Displays instance, application, config name, mode, timestamp
- Feature count summary
- MetadataItem component for consistent display

**Data Displayed:**
- Instance name
- Application name
- Configuration name
- Configuration mode
- Timestamp
- Features count

---

### FeaturesSection

**Path:** `app/components/sections/FeaturesSection.tsx`

**Purpose:** Displays feature options and selections in an expandable table format with search filtering.

**Props:**
```typescript
interface FeaturesSectionProps {
  features: FeatureData[];
  searchTerm?: string;
}
```

**Usage:**
```tsx
<FeaturesSection features={featuresArray} searchTerm={searchTerm} />
```

**Key Features:**
- Search filtering by feature name, caption, options, or selected value
- Auto-expands when search has matches
- Shows all available options (up to 8 visible, then "+N more")
- Color-coded selected values (green badge)
- Displays option count per feature
- Expandable/collapsible interface

**Table Columns:**
- Feature (name in monospace)
- Caption
- Options Available (badges)
- Count
- Selected (highlighted value)

---

### IssuesSection

**Path:** `app/components/sections/IssuesSection.tsx`

**Purpose:** Displays parse errors and warnings with severity filtering.

**Props:**
```typescript
interface IssuesSectionProps {
  issues: IssuesSummary;
}
```

**Usage:**
```tsx
<IssuesSection issues={trace.issues} />
```

**Key Features:**
- Severity filtering (error, warning, info)
- Expandable issue cards
- Color-coded by severity (red, yellow, blue)
- Shows issue title, description, and line number
- Click line number to view raw trace at that location

**Sub-Components:**
- IssueCard - Individual issue display with expand/collapse

---

### VariableTrackingSection

**Path:** `app/components/sections/VariableTrackingSection.tsx`

**Purpose:** Displays variable assignment history with pagination and filtering.

**Props:**
```typescript
interface VariableTrackingSectionProps {
  variableTracking: VariableTrackingSummary;
  searchTerm?: string;
}
```

**Usage:**
```tsx
<VariableTrackingSection
  variableTracking={trace.variableTracking}
  searchTerm={searchTerm}
/>
```

**Key Features:**
- Pagination (50 variables per page)
- Local search within variables
- Filter by changed variables only
- Shows assignment count per variable
- Expandable rows showing full assignment history
- Expression display for each assignment
- Previous value → Result value tracking

**Data Displayed:**
- Variable name
- Final value
- Assignment count
- Assignment history (expandable)
  - Line number (clickable)
  - Assignment expression
  - Previous value
  - Result value

---

### ConditionTracingSection

**Path:** `app/components/sections/ConditionTracingSection.tsx`

**Purpose:** Displays condition evaluations with expression tree visualization and filtering.

**Props:**
```typescript
interface ConditionTracingSectionProps {
  conditionTracking: ConditionSummary;
  searchTerm?: string;
}
```

**Usage:**
```tsx
<ConditionTracingSection
  conditionTracking={trace.conditionTracking}
  searchTerm={searchTerm}
/>
```

**Key Features:**
- Pagination (50 conditions per page)
- Local search within conditions
- Filter by fired/skipped status
- Expression tree visualization (ExpressionTree component)
- Shows rule name, expression, result, and line number
- Color-coded by result (green for true, gray for false)
- Expression breakdown showing evaluation details

**Data Displayed:**
- Rule name
- Condition expression
- Result (true/false)
- Line number (clickable)
- Expression tree (expandable)

---

### TimelineSection

**Path:** `app/components/sections/TimelineSection.tsx`

**Purpose:** Visualizes rule execution flow in a hierarchical timeline with ruleset nesting.

**Props:**
```typescript
interface TimelineSection Props {
  trace: ParsedTrace;
}
```

**Usage:**
```tsx
<TimelineSection trace={trace} />
```

**Key Features:**
- Hierarchical ruleset tree structure
- Shows parent-child relationships ("Loaded by" connections)
- Rule execution count per ruleset
- Expandable/collapsible nodes
- Indentation shows nesting depth
- Line numbers clickable for raw trace viewing

**Data Displayed:**
- Ruleset hierarchy
- Rule execution details per ruleset
- Load relationships (which ruleset loaded which)
- Execution counts

**Complex Logic:**
- `buildRulesetTree()` function constructs hierarchy from flat rule list
- Handles multiple levels of nesting
- Shows "Loaded by" relationships

---

### IntegrationOutputSection

**Path:** `app/components/sections/IntegrationOutputSection.tsx`

**Purpose:** Displays integration output templates with their rows and columns.

**Props:**
```typescript
interface IntegrationOutputSectionProps {
  integrationOutputs: IntegrationOutputSummary;
}
```

**Usage:**
```tsx
<IntegrationOutputSection integrationOutputs={trace.integrationOutputs} />
```

**Key Features:**
- Template-based organization
- Expandable templates
- Row count per template
- Property/column display for each row
- Shows template name prominently

**Data Displayed:**
- Template name
- Row count
- Property/value pairs for each row

---

### RuleExecutionSection

**Path:** `app/components/sections/RuleExecutionSection.tsx`

**Purpose:** Displays rule execution summary, statistics, and top rules breakdown.

**Props:**
```typescript
interface RuleExecutionSectionProps {
  rulesSummary: RuleExecutionSummary;
}
```

**Usage:**
```tsx
<RuleExecutionSection rulesSummary={trace.rulesSummary} />
```

**Key Features:**
- Summary statistics cards
- Top 10 most-executed rules table
- Rule type breakdown (configuration, condition, action, etc.)
- Ruleset statistics

**Data Displayed:**
- Total rule executions
- Unique rules count
- Rulesets loaded count
- Top rules by execution count
- Rule type distribution

**Sub-Components:**
- RuleSummaryCard - Individual statistic card

---

## Shared Components

Shared components are reusable UI primitives used throughout the application. They provide consistent styling and behavior.

### TraceUploader

**Path:** `app/components/shared/TraceUploader.tsx`

**Purpose:** File uploader with drag-and-drop, file picker, and paste support.

**Props:**
```typescript
interface TraceUploaderProps {
  label: string;
  onFileUpload: (file: File) => void;
  onPaste: (content: string) => void;
  hasData: boolean;
  isLoading: boolean;
}
```

**Usage:**
```tsx
<TraceUploader
  label="Trace File"
  onFileUpload={handleFileUpload}
  onPaste={handleTraceInput}
  hasData={!!baselineTrace}
  isLoading={isLoading}
/>
```

**Key Features:**
- Drag-and-drop file upload
- File picker button
- Paste mode toggle with textarea
- Loading state display
- "Loaded" badge when data present
- Accepts .log, .txt, .trace files

---

### RawTraceViewer

**Path:** `app/components/shared/RawTraceViewer.tsx`

**Purpose:** Modal that displays full raw trace content with scroll-to-line functionality.

**Props:**
```typescript
interface RawTraceViewerProps {
  content: string;
  lineNumber: number;
  onClose: () => void;
}
```

**Usage:**
```tsx
<RawTraceViewer
  content={rawTraceContent}
  lineNumber={viewerLine}
  onClose={() => setViewerLine(null)}
/>
```

**Key Features:**
- Windowed rendering (200 lines at a time for performance)
- Auto-scroll to target line number
- Highlighted target line
- Line number display
- Modal overlay with close button
- Monospace font for readability

---

### LineNumber

**Path:** `app/components/shared/LineNumber.tsx`

**Purpose:** Clickable line number component that opens raw trace viewer at specific line.

**Props:**
```typescript
interface LineNumberProps {
  lineNumber: number;
}
```

**Usage:**
```tsx
<LineNumber lineNumber={condition.lineNumber} />
```

**Key Features:**
- Clickable badge-style display
- Opens RawTraceViewer at specific line
- Monospace font
- Blue styling to indicate interactivity
- Uses `showLine` from TraceViewerContext

---

### ExpressionTree

**Path:** `app/components/shared/ExpressionTree.tsx`

**Purpose:** Visualizes parsed CPQ expressions as a tree structure with color-coded nodes.

**Props:**
```typescript
interface ExpressionTreeProps {
  node: ExpressionNode;
}
```

**Usage:**
```tsx
<ExpressionTree node={parsedExpression} />
```

**Key Features:**
- Recursive tree rendering
- Color-coded by node type:
  - Operators: orange
  - Functions: purple
  - Variables: blue
  - Literals: green
  - Arrays: cyan
- Indentation shows nesting
- Handles complex nested expressions

**Node Types:**
- Operator (AND, OR, +, -, *, /, etc.)
- Function (calls)
- Variable (references)
- Literal (strings, numbers, booleans)
- Array (collections)

---

### MetadataItem

**Path:** `app/components/shared/MetadataItem.tsx`

**Purpose:** Simple key-value metadata display component.

**Props:**
```typescript
interface MetadataItemProps {
  label: string;
  value: string | number;
}
```

**Usage:**
```tsx
<MetadataItem label="Instance" value={trace.metadata.instanceName} />
```

**Key Features:**
- Consistent label/value styling
- Gray label, white value
- Used in MetadataSection

---

### RuleSummaryCard

**Path:** `app/components/shared/RuleSummaryCard.tsx`

**Purpose:** Card displaying a single rule execution statistic.

**Props:**
```typescript
interface RuleSummaryCardProps {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}
```

**Usage:**
```tsx
<RuleSummaryCard
  label="Total Executions"
  value={totalExecutions}
  icon={Activity}
/>
```

**Key Features:**
- Large number display
- Icon support (Lucide icons)
- Label below value
- Card styling with hover effect

---

### SummaryBadge

**Path:** `app/components/shared/SummaryBadge.tsx`

**Purpose:** Colored badge displaying count and label for summaries.

**Props:**
```typescript
interface SummaryBadgeProps {
  count: number;
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'cyan' | 'orange';
}
```

**Usage:**
```tsx
<SummaryBadge count={5} label="Added" color="green" />
<SummaryBadge count={2} label="Removed" color="red" />
<SummaryBadge count={3} label="Changed" color="yellow" />
```

**Key Features:**
- Multiple color variants
- Count prominently displayed
- Label below count
- Rounded badge styling

---

## Regression Components

Components specific to the regression testing feature, managing baseline library and displaying regression results.

### RegressionResultsView

**Path:** `app/components/regression/RegressionResultsView.tsx`

**Purpose:** Displays regression test results comparing current trace against selected baseline.

**Props:**
```typescript
interface RegressionResultsViewProps {
  result: RegressionResult;
}
```

**Usage:**
```tsx
<RegressionResultsView result={regressionResult} />
```

**Key Features:**
- Success message when no issues found
- Divergent selections display (features with different values)
- Behavioral issues list (same selections, different outcomes)
- Match score display
- Color-coded sections (green for success, yellow for warnings, red for errors)

**Data Displayed:**
- Baseline match information
- Match score percentage
- Divergent feature selections
- Behavioral issues with BehavioralIssueCard components

---

### BaselineLibraryPanel

**Path:** `app/components/regression/BaselineLibraryPanel.tsx`

**Purpose:** Displays saved baseline traces with ranking by match score in inline mode.

**Props:**
```typescript
interface BaselineLibraryPanelProps {
  baselines: BaselineTrace[];
  currentTrace: ParsedTrace | null;
  selectedBaselineId: string | null;
  onRemove: (id: string) => void;
  onSelect: (baseline: BaselineTrace) => void;
}
```

**Usage:**
```tsx
<BaselineLibraryPanel
  baselines={baselineLibrary}
  currentTrace={baselineTrace}
  selectedBaselineId={selectedBaselineId}
  onRemove={handleRemoveBaseline}
  onSelect={handleSelectBaseline}
/>
```

**Key Features:**
- Inline display (not modal)
- Baselines ranked by match score against current trace
- Shows match percentage (color-coded: green ≥80%, yellow ≥50%, gray <50%)
- "Active" badge for selected baseline
- Selection count and feature count display
- Compare and Remove buttons per baseline
- Empty state with helpful message

**Ranking Logic:**
- Calculates match score based on feature selection overlap
- Sorts baselines by match score (highest first)
- Updates when current trace changes

---

### BehavioralIssueCard

**Path:** `app/components/regression/BehavioralIssueCard.tsx`

**Purpose:** Displays a single behavioral issue found during regression testing.

**Props:**
```typescript
interface BehavioralIssueCardProps {
  issue: BehavioralIssue;
}
```

**Usage:**
```tsx
<BehavioralIssueCard issue={issue} />
```

**Key Features:**
- Severity icon (error, warning, info)
- Issue type badge
- Value comparison (baseline vs current)
- Line number links to raw trace
- Color-coded by severity

**Issue Types:**
- Variable value mismatch
- Condition result mismatch
- Integration output difference

---

### AddToBaselineButton

**Path:** `app/components/regression/AddToBaselineButton.tsx`

**Purpose:** Button with popup form to save current trace as a baseline.

**Props:**
```typescript
interface AddToBaselineButtonProps {
  onAdd: (name: string) => BaselineTrace | undefined;
  defaultName?: string;
}
```

**Usage:**
```tsx
<AddToBaselineButton
  onAdd={handleAddToBaselines}
  defaultName={traceFilename}
/>
```

**Key Features:**
- Plus icon button
- Popup form on click
- Text input for baseline name
- Pre-populated with filename (if provided)
- Cancel and Save buttons
- Returns created baseline object

---

## Compare Components

Components used in Compare mode for side-by-side trace comparison.

### CompareView

**Path:** `app/components/compare/CompareView.tsx`

**Purpose:** Main comparison view showing differences between two traces.

**Props:**
```typescript
interface CompareViewProps {
  baseline: ParsedTrace;
  current: ParsedTrace;
  diff: TraceDiff;
}
```

**Usage:**
```tsx
<CompareView
  baseline={baselineTrace}
  current={currentTrace}
  diff={diff}
/>
```

**Key Features:**
- Summary badges (added, removed, changed counts)
- Feature value changes table
- Feature option changes table
- Added/removed features lists
- Integrates diff sections for conditions, variables, integrations

**Composed Sub-Components:**
- ConditionDiffSection
- VariableDiffSection
- IntegrationOutputDiffSection

---

### ConditionDiffSection

**Path:** `app/components/compare/ConditionDiffSection.tsx`

**Purpose:** Shows differences in condition evaluations between traces.

**Props:**
```typescript
interface ConditionDiffSectionProps {
  diff: ConditionDiff;
}
```

**Usage:**
```tsx
<ConditionDiffSection diff={diff.conditionDiff} />
```

**Key Features:**
- Changed conditions (different results)
- Added conditions (only in current)
- Removed conditions (only in baseline)
- Color-coded result changes (true/false badges)
- Line numbers for both traces

**Data Displayed:**
- Rule name
- Condition expression
- Baseline result → Current result
- Line numbers

---

### VariableDiffSection

**Path:** `app/components/compare/VariableDiffSection.tsx`

**Purpose:** Shows differences in variable final values between traces.

**Props:**
```typescript
interface VariableDiffSectionProps {
  diff: VariableDiff;
}
```

**Usage:**
```tsx
<VariableDiffSection diff={diff.variableDiff} />
```

**Key Features:**
- Changed variables (different final values)
- Value comparison (baseline → current)
- Variable name display
- Value highlighting

**Data Displayed:**
- Variable name
- Baseline final value
- Current final value

---

### IntegrationOutputDiffSection

**Path:** `app/components/compare/IntegrationOutputDiffSection.tsx`

**Purpose:** Shows differences in integration outputs between traces.

**Props:**
```typescript
interface IntegrationOutputDiffSectionProps {
  diff: IntegrationOutputDiff;
}
```

**Usage:**
```tsx
<IntegrationOutputDiffSection diff={diff.integrationOutputDiff} />
```

**Key Features:**
- Template-by-template comparison
- Row count changes
- Added/removed rows
- Property value changes
- Expandable diff details per template

**Data Displayed:**
- Template name
- Row count (baseline vs current)
- Changed properties within rows

---

## Layout Components

Components that provide application-wide layout and navigation.

### Header

**Path:** `app/components/layout/Header.tsx`

**Purpose:** Global header with search bar, view mode toggle, and add-to-baseline button.

**Props:**
```typescript
// Uses TraceViewerContext (no props)
```

**Usage:**
```tsx
<Header />
```

**Key Features:**
- Application title
- Global search bar (only in single mode with loaded trace)
- View mode toggle (Single vs Compare)
- Add to Baseline button (in single mode with trace)
- Uses TraceViewerContext for state

**Search Behavior:**
- Updates searchTerm in context
- Triggers re-render of all searchable sections
- Tab badges show match counts

---

### TabNavigation

**Path:** `app/components/layout/TabNavigation.tsx`

**Purpose:** Tab bar with icons and search match count badges.

**Props:**
```typescript
interface TabNavigationProps {
  activeTab: TabId;
  viewMode: ViewMode;
  matchCounts: SearchMatchCounts;
  onTabChange: (tab: TabId) => void;
}
```

**Usage:**
```tsx
<TabNavigation
  activeTab={activeTab}
  viewMode={viewMode}
  matchCounts={matchCounts}
  onTabChange={setActiveTab}
/>
```

**Key Features:**
- Sticky positioning (stays at top on scroll)
- Icons from Lucide React (Info, Bug, Layers, GitCompare, ShieldCheck)
- Active tab highlighting (border-bottom blue accent)
- Search match count badges (only shown when matches > 0)
- Filters tabs by view mode (Compare tab only in compare mode)

**Tab Visibility:**
- Info, Debug, Integration, Regression: Single mode only
- Compare: Compare mode only

---

## Context & Hooks

Global state management and custom hooks for accessing context.

### TraceViewerContext

**Path:** `app/context/TraceViewerContext.tsx`

**Purpose:** Global context provider for application state and actions.

**Type:**
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
  showBaselinePanel: boolean;
  setShowBaselinePanel: (show: boolean) => void;
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

**Usage:**
```tsx
// In page.tsx
<TraceViewerContextProvider value={contextValue}>
  <YourComponents />
</TraceViewerContextProvider>
```

**Provider Component:**
```tsx
export function TraceViewerContextProvider({ value, children }) {
  return <TraceViewerContext.Provider value={value}>{children}</TraceViewerContext.Provider>;
}
```

---

### useTraceViewerContext

**Path:** `app/context/TraceViewerContext.tsx`

**Purpose:** Hook to access TraceViewerContext with error checking.

**Usage:**
```typescript
import { useTraceViewerContext } from '@/app/context/TraceViewerContext';

export function MyComponent() {
  const { baselineTrace, searchTerm, showLine } = useTraceViewerContext();
  // Use context values...
}
```

**Error Handling:**
- Throws error if used outside TraceViewerContextProvider
- Ensures context is always available

---

### useTraceViewer

**Path:** `app/hooks/useTraceViewer.ts`

**Purpose:** Simplified hook providing access to commonly-used context methods.

**Returns:**
```typescript
{
  showLine: (lineNumber: number) => void;
}
```

**Usage:**
```typescript
import { useTraceViewer } from '@/app/hooks/useTraceViewer';

export function LineNumber({ lineNumber }: LineNumberProps) {
  const { showLine } = useTraceViewer();
  return <button onClick={() => showLine(lineNumber)}>{lineNumber}</button>;
}
```

---

### useSearchMatches

**Path:** `app/hooks/useSearchMatches.ts`

**Purpose:** Calculates search match counts per tab for badge display.

**Parameters:**
```typescript
function useSearchMatches(
  trace: ParsedTrace | null,
  searchTerm: string
): SearchMatchCounts
```

**Returns:**
```typescript
interface SearchMatchCounts {
  info: number;
  debug: number;
  integration: number;
  compare: number;
  regression: number;
}
```

**Usage:**
```typescript
import { useSearchMatches } from '@/app/hooks/useSearchMatches';

const matchCounts = useSearchMatches(baselineTrace, searchTerm);
// matchCounts = { info: 5, debug: 2, integration: 0, compare: 0, regression: 0 }
```

**Search Logic:**
- Info tab: Searches features, issues
- Debug tab: Searches variables, conditions
- Integration tab: Searches integration outputs, rulesets, rules
- Regression tab: Always 0 (no search)
- Compare tab: Always 0 (no search)

**Memoization:**
- Uses useMemo to avoid recalculation on every render
- Only recalculates when trace or searchTerm changes

---

## Component Composition Hierarchy

```
page.tsx (Orchestration)
├── TraceViewerContextProvider
│   ├── Header (Global search, mode toggle)
│   ├── TraceUploader (File/paste input)
│   ├── TabNavigation (Tab switcher with badges)
│   ├── Tab Components
│   │   ├── InfoTab
│   │   │   ├── MetadataSection
│   │   │   │   └── MetadataItem (repeated)
│   │   │   ├── FeaturesSection
│   │   │   └── IssuesSection
│   │   │       └── IssueCard (repeated)
│   │   ├── DebugTab
│   │   │   ├── VariableTrackingSection
│   │   │   │   └── VariableRow (repeated)
│   │   │   ├── ConditionTracingSection
│   │   │   │   ├── ConditionRow (repeated)
│   │   │   │   └── ExpressionTree
│   │   │   └── TimelineSection
│   │   │       └── RulesetNode (recursive)
│   │   ├── IntegrationTab
│   │   │   ├── IntegrationOutputSection
│   │   │   └── RuleExecutionSection
│   │   │       └── RuleSummaryCard (repeated)
│   │   ├── CompareTab
│   │   │   └── CompareView
│   │   │       ├── SummaryBadge (repeated)
│   │   │       ├── ConditionDiffSection
│   │   │       ├── VariableDiffSection
│   │   │       └── IntegrationOutputDiffSection
│   │   └── RegressionTab
│   │       ├── RegressionResultsView
│   │       │   └── BehavioralIssueCard (repeated)
│   │       └── BaselineLibraryPanel
│   └── RawTraceViewer (Modal)
│       └── LineNumber (repeated)
```

---

## Component Size Reference

| Component | Lines | Notes |
|-----------|-------|-------|
| InfoTab | 32 | Simple composition |
| DebugTab | 35 | Simple composition |
| IntegrationTab | 26 | Simple composition |
| CompareTab | 40 | Simple composition |
| RegressionTab | 50 | More complex props |
| MetadataSection | 80 | Grid layout |
| FeaturesSection | 113 | Search, table, expand |
| IssuesSection | 120 | Filtering, cards |
| VariableTrackingSection | 312 | Pagination, history |
| ConditionTracingSection | 347 | Pagination, trees |
| TimelineSection | 370 | Complex hierarchy |
| IntegrationOutputSection | 180 | Templates, rows |
| RuleExecutionSection | 150 | Stats, tables |
| TraceUploader | 125 | File, paste modes |
| RawTraceViewer | 180 | Modal, windowing |
| LineNumber | 25 | Simple button |
| ExpressionTree | 150 | Recursive rendering |
| MetadataItem | 20 | Simple display |
| RuleSummaryCard | 60 | Card with icon |
| SummaryBadge | 30 | Badge display |
| RegressionResultsView | 120 | Results display |
| BaselineLibraryPanel | 137 | Ranking, cards |
| BehavioralIssueCard | 90 | Issue display |
| AddToBaselineButton | 80 | Button + form |
| CompareView | 200 | Multiple sections |
| ConditionDiffSection | 150 | Diff table |
| VariableDiffSection | 100 | Diff table |
| IntegrationOutputDiffSection | 150 | Template diffs |
| Header | 100 | Search, toggle |
| TabNavigation | 65 | Tab bar |

---

## Key Patterns Across Components

### 1. Expandable Sections
Many sections use expand/collapse pattern:
- FeaturesSection
- IssuesSection
- VariableTrackingSection (rows)
- ConditionTracingSection (rows)
- IntegrationOutputSection (templates)

Pattern:
```typescript
const [isExpanded, setIsExpanded] = useState(false);

<button onClick={() => setIsExpanded(!isExpanded)}>
  <ChevronDown className={isExpanded ? 'rotate-180' : ''} />
</button>

{isExpanded && <Content />}
```

### 2. Pagination
Sections with large datasets use pagination:
- VariableTrackingSection (50 per page)
- ConditionTracingSection (50 per page)

Pattern:
```typescript
const PAGE_SIZE = 50;
const [currentPage, setCurrentPage] = useState(0);
const paginatedData = data.slice(
  currentPage * PAGE_SIZE,
  (currentPage + 1) * PAGE_SIZE
);
```

### 3. Search Filtering
Multiple components support search:
- FeaturesSection
- VariableTrackingSection (local)
- ConditionTracingSection (local)

Pattern:
```typescript
const filteredData = useMemo(() => {
  if (!searchTerm) return data;
  const term = searchTerm.toLowerCase();
  return data.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.value.toLowerCase().includes(term)
  );
}, [data, searchTerm]);
```

### 4. Context Consumption
Most components use context:

```typescript
import { useTraceViewerContext } from '@/app/context/TraceViewerContext';

const { baselineTrace, searchTerm, showLine } = useTraceViewerContext();
```

### 5. Line Number Links
Components showing trace data include clickable line numbers:

```typescript
import { LineNumber } from '@/app/components/shared/LineNumber';

<LineNumber lineNumber={item.lineNumber} />
```

This opens RawTraceViewer modal at the specific line.
