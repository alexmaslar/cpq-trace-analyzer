/**
 * Rule summary card component
 */

'use client';

interface RuleSummaryCardProps {
  label: string;
  value: number;
}

export function RuleSummaryCard({ label, value }: RuleSummaryCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
