/**
 * Regression Results View - shows regression test results with behavioral issues
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Check } from 'lucide-react';
import { BehavioralIssueCard } from './BehavioralIssueCard';
import type { RegressionResult } from '@/lib/trace-parser';

interface RegressionResultsViewProps {
  result: RegressionResult;
}

export function RegressionResultsView({ result }: RegressionResultsViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDivergent, setShowDivergent] = useState(false);

  const hasIssues = result.summary.behavioralIssuesFound > 0;
  const headerColor = hasIssues ? 'border-red-600 bg-red-900/20' : 'border-green-600 bg-green-900/20';
  const StatusIcon = hasIssues ? AlertTriangle : CheckCircle;
  const statusColorClass = hasIssues ? 'text-red-400' : 'text-green-400';

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden ${headerColor}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${statusColorClass}`} />
          <div>
            <h2 className="text-lg font-semibold text-white">Regression Test Results</h2>
            <p className="text-sm text-gray-400">
              Compared against: "{result.matchedBaselineName}" ({result.matchScore}% match)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {result.summary.errors > 0 && (
              <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-sm font-medium">
                {result.summary.errors} error{result.summary.errors !== 1 ? 's' : ''}
              </span>
            )}
            {result.summary.warnings > 0 && (
              <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded text-sm font-medium">
                {result.summary.warnings} warning{result.summary.warnings !== 1 ? 's' : ''}
              </span>
            )}
            {result.summary.infos > 0 && (
              <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-sm font-medium">
                {result.summary.infos} info
              </span>
            )}
            {!hasIssues && result.summary.infos === 0 && (
              <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-sm font-medium">
                No issues
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-800">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{result.summary.totalFeaturesCompared}</div>
              <div className="text-xs text-gray-500">Features Compared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{result.matchingSelections.length}</div>
              <div className="text-xs text-gray-500">Matching Selections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.divergentSelections.length}</div>
              <div className="text-xs text-gray-500">Different Choices</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${hasIssues ? 'text-red-400' : 'text-green-400'}`}>
                {result.summary.behavioralIssuesFound}
              </div>
              <div className="text-xs text-gray-500">Behavioral Issues</div>
            </div>
          </div>

          {/* Behavioral Issues */}
          {result.issues.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Issues Found</h3>
              {result.issues.map((issue, idx) => (
                <BehavioralIssueCard key={idx} issue={issue} />
              ))}
            </div>
          )}

          {/* Divergent Selections (Collapsed by default) */}
          {result.divergentSelections.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowDivergent(!showDivergent)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${showDivergent ? 'rotate-90' : ''}`}
                />
                {result.divergentSelections.length} features where you chose differently (expected)
              </button>
              {showDivergent && (
                <div className="mt-2 pl-6 space-y-1">
                  {result.divergentSelections.map((sel, idx) => (
                    <div key={idx} className="text-sm text-gray-500 flex gap-2">
                      <span className="text-gray-400">{sel.featureName}:</span>
                      <span className="text-red-400/70 line-through">{sel.baselineValue || 'null'}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-green-400/70">{sel.testValue || 'null'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {!hasIssues && result.matchingSelections.length > 0 && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  {result.matchingSelections.length} features with matching selections - no behavioral issues detected
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
