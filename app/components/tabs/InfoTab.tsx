/**
 * Info Tab - displays metadata, features, and issues
 */

'use client';

import { MetadataSection } from '@/app/components/sections/MetadataSection';
import { FeaturesSection } from '@/app/components/sections/FeaturesSection';
import { IssuesSection } from '@/app/components/sections/IssuesSection';
import type { ParsedTrace } from '@/lib/trace-parser';

interface InfoTabProps {
  trace: ParsedTrace;
  searchTerm?: string;
}

export function InfoTab({ trace, searchTerm = '' }: InfoTabProps) {
  const featuresArray = Array.from(trace.features.values());

  return (
    <div className="space-y-6">
      {/* Metadata */}
      {trace.metadata && <MetadataSection trace={trace} featuresCount={trace.features.size} />}

      {/* Features & Options */}
      {trace.features.size > 0 && <FeaturesSection features={featuresArray} searchTerm={searchTerm} />}

      {/* Issues */}
      {trace.issues && trace.issues.issues.length > 0 && <IssuesSection issues={trace.issues} />}
    </div>
  );
}
