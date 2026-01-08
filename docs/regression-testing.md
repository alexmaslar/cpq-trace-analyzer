# Regression Testing

This document explains the behavioral regression testing system for CPQ configurations, including baseline management, auto-matching algorithms, and behavioral comparison.

---

## Concept Overview

### What is Behavioral Regression Testing?

**Definition:** Comparing a current configuration trace against a known-good "baseline" trace to detect unintended behavioral changes.

**Goal:** Identify when the same user selections produce different outcomes due to:
- Rule logic changes
- Data changes
- Configuration errors
- Unintended side effects

**Not Tested:** Different user selections are expected to produce different outcomes. The regression system only flags issues when **identical selections** lead to **different behavior**.

---

### Why Use Regression Testing?

**Problem Without Baselines:**
- Manual comparison of traces is time-consuming
- Easy to miss subtle behavioral changes
- No automated validation of configuration changes
- Risk of breaking working configurations

**Benefits With Baselines:**
- Automatic detection of behavioral regressions
- Confidence when making configuration changes
- Fast validation (seconds vs. hours)
- Historical reference of known-good configurations

---

### Key Concepts

#### Baseline Trace

A **baseline** is a known-good configuration trace that represents correct behavior.

```typescript
interface BaselineTrace {
  id: string;                      // Unique identifier
  name: string;                    // User-friendly name ("Production CSR Flow")
  filename: string;                // Original trace filename
  trace: ParsedTrace;              // Full parsed trace data
  selectionPath: SelectionEntry[]; // Ordered feature selections
  createdAt: number;               // Timestamp
}
```

**When to Create:**
- After validating configuration works correctly
- Before making risky changes
- For each major configuration path (CSR, Sales, Support, etc.)

#### Selection Path

An ordered list of feature selections representing the user's configuration journey:

```typescript
interface SelectionEntry {
  featureName: string;       // "BUS_PROCESS"
  selectedValue: string | null; // "CSR"
  optionCount: number;       // Number of options available (4)
}
```

**Example Selection Path:**
```typescript
[
  { featureName: "BUS_PROCESS", selectedValue: "CSR", optionCount: 4 },
  { featureName: "REGION", selectedValue: "US", optionCount: 3 },
  { featureName: "PRIORITY", selectedValue: "High", optionCount: 2 }
]
```

**Purpose:**
- Match test traces to appropriate baselines
- Identify where user selections diverged
- Focus behavioral comparison on matching paths

#### Behavioral Issues

Issues flagged when **same selections** produce **different behavior**:

```typescript
type BehavioralIssueType =
  | 'options_changed'      // Available options differ
  | 'integration_changed'  // Integration output differs
  | 'condition_changed'    // Condition result differs
  | 'feature_missing'      // Feature exists in baseline but not test
  | 'feature_added';       // New feature in test (info only)
```

---

## Baseline Library

### Storage Location

**Current Implementation:**
- Browser `localStorage`
- Key: `cpq-trace-analyzer-baselines`
- Format: JSON serialized library

**Target Implementation (Future):**
- Supabase PostgreSQL database
- Table: `baselines`
- Per-user storage with Row Level Security

---

### Library Structure

```typescript
interface BaselineLibrary {
  baselines: BaselineTrace[];
  version: number;  // For future migrations
}
```

**Version History:**
- v1: Initial implementation with localStorage

---

### Managing Baselines

#### Adding a Baseline

```typescript
export function addBaseline(
  name: string,
  filename: string,
  trace: ParsedTrace
): BaselineTrace
```

**Workflow:**
1. User loads a known-good trace
2. Clicks "Add to Baselines" button
3. Enters a descriptive name (e.g., "Production CSR Flow - 2024-01-15")
4. System extracts selection path from trace
5. Baseline saved to localStorage

**Selection Path Extraction:**
```typescript
export function extractSelectionPath(trace: ParsedTrace): SelectionEntry[] {
  const selections: SelectionEntry[] = [];

  // Sort features by line number (appearance order in trace)
  const sortedFeatures = Array.from(trace.features.values())
    .sort((a, b) => a.lineNumber - b.lineNumber);

  for (const feature of sortedFeatures) {
    // Only include features with a selected value
    if (feature.selectedValue !== null) {
      selections.push({
        featureName: feature.name,
        selectedValue: feature.selectedValue,
        optionCount: feature.options.length,
      });
    }
  }

  return selections;
}
```

