/**
 * Hook for accessing raw trace viewer functionality
 */

'use client';

import { useTraceViewerContext } from '@/app/context/TraceViewerContext';

/**
 * Simple hook that returns showLine function for LineNumber component
 */
export function useTraceViewer() {
  const context = useTraceViewerContext();
  return {
    showLine: context.showLine,
  };
}
