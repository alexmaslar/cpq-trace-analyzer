/**
 * Baseline Library Panel - shows saved baseline traces (inline mode for Regression tab)
 */

'use client';

import { useMemo } from 'react';
import { Archive } from 'lucide-react';
import type { ParsedTrace } from '@/lib/trace-parser';
import type { BaselineTrace } from '@/lib/baseline-storage-api';

interface BaselineLibraryPanelProps {
  baselines: BaselineTrace[];
  currentTrace: ParsedTrace | null;
  selectedBaselineId: string | null;
  onRemove: (id: string) => void;
  onSelect: (baseline: BaselineTrace) => void;
}

// Helper function to rank baselines by match score
function rankBaselines(currentTrace: ParsedTrace, baselines: BaselineTrace[]): { baseline: BaselineTrace; matchScore: number }[] {
  const currentSelections = new Map(
    Array.from(currentTrace.features.values()).map((f) => [f.name, f.selectedValue])
  );

  return baselines.map((baseline) => {
    const baselineSelections = new Map(
      baseline.selectionPath.map(entry => [entry.featureName, entry.selectedValue])
    );
    let matchCount = 0;
    let totalCompared = 0;

    for (const [featureName, currentValue] of currentSelections) {
      if (baselineSelections.has(featureName)) {
        totalCompared++;
        if (baselineSelections.get(featureName) === currentValue) {
          matchCount++;
        }
      }
    }

    const matchScore = totalCompared > 0 ? Math.round((matchCount / totalCompared) * 100) : 0;
    return { baseline, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function BaselineLibraryPanel({
  baselines,
  currentTrace,
  selectedBaselineId,
  onRemove,
  onSelect,
}: BaselineLibraryPanelProps) {
  const rankedBaselines = useMemo(() => {
    if (!currentTrace) return baselines.map((b) => ({ baseline: b, matchScore: 0 }));
    return rankBaselines(currentTrace, baselines);
  }, [baselines, currentTrace]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Baseline Library</h2>
        <p className="text-xs text-gray-500 mt-1">
          Baselines are stored in the database and persist across sessions.
        </p>
      </div>

      <div className="p-6">
        {baselines.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Archive className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No baselines yet</p>
            <p className="text-sm">Load a trace and click "Add to Baselines" to save it as a reference</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankedBaselines.map(({ baseline, matchScore }) => (
              <div
                key={baseline.id}
                className={`p-4 rounded-lg border ${
                  selectedBaselineId === baseline.id
                    ? 'bg-blue-900/30 border-blue-600'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{baseline.name}</h3>
                      {selectedBaselineId === baseline.id && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Active</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{baseline.filename}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{baseline.selectionPath.length} selections</span>
                      <span>{baseline.trace.features.size} features</span>
                      {currentTrace && matchScore > 0 && (
                        <span
                          className={`font-medium ${
                            matchScore >= 80
                              ? 'text-green-400'
                              : matchScore >= 50
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                          }`}
                        >
                          {matchScore}% match
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {currentTrace && (
                      <button
                        onClick={() => onSelect(baseline)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                      >
                        Compare
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(baseline.id)}
                      className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
