/**
 * Variable Tracking section with detailed assignment history
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LineNumber } from '@/app/components/shared/LineNumber';
import { RuleSummaryCard } from '@/app/components/shared/RuleSummaryCard';
import type { VariableTrackingSummary, VariableSummary } from '@/lib/trace-parser';

interface VariableTrackingSectionProps {
  variableTracking: VariableTrackingSummary;
  searchTerm?: string;
}

interface VariableRowProps {
  variable: VariableSummary;
  isExpanded: boolean;
  onToggle: () => void;
}

function VariableRow({ variable, isExpanded, onToggle }: VariableRowProps) {
  return (
    <>
      <tr
        className="hover:bg-gray-800/30 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            <code className="text-sm text-cyan-400 font-mono">{variable.name}</code>
            {variable.hasChanges && (
              <span className="text-xs bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded">
                changed
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-3">
          {variable.finalValue !== null ? (
            <span className="text-sm bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono max-w-xs truncate block">
              {variable.finalValue.length > 40 ? variable.finalValue.slice(0, 40) + '...' : variable.finalValue}
            </span>
          ) : (
            <span className="text-sm text-gray-500">—</span>
          )}
        </td>
        <td className="px-6 py-3 text-sm text-gray-400 font-mono">{variable.assignmentCount}</td>
        <td className="px-6 py-3 text-sm text-gray-400 font-mono">{variable.firstAssignmentLine.toLocaleString()}</td>
        <td className="px-6 py-3 text-sm text-gray-400 font-mono">{variable.lastAssignmentLine.toLocaleString()}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-gray-800/30">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-700">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Line</th>
                    <th className="pb-2 pr-4">Expression</th>
                    <th className="pb-2 pr-4">Previous</th>
                    <th className="pb-2 pr-4">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {variable.assignments.map((assignment, idx) => {
                    const valueChanged = assignment.previousValue !== null &&
                      assignment.resultValue !== null &&
                      assignment.previousValue !== assignment.resultValue &&
                      assignment.previousValue !== '(unassigned)';
                    return (
                      <tr key={`${assignment.lineNumber}-${idx}`} className="border-t border-gray-700/50">
                        <td className="py-2 pr-4 text-gray-500">{idx + 1}</td>
                        <td className="py-2 pr-4 font-mono text-gray-400"><LineNumber line={assignment.lineNumber} /></td>
                        <td className="py-2 pr-4">
                          <code className="text-blue-400 text-xs break-all max-w-xs block">
                            {assignment.assignmentExpression.length > 60
                              ? assignment.assignmentExpression.slice(0, 60) + '...'
                              : assignment.assignmentExpression || '—'}
                          </code>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs font-mono ${assignment.previousValue === '(unassigned)' ? 'text-gray-500 italic' : 'text-gray-300'}`}>
                            {assignment.previousValue === null ? '—' :
                              assignment.previousValue.length > 30
                                ? assignment.previousValue.slice(0, 30) + '...'
                                : assignment.previousValue}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            valueChanged
                              ? 'bg-green-900/50 text-green-400'
                              : 'text-gray-300'
                          }`}>
                            {assignment.resultValue === null ? '—' :
                              assignment.resultValue.length > 30
                                ? assignment.resultValue.slice(0, 30) + '...'
                                : assignment.resultValue}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function VariableTrackingSection({ variableTracking, searchTerm = '' }: VariableTrackingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [filterHasChanges, setFilterHasChanges] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());
  const [prevSearchTerm, setPrevSearchTerm] = useState('');
  const pageSize = 50;

  // Use global search or local search
  const effectiveSearch = searchTerm || localSearch;

  // Memoize variables array and filtering
  const variablesArray = useMemo(() =>
    Array.from(variableTracking.variables.values()),
    [variableTracking.variables]
  );

  // Filter variables - memoized
  const filteredVariables = useMemo(() => {
    return variablesArray.filter(v => {
      if (effectiveSearch) {
        const term = effectiveSearch.toLowerCase();
        if (!v.name.toLowerCase().includes(term)) {
          // Check final value only (cheaper than checking all assignments)
          if (!String(v.finalValue || '').toLowerCase().includes(term)) {
            return false;
          }
        }
      }
      if (filterHasChanges && !v.hasChanges) {
        return false;
      }
      return true;
    });
  }, [variablesArray, effectiveSearch, filterHasChanges]);

  // Auto-expand only if there are matches, reset page when global search changes
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    if (searchTerm && filteredVariables.length > 0) {
      setIsExpanded(true);
    }
    setCurrentPage(1);
  }

  // Pagination
  const totalPages = Math.ceil(filteredVariables.length / pageSize);
  const paginatedVariables = filteredVariables.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  const handleLocalSearchChange = (value: string) => {
    setLocalSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (checked: boolean) => {
    setFilterHasChanges(checked);
    setCurrentPage(1);
  };

  const toggleVariable = (name: string) => {
    const newSet = new Set(expandedVariables);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedVariables(newSet);
  };

  if (variableTracking.totalAssignments === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Variable Tracking</h2>
          <span className="text-sm text-gray-400">
            {variableTracking.totalAssignments.toLocaleString()} assignments • {variableTracking.uniqueVariables.toLocaleString()} variables
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-800">
            <RuleSummaryCard label="Total Assignments" value={variableTracking.totalAssignments} />
            <RuleSummaryCard label="Unique Variables" value={variableTracking.uniqueVariables} />
            <RuleSummaryCard
              label="Avg per Variable"
              value={Math.round((variableTracking.totalAssignments / variableTracking.uniqueVariables) * 10) / 10}
            />
            <RuleSummaryCard
              label="With Changes"
              value={variablesArray.filter(v => v.hasChanges).length}
            />
          </div>

          {/* Search and Filter */}
          <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap gap-4 items-center">
            {!searchTerm && (
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search variables..."
                  value={localSearch}
                  onChange={(e) => handleLocalSearchChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            {searchTerm && (
              <span className="text-sm text-blue-400">Filtered by: &quot;{searchTerm}&quot;</span>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHasChanges}
                onChange={(e) => handleFilterChange(e.target.checked)}
                className="rounded bg-gray-800 border-gray-600"
              />
              Only show variables with value changes
            </label>
            <span className="text-sm text-gray-500">
              Showing {paginatedVariables.length} of {filteredVariables.length}
            </span>
          </div>

          {/* Variables Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Final Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assignments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">First Line</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedVariables.map((variable) => (
                  <VariableRow
                    key={variable.name}
                    variable={variable}
                    isExpanded={expandedVariables.has(variable.name)}
                    onToggle={() => toggleVariable(variable.name)}
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
