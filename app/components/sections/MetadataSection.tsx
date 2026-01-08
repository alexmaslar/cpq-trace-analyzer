/**
 * Configuration metadata section
 */

'use client';

import { MetadataItem } from '@/app/components/shared/MetadataItem';
import type { ParsedTrace } from '@/lib/trace-parser';

interface MetadataSectionProps {
  trace: ParsedTrace;
  featuresCount: number;
}

export function MetadataSection({ trace, featuresCount }: MetadataSectionProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Configuration Details</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetadataItem label="Instance" value={trace.metadata.instance} />
        <MetadataItem label="Config ID" value={trace.metadata.configurationId} />
        <MetadataItem label="Part Number" value={trace.metadata.partNumber} />
        <MetadataItem label="Namespace" value={trace.metadata.partNamespace} />
        <MetadataItem label="Mode" value={trace.metadata.configurationMode} />
        <MetadataItem label="Rules Executed" value={trace.rulesExecuted.toString()} />
        <MetadataItem label="Rollback Points" value={trace.rollbackPoints.toString()} />
        <MetadataItem label="Features" value={featuresCount.toString()} />
      </div>
    </div>
  );
}
