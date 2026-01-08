/**
 * Compare View - shows comparison between baseline and current traces
 */

'use client';

import { ArrowRight, Check } from 'lucide-react';
import { SummaryBadge } from '@/app/components/shared/SummaryBadge';
import { ConditionDiffSection } from './ConditionDiffSection';
import { VariableDiffSection } from './VariableDiffSection';
import { IntegrationOutputDiffSection } from './IntegrationOutputDiffSection';
import type { TraceDiff, ParsedTrace } from '@/lib/trace-parser';

interface CompareViewProps {
  baseline: ParsedTrace;
  current: ParsedTrace;
  diff: TraceDiff;
}

export function CompareView({ baseline, current, diff }: CompareViewProps) {
  // Count integration output changes
  const integrationChanges =
    diff.integrationOutputDiff.addedTemplates.length +
    diff.integrationOutputDiff.removedTemplates.length +
    Array.from(diff.integrationOutputDiff.templateDiffs.values()).reduce(
      (sum, d) => sum + d.addedRows.length + d.removedRows.length + d.changedRows.length,
      0
    );

  // Count variable changes
  const variableChanges = diff.variableDiff.totalChanges;

  // Count condition changes
  const conditionChanges = diff.conditionDiff.totalChanges;

  const hasChanges =
    diff.addedFeatures.length > 0 ||
    diff.removedFeatures.length > 0 ||
    diff.optionChanges.length > 0 ||
    diff.valueChanges.length > 0 ||
    integrationChanges > 0 ||
    variableChanges > 0 ||
    conditionChanges > 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Comparison Summary</h2>

        {!hasChanges ? (
          <div className="text-green-400 flex items-center gap-2">
            <Check className="w-5 h-5" />
            No differences found between traces
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <SummaryBadge count={diff.valueChanges.length} label="Value Changes" color="blue" />
            <SummaryBadge count={diff.optionChanges.length} label="Option Changes" color="yellow" />
            <SummaryBadge count={diff.addedFeatures.length} label="Features Added" color="green" />
            <SummaryBadge count={diff.removedFeatures.length} label="Features Removed" color="red" />
            {integrationChanges > 0 && (
              <SummaryBadge count={integrationChanges} label="Integration Changes" color="purple" />
            )}
            {variableChanges > 0 && (
              <SummaryBadge count={variableChanges} label="Variable Changes" color="cyan" />
            )}
            {conditionChanges > 0 && (
              <SummaryBadge count={conditionChanges} label="Condition Changes" color="orange" />
            )}
          </div>
        )}
      </div>

      {/* Value Changes */}
      {diff.valueChanges.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Value Changes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Baseline Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Current Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {diff.valueChanges.map((change) => (
                  <tr key={change.feature} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <code className="text-sm text-blue-400 font-mono">{change.feature}</code>
                    </td>
                    <td className="px-6 py-4">
                      {change.baselineValue ? (
                        <span className="text-sm bg-red-900/30 text-red-300 px-2 py-0.5 rounded">
                          {change.baselineValue}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {change.currentValue ? (
                        <span className="text-sm bg-green-900/30 text-green-300 px-2 py-0.5 rounded">
                          {change.currentValue}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Option Changes */}
      {diff.optionChanges.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Option Changes</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {diff.optionChanges.map((change) => (
              <div key={change.feature} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-blue-400 font-mono">{change.feature}</code>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-2">Baseline</div>
                    <div className="flex flex-wrap gap-1">
                      {change.baselineOptions.map((opt) => (
                        <span
                          key={opt}
                          className={`text-xs px-2 py-0.5 rounded ${
                            change.removedOptions.includes(opt)
                              ? 'bg-red-900/50 text-red-300 line-through'
                              : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-2">Current</div>
                    <div className="flex flex-wrap gap-1">
                      {change.currentOptions.map((opt) => (
                        <span
                          key={opt}
                          className={`text-xs px-2 py-0.5 rounded ${
                            change.addedOptions.includes(opt)
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {(change.addedOptions.length > 0 || change.removedOptions.length > 0) && (
                  <div className="mt-3 flex gap-4 text-xs">
                    {change.addedOptions.length > 0 && (
                      <span className="text-green-400">+ {change.addedOptions.join(', ')}</span>
                    )}
                    {change.removedOptions.length > 0 && (
                      <span className="text-red-400">− {change.removedOptions.join(', ')}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Added/Removed Features */}
      {(diff.addedFeatures.length > 0 || diff.removedFeatures.length > 0) && (
        <div className="grid grid-cols-2 gap-6">
          {diff.addedFeatures.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">Features Added</h3>
              <div className="space-y-1">
                {diff.addedFeatures.map((f) => (
                  <code key={f} className="block text-sm text-gray-300 font-mono">
                    {f}
                  </code>
                ))}
              </div>
            </div>
          )}
          {diff.removedFeatures.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Features Removed</h3>
              <div className="space-y-1">
                {diff.removedFeatures.map((f) => (
                  <code key={f} className="block text-sm text-gray-300 font-mono">
                    {f}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integration Output Diff */}
      <IntegrationOutputDiffSection integrationDiff={diff.integrationOutputDiff} />

      {/* Variable Diff */}
      <VariableDiffSection variableDiff={diff.variableDiff} />

      {/* Condition Diff */}
      <ConditionDiffSection conditionDiff={diff.conditionDiff} />
    </div>
  );
}
