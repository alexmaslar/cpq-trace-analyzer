/**
 * Condition Diff Section - shows differences in condition evaluations
 */

'use client';

import { Check, X as XIcon } from 'lucide-react';
import type { ConditionDiff } from '@/lib/trace-parser';

interface ConditionDiffSectionProps {
  conditionDiff: ConditionDiff;
}

export function ConditionDiffSection({ conditionDiff }: ConditionDiffSectionProps) {
  if (conditionDiff.totalChanges === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Condition Changes</h2>
          <span className="text-sm text-gray-400">
            {conditionDiff.changedConditions.length} changed • {conditionDiff.addedConditions.length} added •{' '}
            {conditionDiff.removedConditions.length} removed
          </span>
        </div>
      </div>

      {/* Changed Conditions - Most important: rules that now fire/skip differently */}
      {conditionDiff.changedConditions.length > 0 && (
        <div className="border-b border-gray-800">
          <div className="px-6 py-3 bg-orange-900/20">
            <h3 className="text-sm font-medium text-orange-400">Result Changed (Now Fires/Skips Differently)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Expression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Baseline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Current
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {conditionDiff.changedConditions.map((change, idx) => (
                  <tr key={`${change.ruleId}-${idx}`} className="hover:bg-gray-800/30">
                    <td className="px-6 py-3">
                      <code
                        className="text-sm text-blue-400 font-mono truncate max-w-xs block"
                        title={change.ruleName}
                      >
                        {change.ruleName.length > 40 ? change.ruleName.slice(0, 40) + '...' : change.ruleName}
                      </code>
                    </td>
                    <td className="px-6 py-3">
                      <code
                        className="text-xs text-gray-400 font-mono truncate max-w-md block"
                        title={change.expression}
                      >
                        {change.expression.length > 50 ? change.expression.slice(0, 50) + '...' : change.expression}
                      </code>
                    </td>
                    <td className="px-6 py-3">
                      {change.baselineResult ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <Check className="w-3 h-3" />
                          Fired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                          <XIcon className="w-3 h-3" />
                          Skipped
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {change.currentResult ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <Check className="w-3 h-3" />
                          Fired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                          <XIcon className="w-3 h-3" />
                          Skipped
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Added/Removed Conditions */}
      {(conditionDiff.addedConditions.length > 0 || conditionDiff.removedConditions.length > 0) && (
        <div className="px-6 py-4 grid grid-cols-2 gap-6">
          {conditionDiff.addedConditions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-400 uppercase mb-2">
                Added ({conditionDiff.addedConditions.length})
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {conditionDiff.addedConditions.slice(0, 20).map((cond, idx) => (
                  <code key={`${cond.ruleId}-${idx}`} className="block text-sm text-gray-300 font-mono">
                    {cond.ruleName}
                  </code>
                ))}
                {conditionDiff.addedConditions.length > 20 && (
                  <span className="text-xs text-gray-500">+{conditionDiff.addedConditions.length - 20} more</span>
                )}
              </div>
            </div>
          )}
          {conditionDiff.removedConditions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">
                Removed ({conditionDiff.removedConditions.length})
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {conditionDiff.removedConditions.slice(0, 20).map((cond, idx) => (
                  <code key={`${cond.ruleId}-${idx}`} className="block text-sm text-gray-300 font-mono">
                    {cond.ruleName}
                  </code>
                ))}
                {conditionDiff.removedConditions.length > 20 && (
                  <span className="text-xs text-gray-500">+{conditionDiff.removedConditions.length - 20} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
