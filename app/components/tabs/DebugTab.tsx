/**
 * Debug Tab - displays variables, conditions, and execution timeline
 */

'use client';

import { VariableTrackingSection } from '@/app/components/sections/VariableTrackingSection';
import { ConditionTracingSection } from '@/app/components/sections/ConditionTracingSection';
import { TimelineSection } from '@/app/components/sections/TimelineSection';
import type { ParsedTrace } from '@/lib/trace-parser';

interface DebugTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}

export function DebugTab({ trace, searchTerm = '' }: DebugTabProps) {
  return (
    <div className="space-y-6">
      {/* Variable Tracking */}
      {trace.variableTracking && (
        <VariableTrackingSection variableTracking={trace.variableTracking} searchTerm={searchTerm} />
      )}

      {/* Condition Tracing */}
      {trace.conditionTracking && (
        <ConditionTracingSection conditionTracking={trace.conditionTracking} searchTerm={searchTerm} />
      )}

      {/* Execution Flow Timeline */}
      {trace.timeline && <TimelineSection timeline={trace.timeline} searchTerm={searchTerm} />}
    </div>
  );
}
