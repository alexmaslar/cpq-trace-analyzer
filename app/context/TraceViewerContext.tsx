/**
 * TraceViewerContext - Global state for the trace analyzer
 */

'use client';

import { createContext, useContext } from 'react';
import type { ParsedTrace, TraceDiff, RegressionResult } from '@/lib/trace-parser';
import type { BaselineTrace } from '@/lib/baseline-storage';
import type { ViewMode } from '@/app/types';

export interface TraceViewerContextType {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Trace data
  baselineTrace: ParsedTrace | null;
  currentTrace: ParsedTrace | null;
  diff: TraceDiff | null;

  // UI state
  error: string | null;
  isLoading: boolean;
  rawTraceContent: string;
  viewerLine: number | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Baseline library
  baselineLibrary: BaselineTrace[];
  showBaselinePanel: boolean;
  setShowBaselinePanel: (show: boolean) => void;
  regressionResult: RegressionResult | null;
  selectedBaselineId: string | null;
  traceFilename: string;

  // Actions
  handleTraceInput: (content: string, slot: 'baseline' | 'current') => void;
  handleFileUpload: (file: File, slot: 'baseline' | 'current') => void;
  handleAddToBaselines: (name: string) => BaselineTrace | undefined;
  handleRemoveBaseline: (id: string) => void;
  handleSelectBaseline: (baseline: BaselineTrace) => void;
  showLine: (lineNumber: number) => void;
  clearAll: () => void;
}

export const TraceViewerContext = createContext<TraceViewerContextType | null>(null);

export function useTraceViewerContext() {
  const context = useContext(TraceViewerContext);
  if (!context) {
    throw new Error('useTraceViewerContext must be used within a TraceViewerProvider');
  }
  return context;
}

export function TraceViewerContextProvider({
  value,
  children,
}: {
  value: TraceViewerContextType;
  children: React.ReactNode;
}) {
  return <TraceViewerContext.Provider value={value}>{children}</TraceViewerContext.Provider>;
}
