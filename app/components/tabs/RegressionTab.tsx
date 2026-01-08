/**
 * Regression Tab - displays regression test results and baseline library
 */

'use client';

import { RegressionResultsView } from '@/app/components/regression/RegressionResultsView';
import { BaselineLibraryPanel } from '@/app/components/regression/BaselineLibraryPanel';
import type { RegressionResult, ParsedTrace } from '@/lib/trace-parser';
import type { BaselineTrace } from '@/lib/baseline-storage';

interface RegressionTabProps {
  regressionResult: RegressionResult | null;
  baselineLibrary: BaselineTrace[];
  currentTrace: ParsedTrace | null;
  selectedBaselineId: string | null;
  onRemoveBaseline: (id: string) => void;
  onSelectBaseline: (baseline: BaselineTrace) => void;
}

export function RegressionTab({
  regressionResult,
  baselineLibrary,
  currentTrace,
  selectedBaselineId,
  onRemoveBaseline,
  onSelectBaseline,
}: RegressionTabProps) {
  return (
    <div className="space-y-6">
      {/* Regression Results */}
      {regressionResult && <RegressionResultsView result={regressionResult} />}

      {/* Baseline Library (inline) */}
      <BaselineLibraryPanel
        baselines={baselineLibrary}
        currentTrace={currentTrace}
        selectedBaselineId={selectedBaselineId}
        onRemove={onRemoveBaseline}
        onSelect={onSelectBaseline}
      />
    </div>
  );
}
