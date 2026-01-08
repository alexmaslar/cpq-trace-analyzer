/**
 * Behavioral Issue Card - displays a single behavioral issue from regression testing
 */

'use client';

import { AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { useTraceViewer } from '@/app/hooks/useTraceViewer';
import type { BehavioralIssue } from '@/lib/trace-parser';

interface BehavioralIssueCardProps {
  issue: BehavioralIssue;
}

const severityStyles = {
  error: 'bg-red-900/30 border-red-700 text-red-400',
  warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
  info: 'bg-blue-900/30 border-blue-700 text-blue-400',
};

const severityIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const issueTypeLabels = {
  options_changed: 'Options Changed',
  integration_changed: 'Integration Output Changed',
  condition_changed: 'Condition Result Changed',
  feature_missing: 'Feature Missing',
  feature_added: 'New Feature',
};

export function BehavioralIssueCard({ issue }: BehavioralIssueCardProps) {
  const { showLine } = useTraceViewer();
  const SeverityIcon = severityIcons[issue.severity];

  return (
    <div className={`p-4 rounded-lg border ${severityStyles[issue.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <SeverityIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{issueTypeLabels[issue.type]}</span>
            <span className="text-gray-400">|</span>
            <span className="font-mono text-sm">{issue.featureName}</span>
            {issue.selection && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-400">Selection: "{issue.selection}"</span>
              </>
            )}
          </div>

          {issue.details && <p className="text-sm text-gray-400 mt-1">{issue.details}</p>}

          {/* Show value comparison for relevant issue types */}
          {(issue.type === 'options_changed' || issue.type === 'integration_changed') && (
            <div className="mt-2 text-sm space-y-1">
              <div className="flex gap-2">
                <span className="text-gray-500 w-20">Expected:</span>
                <span className="text-gray-300 font-mono">
                  {Array.isArray(issue.baseline.value)
                    ? issue.baseline.value.join(', ')
                    : String(issue.baseline.value)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-20">Actual:</span>
                <span className="text-gray-300 font-mono">
                  {Array.isArray(issue.test.value) ? issue.test.value.join(', ') : String(issue.test.value)}
                </span>
              </div>
            </div>
          )}

          {issue.lineNumber > 0 && (
            <button
              onClick={() => showLine(issue.lineNumber)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View in trace (L{issue.lineNumber})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
