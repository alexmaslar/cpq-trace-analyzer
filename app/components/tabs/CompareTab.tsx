/**
 * Compare Tab - displays comparison between baseline and current traces
 */

'use client';

import { CompareView } from '@/app/components/compare/CompareView';
import type { TraceDiff, ParsedTrace } from '@/lib/trace-parser';

interface CompareTabProps {
  baseline: ParsedTrace;
  current: ParsedTrace;
  diff: TraceDiff;
}

export function CompareTab({ baseline, current, diff }: CompareTabProps) {
  return <CompareView baseline={baseline} current={current} diff={diff} />;
}
