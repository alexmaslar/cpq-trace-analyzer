# Style Guide

This document outlines coding conventions, patterns, and best practices for the CPQ Trace Analyzer codebase. Following these guidelines ensures consistency, maintainability, and code quality across the project.

---

## TypeScript Conventions

### Strict Mode

Always enable strict TypeScript checking:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Explicit Return Types

Always specify return types for functions:

```typescript
// ✅ Good
function parseTrace(content: string): ParsedTrace {
  // ...
}

// ❌ Bad
function parseTrace(content: string) {
  // Return type inferred
}
```

### Interface vs Type

**Use `interface` for:**
- Object shapes
- Component props
- Extendable types

```typescript
// ✅ Good
interface FeaturesSectionProps {
  features: FeatureData[];
  searchTerm?: string;
}

interface ParsedTrace {
  metadata: ConfigurationMetadata;
  features: Map<string, FeatureData>;
}
```

**Use `type` for:**
- Unions
- Primitives with aliases
- Mapped types
- Conditional types

```typescript
// ✅ Good
type TabId = 'info' | 'debug' | 'integration' | 'compare' | 'regression';
type ViewMode = 'single' | 'compare';
type Nullable<T> = T | null;
```

### Avoid `any`

Never use `any`. Use `unknown` if type is truly unknown:

```typescript
// ✅ Good
function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

// ❌ Bad
function handleError(error: any): void {
  console.error(error.message);
}
```

### Optional Chaining & Nullish Coalescing

Use modern TypeScript operators:

```typescript
// ✅ Good
const value = trace?.metadata?.configurationName ?? 'Unknown';

// ❌ Bad
const value = trace && trace.metadata && trace.metadata.configurationName || 'Unknown';
```

---

## Naming Conventions

### Components

PascalCase for React components:

```typescript
// ✅ Good
export function MetadataSection() { }
export function FeaturesSection() { }

// ❌ Bad
export function metadataSection() { }
export function features_section() { }
```

### Hooks

camelCase with `use` prefix:

```typescript
// ✅ Good
export function useTraceViewer() { }
export function useSearchMatches() { }

// ❌ Bad
export function TraceViewer() { }
export function searchMatches() { }
```

### Types & Interfaces

PascalCase for types and interfaces:

```typescript
// ✅ Good
interface ParsedTrace { }
type TabId = '...';

// ❌ Bad
interface parsedTrace { }
type tabId = '...';
```

### Constants

UPPER_SNAKE_CASE for constants:

```typescript
// ✅ Good
const WINDOW_SIZE = 200;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ❌ Bad
const windowSize = 200;
const maxFileSize = 10 * 1024 * 1024;
```

### Functions & Variables

camelCase for functions and variables:

```typescript
// ✅ Good
function parseTrace(content: string) { }
const baselineTrace = parseTrace(content);

// ❌ Bad
function ParseTrace(content: string) { }
const BaselineTrace = parseTrace(content);
```

### Files

- Components: PascalCase matching component name
  - `MetadataSection.tsx`
  - `TraceUploader.tsx`
- Utilities: kebab-case
  - `trace-parser.ts`
  - `baseline-storage.ts`
- Hooks: camelCase with `use` prefix
  - `useTraceViewer.ts`
  - `useSearchMatches.ts`

---

## Component Structure

### File Header Comment

Every component file should start with a descriptive comment:

```typescript
/**
 * FeaturesSection - Displays feature options and selections in table format
 */

'use client';

import { useState } from 'react';
// ...
```

### Component Template

Follow this structure for all components:

```typescript
/**
 * ComponentName - Brief description
 */

'use client';  // If client component

// 1. React imports
import { useState, useCallback, useMemo } from 'react';

// 2. External library imports
import { Check, X } from 'lucide-react';

// 3. Internal imports (absolute paths)
import { useTraceViewerContext } from '@/app/context/TraceViewerContext';
import type { FeatureData } from '@/lib/trace-parser';

// 4. Type definitions
interface ComponentNameProps {
  propName: string;
  optionalProp?: number;
}

// 5. Constants (if any)
const DEFAULT_PAGE_SIZE = 50;

// 6. Component implementation
export function ComponentName({ propName, optionalProp = 10 }: ComponentNameProps) {
  // State
  const [localState, setLocalState] = useState<string>('');

  // Context
  const { globalState } = useTraceViewerContext();

  // Callbacks
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);

  // Memoized values
  const computedValue = useMemo(() => {
    // ...
  }, [dependencies]);

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

// 7. Sub-components (if needed, prefer separate files)
function SubComponent() {
  // ...
}
```

