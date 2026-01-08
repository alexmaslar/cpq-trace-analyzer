/**
 * Rule Execution Summary section
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RuleSummaryCard } from '@/app/components/shared/RuleSummaryCard';
import type { RuleExecutionSummary } from '@/lib/trace-parser';

interface RuleExecutionSectionProps {
  rulesSummary: RuleExecutionSummary;
}

export function RuleExecutionSection({ rulesSummary }: RuleExecutionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const rulesetsArray = Array.from(rulesSummary.rulesets.values())
    .sort((a, b) => b.executionCount - a.executionCount);

  const ruleTypeArray = Array.from(rulesSummary.ruleTypeBreakdown.entries())
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Rule Execution Summary</h2>
          <span className="text-sm text-gray-400">
            {rulesSummary.totalExecutions.toLocaleString()} executions • {rulesSummary.uniqueRules.toLocaleString()} unique rules • {rulesetsArray.length} rulesets
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-800">
            <RuleSummaryCard label="Total Executions" value={rulesSummary.totalExecutions} />
            <RuleSummaryCard label="Unique Rules" value={rulesSummary.uniqueRules} />
            <RuleSummaryCard label="Rulesets" value={rulesetsArray.length} />
            <RuleSummaryCard
              label="Conditions"
              value={rulesSummary.ruleTypeBreakdown.get('ConditionRule') || 0}
            />
          </div>

          {/* Rule Type Breakdown */}
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Rule Types
            </h3>
            <div className="flex flex-wrap gap-3">
              {ruleTypeArray.map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 bg-gray-800 rounded px-3 py-1.5">
                  <span className="text-sm text-gray-300">{type.replace('Rule', '')}</span>
                  <span className="text-sm text-gray-500">{count.toLocaleString()}</span>
                  <span className="text-xs text-gray-600">
                    ({Math.round((count / rulesSummary.totalExecutions) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rules Table */}
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Top Rules (Performance Hotspots)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-2">Rule</th>
                    <th className="pb-2">Ruleset</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rulesSummary.topRules.slice(0, 10).map((rule, i) => (
                    <tr key={`${rule.ruleset}:${rule.ruleId}`} className="border-t border-gray-800">
                      <td className="py-2">
                        <code className="text-blue-400 font-mono text-xs">{rule.ruleName}</code>
                      </td>
                      <td className="py-2 text-gray-400 text-xs max-w-xs truncate" title={rule.ruleset}>
                        {rule.ruleset.split('.').slice(0, 2).join('.')}...
                      </td>
                      <td className="py-2">
                        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                          {rule.ruleType.replace('Rule', '')}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <span className={`font-mono ${rule.executionCount > 50 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {rule.executionCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rulesets Table */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Ruleset Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-2">Ruleset</th>
                    <th className="pb-2">Namespace</th>
                    <th className="pb-2 text-right">Executions</th>
                    <th className="pb-2 text-right">Rules</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rulesetsArray.slice(0, 15).map((rs) => (
                    <tr key={rs.name} className="border-t border-gray-800">
                      <td className="py-2">
                        <code className="text-gray-300 font-mono text-xs" title={rs.name}>
                          {rs.name.length > 40 ? rs.name.slice(0, 40) + '...' : rs.name}
                        </code>
                      </td>
                      <td className="py-2">
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                          {rs.namespace}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-300 font-mono">
                        {rs.executionCount.toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-gray-400 font-mono">
                        {rs.rules.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rulesetsArray.length > 15 && (
                <p className="text-xs text-gray-500 mt-2">
                  + {rulesetsArray.length - 15} more rulesets
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