**Why Order Matters:**
- Configuration flow often depends on order
- Later features may be conditional on earlier selections
- Order-sensitive matching produces better results

---

#### Removing a Baseline

```typescript
export function removeBaseline(id: string): void
```

**Usage:**
- Click "Remove" button on baseline card
- Confirmation recommended (future)
- Deletion is immediate and permanent

---

#### Listing Baselines

```typescript
export function getBaselines(): BaselineTrace[]
```

**Display:**
- Baselines shown in BaselineLibraryPanel
- Ranked by match score against current trace
- Shows: name, filename, selection count, match percentage

---

#### Clearing All Baselines

```typescript
export function clearBaselines(): void
```

**Usage:**
- Developer/admin function
- Removes all baselines from storage
- **Warning:** Cannot be undone (unless backed up)

---

## Auto-Matching Algorithm

When a new trace is loaded, the system automatically finds the best matching baseline.

### Match Scoring

```typescript
interface BaselineMatchResult {
  baseline: BaselineTrace;
  matchScore: number;              // 0-100 percentage
  matchingSelections: number;      // Count of matching selections
  totalSelections: number;         // Total selections to compare
  firstDivergenceIndex: number;    // Where selections first differ (-1 if all match)
}
```

### Algorithm Steps

#### 1. Extract Test Selection Path

```typescript
const testSelections = extractSelectionPath(testTrace);
```

Extract ordered list of feature selections from the test trace.

---

#### 2. Compare Against Each Baseline

For each baseline, calculate match score:

```typescript
function calculateMatchScore(
  baseline: BaselineTrace,
  testSelections: SelectionEntry[]
): BaselineMatchResult {
  const baselineSelections = baseline.selectionPath;

  // Create map of test selections by feature name
  const testMap = new Map<string, SelectionEntry>();
  for (const sel of testSelections) {
    testMap.set(sel.featureName, sel);
  }

  // Compare each baseline selection
  let matchingCount = 0;
  let firstDivergenceIndex = -1;

  for (let i = 0; i < baselineSelections.length; i++) {
    const baselineSel = baselineSelections[i];
    const testSel = testMap.get(baselineSel.featureName);

    if (testSel && testSel.selectedValue === baselineSel.selectedValue) {
      matchingCount++;
    } else if (firstDivergenceIndex === -1) {
      firstDivergenceIndex = i;
    }
  }

  // Total features = union of both selection paths
  const allFeatures = new Set([
    ...baselineSelections.map(s => s.featureName),
    ...testSelections.map(s => s.featureName),
  ]);

  const matchScore = allFeatures.size > 0
    ? Math.round((matchingCount / allFeatures.size) * 100)
    : 0;

  return {
    baseline,
    matchScore,
    matchingSelections: matchingCount,
    totalSelections: allFeatures.size,
    firstDivergenceIndex,
  };
}
```

---

#### 3. Rank Baselines by Match Score

```typescript
export function rankBaselines(testTrace: ParsedTrace): BaselineMatchResult[] {
  const library = loadBaselineLibrary();
  const testSelections = extractSelectionPath(testTrace);

  const results = library.baselines.map(baseline =>
    calculateMatchScore(baseline, testSelections)
  );

  // Sort by match score descending (highest first)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
```

---

#### 4. Select Best Match

```typescript
export function findBestMatch(testTrace: ParsedTrace): BaselineMatchResult | null {
  const library = loadBaselineLibrary();

  if (library.baselines.length === 0) {
    return null;
  }

  const testSelections = extractSelectionPath(testTrace);
  let bestMatch: BaselineMatchResult | null = null;

  for (const baseline of library.baselines) {
    const result = calculateMatchScore(baseline, testSelections);

    if (!bestMatch || result.matchScore > bestMatch.matchScore) {
      bestMatch = result;
    }
  }

  return bestMatch;
}
```

**Auto-Selection:**
- Highest match score wins
- If tied, first baseline in list selected
- Match score shown in UI (e.g., "85% match")

---

### Match Score Interpretation

| Match Score | Meaning | Color |
|-------------|---------|-------|
| 90-100% | Excellent match, very similar paths | Green |
| 70-89% | Good match, mostly similar | Yellow |
| 50-69% | Moderate match, some divergence | Orange |
| 0-49% | Poor match, very different paths | Gray |

**Note:** Even a 100% match can have behavioral issues if rule logic changed!

---

## Behavioral Comparison

