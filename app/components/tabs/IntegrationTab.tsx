/**
 * Integration Tab - displays integration outputs and rule execution stats
 */

'use client';

import { IntegrationOutputSection } from '@/app/components/sections/IntegrationOutputSection';
import { RuleExecutionSection } from '@/app/components/sections/RuleExecutionSection';
import type { ParsedTrace } from '@/lib/trace-parser';

interface IntegrationTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}

export function IntegrationTab({ trace, searchTerm = '' }: IntegrationTabProps) {
  return (
    <div className="space-y-6">
      {/* Integration Outputs */}
      {trace.integrationOutputs && <IntegrationOutputSection integrationOutputs={trace.integrationOutputs} />}

      {/* Rule Execution Summary */}
      {trace.rulesSummary && <RuleExecutionSection rulesSummary={trace.rulesSummary} />}
    </div>
  );
}
