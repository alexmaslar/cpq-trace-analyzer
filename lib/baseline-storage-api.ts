/**
 * Baseline Storage - API Client
 * Simple client-side wrapper for baseline API endpoints
 * Works without authentication (uses demo user on server side)
 */

import type { ParsedTrace, FeatureData } from './trace-parser';

export interface BaselineTrace {
  id: string;
  name: string;
  filename: string;
  rawContent?: string;
  trace: ParsedTrace;
  selectionPath: SelectionEntry[];
  createdAt: number;
}

export interface SelectionEntry {
  featureName: string;
  selectedValue: string | null;
  optionCount: number;
}

export interface BaselineMatchResult {
  baseline: BaselineTrace;
  matchScore: number;
  matchingSelections: number;
  totalSelections: number;
  firstDivergenceIndex: number;
}

/**
 * Reconstruct Maps from JSON (API returns plain objects)
 */
function reconstructTrace(trace: ParsedTrace): ParsedTrace {
  // Features Map
  if (trace.features && !(trace.features instanceof Map)) {
    const featuresObj = trace.features as unknown as Record<string, FeatureData>;
    trace.features = new Map(Object.entries(featuresObj));
  }

  // Rulesets Map
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rulesSummary = trace.rulesSummary as any;
  if (rulesSummary?.rulesets && !(rulesSummary.rulesets instanceof Map)) {
    const rulesetsObj = rulesSummary.rulesets as Record<string, unknown>;
    rulesSummary.rulesets = new Map(Object.entries(rulesetsObj));

    for (const [, ruleset] of rulesSummary.rulesets) {
      if (ruleset.rules && !(ruleset.rules instanceof Map)) {
        ruleset.rules = new Map(Object.entries(ruleset.rules));
      }
    }
  }

  if (rulesSummary?.ruleTypeBreakdown && !(rulesSummary.ruleTypeBreakdown instanceof Map)) {
    rulesSummary.ruleTypeBreakdown = new Map(Object.entries(rulesSummary.ruleTypeBreakdown));
  }

  // Integration templates Map
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const integrationOutputs = trace.integrationOutputs as any;
  if (integrationOutputs?.templates && !(integrationOutputs.templates instanceof Map)) {
    integrationOutputs.templates = new Map(Object.entries(integrationOutputs.templates));

    for (const [, template] of integrationOutputs.templates) {
      for (const row of template.rows) {
        if (row.properties && !(row.properties instanceof Map)) {
          row.properties = new Map(Object.entries(row.properties));
        }
      }
    }
  }

  // Variable tracking Map
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variableTracking = trace.variableTracking as any;
  if (variableTracking?.variables && !(variableTracking.variables instanceof Map)) {
    variableTracking.variables = new Map(Object.entries(variableTracking.variables));
  }

  return trace;
}

/**
 * Extract selection path from a parsed trace
 */
export function extractSelectionPath(trace: ParsedTrace): SelectionEntry[] {
  const selections: SelectionEntry[] = [];

  const sortedFeatures = Array.from(trace.features.values())
    .sort((a, b) => a.lineNumber - b.lineNumber);

  for (const feature of sortedFeatures) {
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
 * Get all baselines from API
 */
export async function getBaselines(): Promise<BaselineTrace[]> {
  try {
    const response = await fetch('/api/baselines');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch baselines');
    }

    const baselines = await response.json();

    // Reconstruct Maps from JSON
    return baselines.map((baseline: BaselineTrace) => ({
      ...baseline,
      trace: reconstructTrace(baseline.trace),
    }));
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return [];
  }
}

/**
 * Add a new baseline via API
 */
export async function addBaseline(
  name: string,
  filename: string,
  rawContent: string,
  trace: ParsedTrace
): Promise<BaselineTrace> {
  const response = await fetch('/api/baselines', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      filename,
      rawContent,
      trace,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create baseline');
  }

  const baseline = await response.json();

  // Reconstruct Maps from JSON
  baseline.trace = reconstructTrace(baseline.trace);

  return baseline;
}

/**
 * Remove a baseline via API
 */
export async function removeBaseline(id: string): Promise<void> {
  const response = await fetch(`/api/baselines/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete baseline');
  }
}

/**
 * Calculate match score between a baseline and test selections
 */
function calculateMatchScore(
  baseline: BaselineTrace,
  testSelections: SelectionEntry[]
): BaselineMatchResult {
  const baselineSelections = baseline.selectionPath;

  let matchingCount = 0;
  let firstDivergenceIndex = -1;

  const testMap = new Map<string, SelectionEntry>();
  for (const sel of testSelections) {
    testMap.set(sel.featureName, sel);
  }

  for (let i = 0; i < baselineSelections.length; i++) {
    const baselineSel = baselineSelections[i];
    const testSel = testMap.get(baselineSel.featureName);

    if (testSel && testSel.selectedValue === baselineSel.selectedValue) {
      matchingCount++;
    } else if (firstDivergenceIndex === -1) {
      firstDivergenceIndex = i;
    }
  }

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
 * Find the best matching baseline for a test trace
 */
export async function findBestMatch(testTrace: ParsedTrace): Promise<BaselineMatchResult | null> {
  const baselines = await getBaselines();

  if (baselines.length === 0) {
    return null;
  }

  const testSelections = extractSelectionPath(testTrace);
  let bestMatch: BaselineMatchResult | null = null;

  for (const baseline of baselines) {
    const result = calculateMatchScore(baseline, testSelections);

    if (!bestMatch || result.matchScore > bestMatch.matchScore) {
      bestMatch = result;
    }
  }

  return bestMatch;
}

/**
 * Get all baselines ranked by match score for a test trace
 */
export async function rankBaselines(testTrace: ParsedTrace): Promise<BaselineMatchResult[]> {
  const baselines = await getBaselines();
  const testSelections = extractSelectionPath(testTrace);

  const results = baselines.map(baseline =>
    calculateMatchScore(baseline, testSelections)
  );

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