After matching a baseline, the system performs a behavioral comparison to detect issues.

### Comparison Function

```typescript
export function compareBehavior(
  baseline: ParsedTrace,
  test: ParsedTrace,
  baselineInfo: { id: string; name: string; matchScore: number }
): RegressionResult
```

### Regression Result

```typescript
interface RegressionResult {
  matchedBaselineName: string;
  matchedBaselineId: string;
  matchScore: number;  // 0-100%

  // Selection comparison
  matchingSelections: SelectionComparison[];    // Same selections
  divergentSelections: SelectionComparison[];   // Different selections

  // Behavioral issues (the important part!)
  issues: BehavioralIssue[];

  // Summary statistics
  summary: {
    totalFeaturesCompared: number;
    behavioralIssuesFound: number;  // errors + warnings
    userChoicesDiverged: number;    // different selections
    errors: number;
    warnings: number;
    infos: number;
  };
}
```

---

### Selection Comparison

First, classify each feature selection:

```typescript
interface SelectionComparison {
  featureName: string;
  baselineValue: string | null;
  testValue: string | null;
  isMatch: boolean;
}
```

**Matching Selections:**
- Feature exists in both traces
- Same selected value
- **These are checked for behavioral issues**

**Divergent Selections:**
- Feature exists in both traces
- Different selected values
- **Expected, not flagged as issues**
- Shown in summary for user awareness

---

### Behavioral Issue Detection

For **matching selections**, check for behavioral differences:

#### 1. Options Changed

**Scenario:** Same selection, but different available options

```typescript
{
  type: 'options_changed',
  featureName: 'BUS_PROCESS',
  selection: 'CSR',  // User selected CSR in both
  baseline: { value: ['CSR', 'SALES', 'SUPPORT'] },
  test: { value: ['CSR', 'SALES'] },  // SUPPORT option missing!
  severity: 'error',
  details: 'Missing options: SUPPORT'
}
```

**Why It's an Issue:**
- User had fewer choices available
- Could indicate rule logic error
- Might break configurations that depended on removed option

---

#### 2. Condition Result Changed

**Scenario:** Same condition evaluated differently

```typescript
{
  type: 'condition_changed',
  featureName: 'Validate Quantity',
  selection: '=root.Quantity > 5',
  baseline: { value: true },   // Condition fired in baseline
  test: { value: false },       // Skipped in test
  severity: 'warning',
  details: 'Condition "Validate Quantity" fired in baseline but was skipped in test'
}
```

**Why It's an Issue:**
- Different conditional logic execution
- May cause rules to fire/skip incorrectly
- Could produce different variable values or integration outputs

---

#### 3. Integration Output Changed

**Scenario:** Same selections, different integration output

```typescript
{
  type: 'integration_changed',
  featureName: 'OrderLine[001].Quantity',
  selection: null,
  baseline: { value: '10' },
  test: { value: '5' },
  severity: 'warning',
  details: 'Property value changed in integration output'
}
```

**Why It's an Issue:**
- External system receives different data
- Could break downstream processes
- May indicate calculation error

---

#### 4. Feature Missing/Added

**Feature Missing:**
```typescript
{
  type: 'feature_missing',
  featureName: 'PRIORITY',
  selection: 'High',
  baseline: { value: 'High' },
  test: { value: null },
  severity: 'error',
  details: 'Feature "PRIORITY" exists in baseline but not in test trace'
}
```

**Feature Added:**
```typescript
{
  type: 'feature_added',
  featureName: 'NEW_FEATURE',
  selection: 'Default',
  baseline: { value: null },
  test: { value: 'Default' },
  severity: 'info',
  details: 'New feature "NEW_FEATURE" appears in test but not baseline'
}
```

**Why Missing is an Error:**
- Configuration incomplete
- May break dependent features

**Why Added is Info Only:**
- Could be intentional new feature
- Not necessarily a regression

---

### Variable Comparison

Variables are **not** directly flagged as issues (too noisy), but influence other comparisons:

- Variable changes → may affect conditions
- Variable changes → may affect integrations
- Tracked for debugging

**Future Enhancement:** Flag unexpected variable value changes for critical variables.

---

## Regression Results Interpretation

### Success (No Issues)

```
✓ No behavioral issues found (100% match, 0 divergent selections)
```

**Meaning:**
- Test trace behaves identically to baseline
- Safe to proceed

---

### Divergent Selections (Expected)