### Component Size Limit

**Maximum 350 lines per component file.**

If a component exceeds this:
1. Extract sub-components to separate files
2. Move complex logic to custom hooks
3. Extract pure functions to utility files

```typescript
// ❌ Bad - 400 line component
export function GodComponent() {
  // Too much logic, UI, and state
}

// ✅ Good - Split into focused components
export function ParentComponent() {
  // Orchestration only
  return (
    <>
      <HeaderSection />
      <BodySection />
      <FooterSection />
    </>
  );
}
```

---

## React Patterns

### Function Components Only

Always use function components, never class components:

```typescript
// ✅ Good
export function MyComponent() {
  return <div>Hello</div>;
}

// ❌ Bad
export class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

### Hooks Best Practices

#### useState

Group related state:

```typescript
// ✅ Good - Related state in one object
const [filters, setFilters] = useState({
  searchTerm: '',
  showFired: true,
  showSkipped: true,
});

// ❌ Bad - Unrelated state grouped
const [data, setData] = useState({
  trace: null,
  username: '',
  darkMode: false,
});
```

#### useCallback

Use for event handlers passed to children:

```typescript
// ✅ Good
const handleClick = useCallback((id: string) => {
  dispatch({ type: 'SELECT', id });
}, [dispatch]);

<ChildComponent onClick={handleClick} />

// ❌ Bad - New function on every render
<ChildComponent onClick={(id) => dispatch({ type: 'SELECT', id })} />
```

#### useMemo

Use for expensive computations:

```typescript
// ✅ Good - Expensive computation
const sortedData = useMemo(() => {
  return data.sort((a, b) => complexSortLogic(a, b));
}, [data]);

// ❌ Bad - Memoizing simple operation
const doubled = useMemo(() => value * 2, [value]);
```

#### useEffect

Be explicit with dependencies:

```typescript
// ✅ Good - Clear dependencies
useEffect(() => {
  loadData(userId);
}, [userId]);

// ❌ Bad - Missing dependencies or empty array when not appropriate
useEffect(() => {
  loadData(userId);
}, []); // userId missing!
```

### Custom Hooks

Extract reusable logic into custom hooks:

```typescript
// ✅ Good - Reusable logic in hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearch = useDebounce(searchTerm, 300);
```

### Conditional Rendering

Use consistent patterns:

```typescript
// ✅ Good - Ternary for simple conditions
{isLoading ? <Spinner /> : <Content />}

// ✅ Good - Logical AND for single condition
{error && <ErrorMessage error={error} />}

// ✅ Good - Early return for complex conditions
if (!data) return null;
return <ComplexUI data={data} />;

// ❌ Bad - Nested ternaries
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Content /> : null}
```

---

## Styling Conventions

### Tamagui Components (Preferred)

Use Tamagui UI primitives where possible:

```typescript
import { Button, Card, Stack, YStack, XStack, Text } from 'tamagui';

// ✅ Good - Tamagui components
export function MyComponent() {
  return (
    <YStack space="$4" padding="$4">
      <Card>
        <Text fontSize="$6" fontWeight="bold">
          Title
        </Text>
      </Card>
      <XStack space="$2">
        <Button onPress={handleSave}>Save</Button>
        <Button variant="outlined" onPress={handleCancel}>
          Cancel
        </Button>
      </XStack>
    </YStack>
  );
}
```

### Tamagui Theme System

Use theme tokens consistently:

```typescript
// ✅ Good - Theme tokens
<Text color="$color" fontSize="$4" />
<Stack backgroundColor="$background" padding="$3" />

