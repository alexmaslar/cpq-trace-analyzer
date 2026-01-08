/**
 * Baseline Storage
 * Manages a library of known-good trace files for behavioral regression testing.
 * Stores baselines in localStorage with selection paths for matching.
 */

import type { ParsedTrace, FeatureData } from './trace-parser';

export interface BaselineTrace {
  id: string;
  name: string;                    // User-friendly name
  filename: string;                // Original filename
  trace: ParsedTrace;              // Full parsed trace data
  selectionPath: SelectionEntry[]; // Ordered list of feature selections
  createdAt: number;               // Timestamp
}

export interface SelectionEntry {
  featureName: string;
  selectedValue: string | null;
  optionCount: number;             // Number of options available when selection was made
}

export interface BaselineLibrary {
  baselines: BaselineTrace[];
  version: number;                 // For future migrations
}

const STORAGE_KEY = 'cpq-trace-analyzer-baselines';
const LIBRARY_VERSION = 1;

/**
 * Generate a unique ID for a baseline
 */
function generateId(): string {
  return `baseline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract selection path from a parsed trace
 * The selection path is an ordered list of feature=value pairs
 */
export function extractSelectionPath(trace: ParsedTrace): SelectionEntry[] {
  const selections: SelectionEntry[] = [];

  // Get features sorted by their line number in the trace (appearance order)
  const sortedFeatures = Array.from(trace.features.values())
    .sort((a, b) => a.lineNumber - b.lineNumber);

  for (const feature of sortedFeatures) {
    // Only include features that have a selected value
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

/**
 * Load the baseline library from localStorage
 */
export function loadBaselineLibrary(): BaselineLibrary {
  if (typeof window === 'undefined') {
    return { baselines: [], version: LIBRARY_VERSION };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { baselines: [], version: LIBRARY_VERSION };
    }

    const library = JSON.parse(stored) as BaselineLibrary;

    // Reconstruct Maps from JSON (they serialize as objects)
    for (const baseline of library.baselines) {
      baseline.trace = reconstructTrace(baseline.trace);
    }

    return library;
  } catch (error) {
    console.error('Failed to load baseline library:', error);
    return { baselines: [], version: LIBRARY_VERSION };
  }
}

/**
 * Reconstruct Maps from JSON serialization
 */
function reconstructTrace(trace: ParsedTrace): ParsedTrace {
  // Features Map
  if (trace.features && !(trace.features instanceof Map)) {
    const featuresObj = trace.features as unknown as Record<string, FeatureData>;
    trace.features = new Map(Object.entries(featuresObj));
  }

  // Rulesets Map - use any to bypass strict typing during reconstruction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rulesSummary = trace.rulesSummary as any;
  if (rulesSummary?.rulesets && !(rulesSummary.rulesets instanceof Map)) {
    const rulesetsObj = rulesSummary.rulesets as Record<string, unknown>;
    rulesSummary.rulesets = new Map(Object.entries(rulesetsObj));

    // Also reconstruct nested rules Maps
    for (const [, ruleset] of rulesSummary.rulesets) {
      if (ruleset.rules && !(ruleset.rules instanceof Map)) {
        ruleset.rules = new Map(Object.entries(ruleset.rules));
      }
    }
  }

  // Rule type breakdown Map
  if (rulesSummary?.ruleTypeBreakdown && !(rulesSummary.ruleTypeBreakdown instanceof Map)) {
    rulesSummary.ruleTypeBreakdown = new Map(Object.entries(rulesSummary.ruleTypeBreakdown));
  }

  // Integration templates Map - use any to bypass strict typing during reconstruction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const integrationOutputs = trace.integrationOutputs as any;
  if (integrationOutputs?.templates && !(integrationOutputs.templates instanceof Map)) {
    integrationOutputs.templates = new Map(Object.entries(integrationOutputs.templates));

    // Reconstruct row properties Maps
    for (const [, template] of integrationOutputs.templates) {
      for (const row of template.rows) {
        if (row.properties && !(row.properties instanceof Map)) {
          row.properties = new Map(Object.entries(row.properties));
        }
      }
    }
  }

  // Variable tracking Map - use any to bypass strict typing during reconstruction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variableTracking = trace.variableTracking as any;
  if (variableTracking?.variables && !(variableTracking.variables instanceof Map)) {
    variableTracking.variables = new Map(Object.entries(variableTracking.variables));
  }

  return trace;
}

/**
 * Serialize trace data for storage (convert Maps to objects)
 */
function serializeTrace(trace: ParsedTrace): unknown {
  return {
    ...trace,
    features: Object.fromEntries(trace.features),
    rulesSummary: {
      ...trace.rulesSummary,
      rulesets: Object.fromEntries(
        Array.from(trace.rulesSummary.rulesets.entries()).map(([key, ruleset]) => [
          key,
          {
            ...ruleset,
            rules: Object.fromEntries(ruleset.rules),
          },
        ])
      ),
      ruleTypeBreakdown: Object.fromEntries(trace.rulesSummary.ruleTypeBreakdown),
    },
    integrationOutputs: {
      ...trace.integrationOutputs,
      templates: Object.fromEntries(
        Array.from(trace.integrationOutputs.templates.entries()).map(([key, template]) => [
          key,
          {
            ...template,
            rows: template.rows.map(row => ({
              ...row,
              properties: Object.fromEntries(row.properties),
            })),
          },
        ])
      ),
    },
    variableTracking: {
      ...trace.variableTracking,
      variables: Object.fromEntries(trace.variableTracking.variables),
    },
  };
}

/**
 * Save the baseline library to localStorage
 */
export function saveBaselineLibrary(library: BaselineLibrary): void {
  if (typeof window === 'undefined') return;

  try {
    // Serialize traces for storage
    const serialized = {
      ...library,
      baselines: library.baselines.map(baseline => ({
        ...baseline,
        trace: serializeTrace(baseline.trace),
      })),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save baseline library:', error);
    // Could be quota exceeded - might want to handle this
    throw new Error('Failed to save baseline. Storage may be full.');
  }
}

/**
 * Add a new baseline to the library
 */
export function addBaseline(
  name: string,
  filename: string,
  trace: ParsedTrace
): BaselineTrace {
  const library = loadBaselineLibrary();

  const baseline: BaselineTrace = {
    id: generateId(),
    name,
    filename,
    trace,
    selectionPath: extractSelectionPath(trace),
    createdAt: Date.now(),
  };

  library.baselines.push(baseline);
  saveBaselineLibrary(library);

  return baseline;
}

/**
 * Remove a baseline from the library
 */
export function removeBaseline(id: string): void {
  const library = loadBaselineLibrary();
  library.baselines = library.baselines.filter(b => b.id !== id);
  saveBaselineLibrary(library);
}

/**
 * Get all baselines
 */
export function getBaselines(): BaselineTrace[] {
  return loadBaselineLibrary().baselines;
}

/**
 * Get a specific baseline by ID
 */
export function getBaseline(id: string): BaselineTrace | null {
  const library = loadBaselineLibrary();
  return library.baselines.find(b => b.id === id) || null;
}

/**
 * Clear all baselines
 */
export function clearBaselines(): void {
  saveBaselineLibrary({ baselines: [], version: LIBRARY_VERSION });
}

/**
 * Match score result for baseline comparison
 */
export interface BaselineMatchResult {
  baseline: BaselineTrace;
  matchScore: number;              // 0-100 percentage
  matchingSelections: number;      // Count of matching selections
  totalSelections: number;         // Total selections to compare
  firstDivergenceIndex: number;    // Where selections first differ (-1 if all match)
}

/**
 * Find the best matching baseline for a test trace
 * Matches by configuration path (longest matching selection sequence)
 */
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

/**
 * Calculate match score between a baseline and test selections
 */
function calculateMatchScore(
  baseline: BaselineTrace,
  testSelections: SelectionEntry[]
): BaselineMatchResult {
  const baselineSelections = baseline.selectionPath;

  // Find matching selections by feature name and value
  let matchingCount = 0;
  let firstDivergenceIndex = -1;

  // Create a map of test selections by feature name
  const testMap = new Map<string, SelectionEntry>();
  for (const sel of testSelections) {
    testMap.set(sel.featureName, sel);
  }

  // Compare each baseline selection
  for (let i = 0; i < baselineSelections.length; i++) {
    const baselineSel = baselineSelections[i];
    const testSel = testMap.get(baselineSel.featureName);

    if (testSel && testSel.selectedValue === baselineSel.selectedValue) {
      matchingCount++;
    } else if (firstDivergenceIndex === -1) {
      firstDivergenceIndex = i;
    }
  }

  // Total features to compare is the union of both
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

/**
 * Get all baselines ranked by match score for a test trace
 */
export function rankBaselines(testTrace: ParsedTrace): BaselineMatchResult[] {
  const library = loadBaselineLibrary();
  const testSelections = extractSelectionPath(testTrace);

  const results = library.baselines.map(baseline =>
    calculateMatchScore(baseline, testSelections)
  );

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
