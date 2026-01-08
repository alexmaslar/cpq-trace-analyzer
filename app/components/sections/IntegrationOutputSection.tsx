/**
 * Integration Outputs section
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { IntegrationOutputSummary } from '@/lib/trace-parser';

interface IntegrationOutputSectionProps {
  integrationOutputs: IntegrationOutputSummary;
}

export function IntegrationOutputSection({ integrationOutputs }: IntegrationOutputSectionProps) {
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  const templatesArray = Array.from(integrationOutputs.templates.values());

  if (templatesArray.length === 0) {
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Integration Outputs</h2>
          <span className="text-sm text-gray-400">
            {integrationOutputs.totalRows.toLocaleString()} rows • {templatesArray.length} templates
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {templatesArray.map((template) => (
          <div key={template.name}>
            <button
              onClick={() => toggleTemplate(template.name)}
              className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-400">{template.name}</span>
                <span className="text-xs text-gray-500">
                  {template.rows.length} rows • {template.columns.length} columns
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedTemplates.has(template.name) ? 'rotate-180' : ''}`} />
            </button>

            {expandedTemplates.has(template.name) && (
              <div className="px-6 pb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-800">
                      {template.columns
                        .filter(col => col !== 'IntegrationOutputID')
                        .map((col) => (
                          <th key={col} className="pb-2 pr-4 whitespace-nowrap">{col}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {template.rows.map((row, idx) => (
                      <tr key={`${row.id}-${idx}`} className="border-t border-gray-800/50 hover:bg-gray-800/20">
                        {template.columns
                          .filter(col => col !== 'IntegrationOutputID')
                          .map((col) => {
                            const value = row.properties.get(col);
                            return (
                              <td key={col} className="py-2 pr-4">
                                {value === null || value === undefined ? (
                                  <span className="text-gray-600">—</span>
                                ) : typeof value === 'number' ? (
                                  <span className="font-mono text-emerald-400">{value}</span>
                                ) : value === '' ? (
                                  <span className="text-gray-600">""</span>
                                ) : (
                                  <span className="text-gray-300 break-words max-w-xs block">
                                    {String(value).length > 50 ? String(value).slice(0, 50) + '...' : String(value)}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
