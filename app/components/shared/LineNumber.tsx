/**
 * Clickable line number component that shows raw trace at specific line
 */

'use client';

import { useTraceViewer } from '@/app/hooks/useTraceViewer';

interface LineNumberProps {
  line: number;
  className?: string;
}

export function LineNumber({ line, className = '' }: LineNumberProps) {
  const { showLine } = useTraceViewer();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        showLine(line);
      }}
      className={`hover:text-blue-400 hover:underline cursor-pointer ${className}`}
      title="View in raw trace"
    >
      L{line.toLocaleString()}
    </button>
  );
}