```
⚠ Different Selections (3 features)
  - BUS_PROCESS: CSR → SALES
  - REGION: US → EU
  - PRIORITY: High → Low
```

**Meaning:**
- User made different choices
- Different outcomes are expected
- Not a regression, just a different path

---

### Behavioral Issues (Regression Detected)

```
❌ 2 Errors, 3 Warnings

Errors:
1. [options_changed] BUS_PROCESS: Missing option "SUPPORT"
2. [feature_missing] PRIORITY feature not found

Warnings:
1. [condition_changed] Validate Quantity condition fired → skipped
2. [integration_changed] OrderLine[001].Quantity: 10 → 5
3. [integration_changed] OrderLine template: 3 rows → 2 rows
```

**Meaning:**
- Configuration behavior has changed unexpectedly
- Review each issue before deploying
- May require rule fixes

---

### Severity Levels

| Severity | Meaning | Action Required |
|----------|---------|----------------|
| **Error** | Breaking change, likely to cause failures | Fix before deploying |
| **Warning** | Behavioral change, may be intentional | Review and validate |
| **Info** | Informational, not a problem | Acknowledge |

---

## Workflow

### 1. Creating a Baseline

```
┌─────────────────────────┐
│ Load Known-Good Trace   │
│ (validated, correct)    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Verify Trace Looks OK   │
│ - Check features        │
│ - Review variables      │
│ - Check integrations    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Click "Add to Baselines"│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Enter Descriptive Name  │
│ "Prod CSR Flow - Q1"    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Baseline Saved          │
│ - Selection path stored │
│ - Full trace data kept  │
└─────────────────────────┘
```

**Best Practices:**
- Use descriptive names with dates
- Create baselines for each major path
- Update baselines when intentionally changing behavior
- Keep baselines up-to-date with production configs

---

### 2. Running Regression Test

```
┌─────────────────────────┐
│ Load Test Trace         │
│ (new or modified)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ System Auto-Matches     │
│ Best Baseline           │
│ (highest match score)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Extract Selection Paths │
│ - Baseline path         │
│ - Test path             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Compare Selections      │
│ - Matching: Same value  │
│ - Divergent: Diff value │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Check Behavioral Issues │
│ (for matching selections)│
│ - Options changed?      │
│ - Conditions changed?   │
│ - Integrations changed? │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Display Results         │
│ - Match score           │
│ - Divergent selections  │
│ - Behavioral issues     │
└─────────────────────────┘
```

**Automatic Triggering:**
- Runs automatically when trace is loaded
- Best match selected immediately
- Results shown in Regression tab

---

### 3. Reviewing Results

```
┌─────────────────────────┐
│ Check Match Score       │
│ ≥80%: Good match        │
│ <80%: May be wrong path │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Review Divergent        │
│ Selections              │
│ (expected differences)  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Review Behavioral Issues│
│ Priority: Errors first  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│No Issues│ │Issues Found  │
└────┬───┘ └──────┬───────┘
     │            │
     ▼            ▼
  ┌────────┐  ┌──────────────┐
  │Deploy  │  │Investigate   │
  │Safe    │  │- Check rules │
  └────────┘  │- Fix issues  │
              │- Re-test     │
              └──────────────┘
```

---

### 4. Updating Baselines

**When to Update:**
- After intentionally changing configuration logic
- When baseline is out of date
- After validating new behavior is correct

**How to Update:**
1. Remove old baseline
2. Load new known-good trace
3. Add as new baseline with updated name

**Versioning Recommendation:**
- Include date in baseline names
- Keep old baselines temporarily for rollback
- Document what changed in baseline name

---

## Advanced Usage

### Manual Baseline Selection

If auto-match selects wrong baseline:

1. Go to Regression tab
2. View Baseline Library panel
3. Click "Compare" on desired baseline
4. System re-runs comparison with selected baseline

---

### Multiple Baselines for Same Path

Create multiple baselines for the same configuration path to test different scenarios:

```
- "CSR Flow - Standard Pricing"
- "CSR Flow - Discount Applied"
- "CSR Flow - Bulk Order"
```

**Benefit:** Comprehensive regression coverage

---

### Baseline Portability (Future)

**Current:** Baselines stored in browser localStorage (not portable)

**Future (Supabase):**
- Export baselines to JSON
- Import baselines from JSON
- Share baselines across team
- Baseline versioning and history

---

## Troubleshooting

