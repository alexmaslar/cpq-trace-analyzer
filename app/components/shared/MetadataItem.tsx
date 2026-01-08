/**
 * Metadata item component
 */

'use client';

interface MetadataItemProps {
  label: string;
  value: string;
}

export function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-gray-200 font-mono mt-1">{value || '—'}</dd>
    </div>
  );
}
