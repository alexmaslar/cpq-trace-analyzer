/**
 * Issues section with severity filtering
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import type { IssuesSummary, DetectedIssue, IssueSeverity } from '@/lib/trace-parser';

interface IssuesSectionProps {
  issues: IssuesSummary;
}

function getSeverityIcon(severity: IssueSeverity) {
  switch (severity) {
    case 'error':
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getSeverityBg(severity: IssueSeverity) {
  switch (severity) {
    case 'error': return 'bg-red-900/20 border-red-900/50';
    case 'warning': return 'bg-yellow-900/20 border-yellow-900/50';
    case 'info': return 'bg-blue-900/20 border-blue-900/50';
  }
}

interface IssueCardProps {
  issue: DetectedIssue;
}

function IssueCard({ issue }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`px-6 py-4 hover:bg-black/20 cursor-pointer transition-colors ${getSeverityBg(issue.severity)}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(issue.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{issue.title}</span>
            <span className="text-xs text-gray-500 uppercase">{issue.category}</span>
            {issue.lineNumber > 0 && (
              <span className="text-xs text-gray-500 font-mono">L:{issue.lineNumber}</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{issue.description}</p>

          {isExpanded && issue.context && (
            <div className="mt-3 p-3 bg-gray-900/50 rounded-lg text-xs space-y-1">
              {issue.context.ruleName && (
                <div>
                  <span className="text-gray-500">Rule: </span>
                  <code className="text-blue-400 font-mono">{issue.context.ruleName}</code>
                </div>
              )}
              {issue.context.ruleset && (
                <div>
                  <span className="text-gray-500">Ruleset: </span>
                  <code className="text-gray-300 font-mono">{issue.context.ruleset}</code>
                </div>
              )}
              {issue.context.variableName && (
                <div>
                  <span className="text-gray-500">Variable: </span>
                  <code className="text-purple-400 font-mono">{issue.context.variableName}</code>
                </div>
              )}
              {issue.context.expression && (
                <div>
                  <span className="text-gray-500">Expression: </span>
                  <code className="text-emerald-400 font-mono break-all">{issue.context.expression}</code>
                </div>
              )}
              {issue.context.count !== undefined && (
                <div>
                  <span className="text-gray-500">Count: </span>
                  <span className="text-white font-medium">{issue.context.count}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>
    </div>
  );
}

export function IssuesSection({ issues }: IssuesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all'>('all');

  const totalIssues = issues.issues.length;

  if (totalIssues === 0) {
    return null;
  }

  const filteredIssues = severityFilter === 'all'
    ? issues.issues
    : issues.issues.filter(i => i.severity === severityFilter);

  return (
    <div className={`border rounded-xl overflow-hidden ${
      issues.errorCount > 0 ? 'bg-red-950/30 border-red-900/50' :
      issues.warningCount > 0 ? 'bg-yellow-950/30 border-yellow-900/50' :
      'bg-blue-950/30 border-blue-900/50'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-white">Issues Detected</h2>
          <div className="flex items-center gap-2 text-sm">
            {issues.errorCount > 0 && (
              <span className="bg-red-900/50 text-red-400 px-2 py-0.5 rounded">{issues.errorCount} errors</span>
            )}
            {issues.warningCount > 0 && (
              <span className="bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">{issues.warningCount} warnings</span>
            )}
            {issues.infoCount > 0 && (
              <span className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">{issues.infoCount} info</span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Filter Buttons */}
          <div className="px-6 py-3 border-b border-gray-800 flex gap-2">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                severityFilter === 'all'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All ({totalIssues})
            </button>
            {issues.errorCount > 0 && (
              <button
                onClick={() => setSeverityFilter('error')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  severityFilter === 'error'
                    ? 'bg-red-900/50 text-red-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Errors ({issues.errorCount})
              </button>
            )}
            {issues.warningCount > 0 && (
              <button
                onClick={() => setSeverityFilter('warning')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  severityFilter === 'warning'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Warnings ({issues.warningCount})
              </button>
            )}
            {issues.infoCount > 0 && (
              <button
                onClick={() => setSeverityFilter('info')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  severityFilter === 'info'
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Info ({issues.infoCount})
              </button>
            )}
          </div>

          {/* Issue List */}
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