### No Baseline Auto-Selected

**Cause:** No baselines in library

**Fix:**
1. Load a known-good trace
2. Click "Add to Baselines"
3. Re-load test trace

---

### Match Score Too Low (<50%)

**Cause:** Test trace is very different from all baselines

**Possible Reasons:**
- Testing a new configuration path (needs new baseline)
- Wrong baseline library loaded
- Test trace is incomplete

**Fix:**
- Create baseline for this path
- Or manually select appropriate baseline

---

### False Positive Issues

**Symptom:** Issues flagged that are actually correct

**Causes:**
- Intentional behavior change (update baseline)
- Baseline is out of date
- Different data environment (e.g., dev vs. prod)

**Fix:**
- If change is intentional, update baseline
- Add notes to baseline name explaining differences

---

### Missing Issues Not Detected

**Symptom:** Expected issue not flagged

**Causes:**
- Issue is in a divergent selection path (not compared)
- Issue is variable-only (not directly flagged)
- Issue is subtle (e.g., timing, order changes)

**Fix:**
- Ensure selection paths match
- Manually compare variable values
- Check integration outputs manually

---

## Future Enhancements

### Planned Features

1. **Supabase Storage**
   - User accounts
   - Team baseline libraries
   - Baseline versioning

2. **Advanced Matching**
   - Weighted matching (priority features count more)
   - Fuzzy matching (similar but not exact)
   - Partial path matching

3. **Smart Issue Detection**
   - Variable change impact analysis
   - Critical variable flagging
   - Integration output schema validation

4. **Baseline Management**
   - Import/Export baselines
   - Baseline categories/tags
   - Baseline search and filtering
   - Baseline diff viewer

5. **Reporting**
   - PDF regression reports
   - Trend analysis (issues over time)
   - Comparison history

6. **CI/CD Integration**
   - Automated regression testing
   - Pre-deployment validation
   - Slack/email notifications

---

## Best Practices

### 1. Baseline Naming

**Good Names:**
```
✓ "Production CSR Flow - 2024-01-15"
✓ "Sales Path with Discount - Validated Q4"
✓ "Baseline - Support Ticket Creation v2.1"
```

**Bad Names:**
```
✗ "baseline1"
✗ "test"
✗ "Untitled"
```

**Recommendation:**
- Include: Path type, date, version, or validation status
- Be descriptive
- Use consistent naming convention

---

### 2. When to Create Baselines

**Create Baseline:**
- After successful UAT
- Before production deployment
- After validating rule changes
- For each major configuration path

**Don't Create Baseline:**
- With incomplete traces
- With known errors
- With test/debug data

---

### 3. Baseline Maintenance

**Regular Review:**
- Review baselines quarterly
- Remove outdated baselines
- Update baselines after intentional changes
- Keep baseline count manageable (5-20 for most projects)

**Version Control (Future):**
- Keep baseline JSON exports in Git
- Document baseline changes in commit messages
- Tag baseline versions with releases

---

### 4. Issue Triage

**Priority Order:**
1. **Errors** - Fix immediately
2. **Warnings** - Review and validate
3. **Info** - Acknowledge

**For Each Issue:**
- Click line number to view trace context
- Compare baseline vs. test values
- Determine if intentional or bug
- Document decision

---

### 5. Team Workflow

**Shared Baselines (Future):**
1. **Golden Baselines** - Team-wide, protected
2. **Development Baselines** - Per-developer, flexible
3. **UAT Baselines** - Validated by QA

**Communication:**
- Notify team when updating shared baselines
- Document changes in baseline descriptions
- Use consistent naming across team

---

## Summary

**Key Takeaways:**

1. **Baselines are Known-Good Traces**
   - Store validated, correct configurations
   - Represent expected behavior

2. **Auto-Matching by Selection Path**
   - System finds best matching baseline
   - Match score indicates similarity

3. **Behavioral Comparison Detects Regressions**
   - Only same selections compared
   - Different selections are expected
   - Issues flagged: options, conditions, integrations

4. **Review Results Before Deploying**
   - Errors require fixes
   - Warnings need validation
   - Info is just awareness

5. **Keep Baselines Updated**
   - Update after intentional changes
   - Remove outdated baselines
   - Use descriptive names

**For Developers:**

Refer to `lib/baseline-storage.ts` (369 lines) for baseline management implementation and `lib/trace-parser.ts` for `compareBehavior()` function (lines 1688-1825).
