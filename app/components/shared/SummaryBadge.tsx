/**
 * Summary badge component with color variants
 */

'use client';

interface SummaryBadgeProps {
  count: number;
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'cyan' | 'orange';
}

export function SummaryBadge({ count, label, color }: SummaryBadgeProps) {
  const colorClasses = {
    green: 'bg-green-900/50 text-green-400 border-green-800',
    yellow: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    red: 'bg-red-900/50 text-red-400 border-red-800',
    blue: 'bg-blue-900/50 text-blue-400 border-blue-800',
    purple: 'bg-purple-900/50 text-purple-400 border-purple-800',
    cyan: 'bg-cyan-900/50 text-cyan-400 border-cyan-800',
    orange: 'bg-orange-900/50 text-orange-400 border-orange-800',
  };

  return (
    <div className={`px-4 py-2 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