// ❌ Bad - Hardcoded values
<Text color="#000000" fontSize="16px" />
<Stack backgroundColor="white" padding="12px" />
```

### Tamagui Responsive Variants

Use breakpoint props for responsive design:

```typescript
// ✅ Good - Responsive variants
<Stack
  width="100%"
  $sm={{ width: '50%' }}
  $md={{ width: '33%' }}
  $lg={{ width: '25%' }}
>
  <Card />
</Stack>
```

### Tailwind CSS (Legacy/Fallback)

Use Tailwind for layouts not covered by Tamagui:

```typescript
// ✅ Good - Tailwind for custom layouts
<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>
```

### Tailwind Class Organization

Group classes logically:

```typescript
// ✅ Good - Grouped by category
className="
  flex items-center justify-between
  px-4 py-2 gap-2
  bg-gray-900 border border-gray-800 rounded-lg
  text-white text-sm font-medium
  hover:bg-gray-800
  transition-colors duration-200
"

// ❌ Bad - Random order
className="text-white hover:bg-gray-800 flex px-4 bg-gray-900 text-sm rounded-lg"
```

Order: Layout → Spacing → Colors → Typography → States → Transitions

### Avoid Inline Styles

Never use inline styles, use Tamagui props or Tailwind classes:

```typescript
// ✅ Good
<Stack backgroundColor="$background" padding="$4" />

// ❌ Bad
<div style={{ backgroundColor: '#000', padding: '16px' }} />
```

### CSS Variables for Themes

Define theme values in globals.css:

```css
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --primary: #3b82f6;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}
```

### Animation Classes

Define animations in globals.css:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content-enter {
  animation: fadeIn 0.2s ease-out forwards;
}
```

Use Tamagui animation props when possible:

```typescript
// ✅ Good - Tamagui animation
<Stack
  animation="quick"
  opacity={isVisible ? 1 : 0}
  y={isVisible ? 0 : 10}
/>

// Alternative - CSS class
<div className="tab-content-enter">...</div>
```

---

## Code Organization

### One Component Per File

```
✅ Good
app/components/sections/
  ├── MetadataSection.tsx
  ├── FeaturesSection.tsx
  └── IssuesSection.tsx

❌ Bad
app/components/
  └── Sections.tsx (contains all sections)
```

### Co-locate Interfaces

Define interfaces in the same file as the component:

```typescript
// ✅ Good
// FeaturesSection.tsx
interface FeaturesSectionProps {
  features: FeatureData[];
  searchTerm?: string;
}

export function FeaturesSection({ features, searchTerm }: FeaturesSectionProps) {
  // ...
}
```

### Extract Complex Logic

Move complex logic to lib/ functions:

```typescript
// ❌ Bad - Complex logic in component
export function MyComponent() {
  const processData = (data: RawData) => {
    // 100 lines of complex logic
  };

  return <div>{processData(rawData)}</div>;
}

// ✅ Good - Logic in lib/
// lib/data-processor.ts
export function processData(data: RawData): ProcessedData {
  // 100 lines of complex logic
}

// MyComponent.tsx
export function MyComponent() {
  return <div>{processData(rawData)}</div>;
}
```

### Directory Structure

Organize by feature/function, not by type:

```
✅ Good - Organized by feature
app/components/
  ├── tabs/              # Tab components
  ├── sections/          # Content sections
  ├── shared/            # Reusable UI
  ├── regression/        # Regression feature
  └── compare/           # Compare feature

❌ Bad - Organized by type
app/components/
  ├── buttons/
  ├── cards/
  ├── modals/
  └── tables/
```

### Import Organization

Group imports by category:

```typescript
// 1. React imports
import { useState, useCallback } from 'react';

// 2. External library imports
import { Check, X } from 'lucide-react';

// 3. Internal imports (absolute paths)
import { useTraceViewerContext } from '@/app/context/TraceViewerContext';
import { parseTrace } from '@/lib/trace-parser';

// 4. Type imports (separate)
import type { ParsedTrace } from '@/lib/trace-parser';
import type { TabId } from '@/app/types';
```

### Absolute vs Relative Imports

Always use absolute imports with `@/` alias:

```typescript
// ✅ Good
import { Header } from '@/app/components/layout/Header';
import { parseTrace } from '@/lib/trace-parser';

// ❌ Bad
import { Header } from '../../layout/Header';
import { parseTrace } from '../../../lib/trace-parser';
```

---

## Comments & Documentation

### File Headers

Every file should have a brief description:

```typescript
/**
 * trace-parser.ts - Parses Infor CPQ interactive trace files
 *
 * Extracts configuration metadata, features, rule executions,
 * variable assignments, and condition evaluations from trace text.
 */
```

### Function Documentation

Document complex functions with JSDoc:

```typescript
/**
 * Compares two traces and identifies behavioral differences.
 *
 * @param baseline - Known-good baseline trace
 * @param current - Current trace to compare
 * @param matchInfo - Baseline match information
 * @returns Regression result with behavioral issues
 */
export function compareBehavior(
  baseline: ParsedTrace,
  current: ParsedTrace,
  matchInfo: { id: string; name: string; matchScore: number }
): RegressionResult {
  // Implementation
}
```

### Inline Comments

Use sparingly for non-obvious logic:

```typescript
// ✅ Good - Explains why
// Limit to 200 lines for performance (windowed rendering)
const WINDOW_SIZE = 200;

// ❌ Bad - States the obvious
// Set window size to 200
const WINDOW_SIZE = 200;
```

### TODO Comments

Use TODO for future work:

```typescript
// TODO: Migrate to Supabase database storage
export function addBaseline(name: string, trace: ParsedTrace) {
  // Current localStorage implementation
}
```

---

## Error Handling

### Try-Catch Blocks

Handle errors gracefully:

```typescript
// ✅ Good
try {
  const parsed = parseTrace(content);
  setBaselineTrace(parsed);
} catch (e) {
  setError(`Failed to parse trace: ${e instanceof Error ? e.message : 'Unknown error'}`);
}

// ❌ Bad
const parsed = parseTrace(content); // May throw
setBaselineTrace(parsed);
```

### Error Messages

Provide helpful error messages:

```typescript
// ✅ Good
throw new Error(`Failed to parse trace at line ${lineNumber}: Invalid feature syntax`);

// ❌ Bad
throw new Error('Parse error');
```

---

## Performance Best Practices

### Avoid Unnecessary Re-renders

```typescript
// ✅ Good - Memoized callback
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// ❌ Bad - New function every render
const handleClick = () => {
  // ...
};
```

### Lazy Loading

Use React.lazy for code splitting:

```typescript
// ✅ Good - Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function MyComponent() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Pagination

Paginate large datasets:

```typescript
// ✅ Good - Pagination
const PAGE_SIZE = 50;
const [currentPage, setCurrentPage] = useState(0);
const paginatedData = data.slice(
  currentPage * PAGE_SIZE,
  (currentPage + 1) * PAGE_SIZE
);

// ❌ Bad - Rendering all items
{data.map((item) => <Item key={item.id} item={item} />)}
```

---

## Testing Conventions (Future)

### Test File Naming

```
ComponentName.tsx
ComponentName.test.tsx  // Unit tests
ComponentName.spec.tsx  // Integration tests
```

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { ... };

    // Act
    render(<ComponentName {...props} />);

    // Assert
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

---

## Git Commit Messages

Follow conventional commits:

```bash
feat: Add regression testing tab
fix: Correct variable tracking pagination
docs: Update architecture documentation
refactor: Extract search logic to custom hook
style: Format components with Prettier
perf: Optimize trace parsing for large files
test: Add unit tests for trace-parser
```

---

## Code Review Checklist

Before submitting code for review:

- [ ] TypeScript strict mode enabled, no `any` types
- [ ] Component files under 350 lines
- [ ] Proper naming conventions followed
- [ ] Imports organized (React → External → Internal → Types)
- [ ] Tamagui components used where appropriate
- [ ] Custom hooks for reusable logic
- [ ] Error handling implemented
- [ ] Performance optimizations (memoization, pagination)
- [ ] Comments only for non-obvious logic
- [ ] No console.log statements
- [ ] Build succeeds (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
