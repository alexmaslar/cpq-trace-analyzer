/**
 * Condition Tracing section with expression breakdown
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check, X as XIcon } from 'lucide-react';
import { LineNumber } from '@/app/components/shared/LineNumber';
import { RuleSummaryCard } from '@/app/components/shared/RuleSummaryCard';
import { ExpressionTree } from '@/app/components/shared/ExpressionTree';
import { parseExpression, type ParsedExpression } from '@/lib/expression-parser';
import type { ConditionSummary, ConditionEvaluation } from '@/lib/trace-parser';

interface ConditionTracingSectionProps {
  conditionTracking: ConditionSummary;
  searchTerm?: string;
}

interface ConditionRowProps {
  condition: ConditionEvaluation;
  isExpanded: boolean;
  onToggle: () => void;
}

function ConditionRow({ condition, isExpanded, onToggle }: ConditionRowProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [parsedExpr, setParsedExpr] = useState<ParsedExpression | null>(null);

  const handleShowBreakdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parsedExpr) {
      setParsedExpr(parseExpression(condition.expression));
    }
    setShowBreakdown(!showBreakdown);
  };

  return (
    <>
      <tr
        className="hover:bg-gray-800/30 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-6 py-3">
          {condition.result ? (
            <span className="inline-flex items-center gap-1 text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-xs">True</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-400">
              <XIcon className="w-4 h-4" />
              <span className="text-xs">False</span>
            </span>
          )}
        </td>
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
            <code className="text-sm text-blue-400 font-mono truncate max-w-xs" title={condition.ruleName}>
              {condition.ruleName.length > 50 ? condition.ruleName.slice(0, 50) + '...' : condition.ruleName}
            </code>
          </div>
        </td>
        <td className="px-6 py-3">
          <code className="text-xs text-gray-300 font-mono truncate max-w-md block" title={condition.expression}>
            {condition.expression.length > 60 ? condition.expression.slice(0, 60) + '...' : condition.expression}
          </code>
        </td>
        <td className="px-6 py-3">
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
            {condition.ruleType.replace('Rule', '')}
          </span>
        </td>
        <td className="px-6 py-3 text-sm text-gray-400 font-mono"><LineNumber line={condition.lineNumber} /></td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-gray-800/30">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 uppercase">Ruleset:</span>
                <code className="ml-2 text-xs text-gray-400 font-mono">{condition.ruleset}</code>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Expression:</span>
                <code className="ml-2 text-sm text-blue-400 font-mono break-all">{condition.expression}</code>
              </div>
              {condition.trace && (
                <div>
                  <span className="text-xs text-gray-500 uppercase">Evaluated:</span>
                  <code className="ml-2 text-sm text-emerald-400 font-mono break-all">{condition.trace}</code>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 uppercase">Result:</span>
                <span className={`ml-2 text-sm font-medium ${condition.result ? 'text-green-400' : 'text-red-400'}`}>
                  {condition.result ? 'True (Rule Fired)' : 'False (Rule Skipped)'}
                </span>
              </div>

              {/* Expression Breakdown */}
              <div className="pt-2 border-t border-gray-700">
                <button
                  onClick={handleShowBreakdown}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
                  {showBreakdown ? 'Hide' : 'Show'} Expression Breakdown
                </button>

                {showBreakdown && parsedExpr && (
                  <div className="mt-3 p-3 bg-gray-900/70 rounded-lg border border-gray-700">
                    {parsedExpr.isValid && parsedExpr.root ? (
                      <ExpressionTree node={parsedExpr.root} depth={0} />
                    ) : (
                      <div className="text-xs text-red-400">
                        Parse error: {parsedExpr.error || 'Unable to parse expression'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ConditionTracingSection({ conditionTracking, searchTerm = '' }: ConditionTracingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'fired' | 'skipped'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedConditions, setExpandedConditions] = useState<Set<number>>(new Set());
  const [prevSearchTerm, setPrevSearchTerm] = useState('');
  const pageSize = 50;

  // Use global search or local search
  const effectiveSearch = searchTerm || localSearch;

  // Filter conditions - memoized
  const filteredConditions = useMemo(() => {
    return conditionTracking.conditions.filter(c => {
      // Filter by result
      if (filterResult === 'fired' && !c.result) return false;
      if (filterResult === 'skipped' && c.result) return false;

      // Search by rule name or expression (skip trace - too expensive)
      if (effectiveSearch) {
        const term = effectiveSearch.toLowerCase();
        return c.ruleName.toLowerCase().includes(term) ||
               c.expression.toLowerCase().includes(term);
      }
      return true;
    });
  }, [conditionTracking.conditions, effectiveSearch, filterResult]);

  // Auto-expand only if there are matches
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    if (searchTerm && filteredConditions.length > 0) {
      setIsExpanded(true);
    }
    setCurrentPage(1);
  }

  // Pagination
  const totalPages = Math.ceil(filteredConditions.length / pageSize);
  const paginatedConditions = filteredConditions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  const handleLocalSearchChange = (value: string) => {
    setLocalSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: 'all' | 'fired' | 'skipped') => {
    setFilterResult(value);
    setCurrentPage(1);
  };

  const toggleCondition = (lineNumber: number) => {
    const newSet = new Set(expandedConditions);
    if (newSet.has(lineNumber)) {
      newSet.delete(lineNumber);
    } else {
      newSet.add(lineNumber);
    }
    setExpandedConditions(newSet);
  };

  if (conditionTracking.totalConditions === 0) {
    return null;
  }

  const skipRate = conditionTracking.totalConditions > 0
    ? Math.round((conditionTracking.skippedCount / conditionTracking.totalConditions) * 1000) / 10
    : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Condition Tracing</h2>
          <span className="text-sm text-gray-400">
            {conditionTracking.totalConditions.toLocaleString()} conditions • {conditionTracking.firedCount.toLocaleString()} fired • {conditionTracking.skippedCount.toLocaleString()} skipped
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-800">
            <RuleSummaryCard label="Total Conditions" value={conditionTracking.totalConditions} />
            <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{conditionTracking.firedCount.toLocaleString()}</div>
              <div className="text-xs text-green-500 uppercase tracking-wider mt-1">Fired (True)</div>
            </div>
            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{conditionTracking.skippedCount.toLocaleString()}</div>
              <div className="text-xs text-red-500 uppercase tracking-wider mt-1">Skipped (False)</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{skipRate}%</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Skip Rate</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap gap-4 items-center">
            {!searchTerm && (
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by rule name or expression..."
                  value={localSearch}
                  onChange={(e) => handleLocalSearchChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            {searchTerm && (
              <span className="text-sm text-blue-400">Filtered by: &quot;{searchTerm}&quot;</span>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterResult === 'all'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('fired')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterResult === 'fired'
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Fired Only
              </button>
              <button
                onClick={() => handleFilterChange('skipped')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterResult === 'skipped'
                    ? 'bg-red-900/50 text-red-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Skipped Only
              </button>
            </div>
            <span className="text-sm text-gray-500">
              Showing {paginatedConditions.length} of {filteredConditions.length}
            </span>
          </div>

          {/* Conditions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rule Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expression</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedConditions.map((condition, idx) => (
                  <ConditionRow
                    key={`${condition.lineNumber}-${idx}`}
                    condition={condition}
                    isExpanded={expandedConditions.has(condition.lineNumber)}
                    onToggle={() => toggleCondition(condition.lineNumber)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
