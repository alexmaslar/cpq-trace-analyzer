/**
 * Integration Output Diff Section - shows differences in integration outputs
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { IntegrationOutputDiff } from '@/lib/trace-parser';

interface IntegrationOutputDiffSectionProps {
  integrationDiff: IntegrationOutputDiff;
}

export function IntegrationOutputDiffSection({ integrationDiff }: IntegrationOutputDiffSectionProps) {
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const hasChanges =
    integrationDiff.addedTemplates.length > 0 ||
    integrationDiff.removedTemplates.length > 0 ||
    integrationDiff.templateDiffs.size > 0;

  if (!hasChanges) {
    return null;
  }

  const toggleTemplate = (name: string) => {
    const newSet = new Set(expandedTemplates);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedTemplates(newSet);
  };

  const templateDiffsArray = Array.from(integrationDiff.templateDiffs.values());

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Integration Output Changes</h2>
      </div>

      {/* Added/Removed Templates */}
      {(integrationDiff.addedTemplates.length > 0 || integrationDiff.removedTemplates.length > 0) && (
        <div className="px-6 py-4 border-b border-gray-800 flex gap-6">
          {integrationDiff.addedTemplates.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 uppercase">Added Templates:</span>
              <div className="flex gap-2 mt-1">
                {integrationDiff.addedTemplates.map((t) => (
                  <span key={t} className="text-sm bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {integrationDiff.removedTemplates.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 uppercase">Removed Templates:</span>
              <div className="flex gap-2 mt-1">
                {integrationDiff.removedTemplates.map((t) => (
                  <span key={t} className="text-sm bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Diffs */}
      <div className="divide-y divide-gray-800">
        {templateDiffsArray.map((templateDiff) => (
          <div key={templateDiff.templateName}>
            <button
              onClick={() => toggleTemplate(templateDiff.templateName)}
              className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-purple-400">{templateDiff.templateName}</span>
                <span className="text-xs text-gray-500">
                  {templateDiff.addedRows.length > 0 && (
                    <span className="text-green-400">+{templateDiff.addedRows.length} </span>
                  )}
                  {templateDiff.removedRows.length > 0 && (
                    <span className="text-red-400">-{templateDiff.removedRows.length} </span>
                  )}
                  {templateDiff.changedRows.length > 0 && (
                    <span className="text-yellow-400">~{templateDiff.changedRows.length} </span>
                  )}
                  rows
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedTemplates.has(templateDiff.templateName) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedTemplates.has(templateDiff.templateName) && (
              <div className="px-6 pb-4 space-y-4">
                {/* Changed Rows */}
                {templateDiff.changedRows.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-yellow-400 uppercase mb-2">Changed Rows</h4>
                    <div className="space-y-3">
                      {templateDiff.changedRows.map((change) => (
                        <div key={change.id} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-2">Row ID: {change.id}</div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-gray-500">
                                <th className="pb-1">Property</th>
                                <th className="pb-1">Baseline</th>
                                <th className="pb-1">Current</th>
                              </tr>
                            </thead>
                            <tbody>
                              {change.changedProperties.map((prop) => (
                                <tr key={prop.property} className="border-t border-gray-700">
                                  <td className="py-1 text-gray-400">{prop.property}</td>
                                  <td className="py-1">
                                    <span className="bg-red-900/30 text-red-300 px-1 rounded text-xs">
                                      {prop.baselineValue === null ? '—' : String(prop.baselineValue)}
                                    </span>
                                  </td>
                                  <td className="py-1">
                                    <span className="bg-green-900/30 text-green-300 px-1 rounded text-xs">
                                      {prop.currentValue === null ? '—' : String(prop.currentValue)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Added Rows */}
                {templateDiff.addedRows.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-400 uppercase mb-2">
                      Added Rows ({templateDiff.addedRows.length})
                    </h4>
                    <div className="text-xs text-gray-400">
                      Row IDs: {templateDiff.addedRows.map((r) => r.id).join(', ')}
                    </div>
                  </div>
                )}

                {/* Removed Rows */}
                {templateDiff.removedRows.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">
                      Removed Rows ({templateDiff.removedRows.length})
                    </h4>
                    <div className="text-xs text-gray-400">
                      Row IDs: {templateDiff.removedRows.map((r) => r.id).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
