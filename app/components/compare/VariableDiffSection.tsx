/**
 * Variable Diff Section - shows differences in variable values
 */

'use client';

import type { VariableDiff } from '@/lib/trace-parser';

interface VariableDiffSectionProps {
  variableDiff: VariableDiff;
}

export function VariableDiffSection({ variableDiff }: VariableDiffSectionProps) {
  if (variableDiff.totalChanges === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Variable Changes</h2>
          <span className="text-sm text-gray-400">
            {variableDiff.changedVariables.length} changed • {variableDiff.addedVariables.length} added •{' '}
            {variableDiff.removedVariables.length} removed
          </span>
        </div>
      </div>

      {/* Changed Variables */}
      {variableDiff.changedVariables.length > 0 && (
        <div className="border-b border-gray-800">
          <div className="px-6 py-3 bg-gray-800/30">
            <h3 className="text-sm font-medium text-yellow-400">Changed Variables</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Variable
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
                {variableDiff.changedVariables.map((change) => (
                  <tr key={change.variableName} className="hover:bg-gray-800/30">
                    <td className="px-6 py-3">
                      <code className="text-sm text-cyan-400 font-mono">{change.variableName}</code>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm bg-red-900/30 text-red-300 px-2 py-0.5 rounded font-mono">
                        {change.baselineFinalValue === null
                          ? '—'
                          : change.baselineFinalValue.length > 40
                            ? change.baselineFinalValue.slice(0, 40) + '...'
                            : change.baselineFinalValue}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm bg-green-900/30 text-green-300 px-2 py-0.5 rounded font-mono">
                        {change.currentFinalValue === null
                          ? '—'
                          : change.currentFinalValue.length > 40
                            ? change.currentFinalValue.slice(0, 40) + '...'
                            : change.currentFinalValue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Added/Removed Variables */}
      {(variableDiff.addedVariables.length > 0 || variableDiff.removedVariables.length > 0) && (
        <div className="px-6 py-4 grid grid-cols-2 gap-6">
          {variableDiff.addedVariables.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-400 uppercase mb-2">
                Added ({variableDiff.addedVariables.length})
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {variableDiff.addedVariables.slice(0, 20).map((name) => (
                  <code key={name} className="block text-sm text-gray-300 font-mono">
                    {name}
                  </code>
                ))}
                {variableDiff.addedVariables.length > 20 && (
                  <span className="text-xs text-gray-500">+{variableDiff.addedVariables.length - 20} more</span>
                )}
              </div>
            </div>
          )}
          {variableDiff.removedVariables.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">
                Removed ({variableDiff.removedVariables.length})
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {variableDiff.removedVariables.slice(0, 20).map((name) => (
                  <code key={name} className="block text-sm text-gray-300 font-mono">
                    {name}
                  </code>
                ))}
                {variableDiff.removedVariables.length > 20 && (
                  <span className="text-xs text-gray-500">+{variableDiff.removedVariables.length - 20} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
