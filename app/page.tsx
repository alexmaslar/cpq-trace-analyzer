/**
 * CPQ Trace Analyzer - Main Page (Orchestration Only)
 * Manages state and renders tab-based interface
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseTrace, compareTraces, compareBehavior } from '@/lib/trace-parser';
import { addBaseline, removeBaseline, getBaselines, findBestMatch, rankBaselines } from '@/lib/baseline-storage-api';
import { TraceViewerContextProvider } from '@/app/context/TraceViewerContext';
import { useSearchMatches } from '@/app/hooks/useSearchMatches';
import { Header } from '@/app/components/layout/Header';
import { TabNavigation } from '@/app/components/layout/TabNavigation';
import { TraceUploader } from '@/app/components/shared/TraceUploader';
import { RawTraceViewer } from '@/app/components/shared/RawTraceViewer';
import { InfoTab } from '@/app/components/tabs/InfoTab';
import { DebugTab } from '@/app/components/tabs/DebugTab';
import { IntegrationTab } from '@/app/components/tabs/IntegrationTab';
import { CompareTab } from '@/app/components/tabs/CompareTab';
import { RegressionTab } from '@/app/components/tabs/RegressionTab';
import { AddToBaselineButton } from '@/app/components/regression/AddToBaselineButton';
import type { ParsedTrace, TraceDiff, RegressionResult } from '@/lib/trace-parser';
import type { BaselineTrace } from '@/lib/baseline-storage-api';
import type { ViewMode, TabId } from '@/app/types';

export default function Home() {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [baselineTrace, setBaselineTrace] = useState<ParsedTrace | null>(null);
  const [currentTrace, setCurrentTrace] = useState<ParsedTrace | null>(null);
  const [diff, setDiff] = useState<TraceDiff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rawTraceContent, setRawTraceContent] = useState<string>('');
  const [viewerLine, setViewerLine] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [baselineLibrary, setBaselineLibrary] = useState<BaselineTrace[]>([]);
  const [showBaselinePanel, setShowBaselinePanel] = useState(false);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [traceFilename, setTraceFilename] = useState<string>('');

  // Calculate search match counts per tab
  const matchCounts = useSearchMatches(baselineTrace, searchTerm);

  // Load baselines from API on mount
  useEffect(() => {
    const loadBaselines = async () => {
      const baselines = await getBaselines();
      setBaselineLibrary(baselines);
    };
    loadBaselines();
  }, []);

  // Auto-compare against baselines when a trace is loaded
  useEffect(() => {
    const runComparison = async () => {
      if (baselineTrace && baselineLibrary.length > 0 && viewMode === 'single') {
        const match = await findBestMatch(baselineTrace);
        if (match && match.matchScore > 0) {
          const result = compareBehavior(match.baseline.trace, baselineTrace, {
            id: match.baseline.id,
            name: match.baseline.name,
            matchScore: match.matchScore,
          });
          setRegressionResult(result);
          setSelectedBaselineId(match.baseline.id);
        } else {
          setRegressionResult(null);
          setSelectedBaselineId(null);
        }
      }
    };
    runComparison();
  }, [baselineTrace, baselineLibrary, viewMode]);

  // Keyboard shortcuts: Alt+1-5 for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const tabMap: Record<string, TabId> = {
          '1': 'info',
          '2': 'debug',
          '3': 'integration',
          '4': 'regression',
          '5': 'compare',
        };

        const tabId = tabMap[e.key];
        if (tabId) {
          e.preventDefault();

          // Only switch if in appropriate view mode
          if (tabId === 'compare' && viewMode !== 'compare') {
            return; // Compare tab only available in compare mode
          }
          if (tabId !== 'compare' && viewMode === 'compare') {
            return; // Other tabs only available in single mode
          }

          if (baselineTrace && viewMode === 'single' && tabId !== 'compare') {
            setActiveTab(tabId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [baselineTrace, viewMode]);

  // Handlers
  const handleTraceInput = useCallback(
    (content: string, slot: 'baseline' | 'current') => {
      setError(null);
      setIsLoading(true);

      try {
        const parsed = parseTrace(content);

        if (slot === 'baseline') {
          setBaselineTrace(parsed);
          setRawTraceContent(content);
          if (currentTrace && viewMode === 'compare') {
            setDiff(compareTraces(parsed, currentTrace));
          }
        } else {
          setCurrentTrace(parsed);
          if (viewMode === 'single') {
            setRawTraceContent(content);
          }
          if (baselineTrace && viewMode === 'compare') {
            setDiff(compareTraces(baselineTrace, parsed));
          }
        }
      } catch (e) {
        setError(`Failed to parse trace: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    },
    [baselineTrace, currentTrace, viewMode]
  );

  const handleFileUpload = useCallback(
    (file: File, slot: 'baseline' | 'current') => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (slot === 'baseline') {
          setTraceFilename(file.name);
        }
        handleTraceInput(content, slot);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    },
    [handleTraceInput]
  );

  const handleAddToBaselines = useCallback(
    async (name: string) => {
      if (!baselineTrace || !rawTraceContent) return;
      try {
        const baseline = await addBaseline(name, traceFilename || 'unnamed.txt', rawTraceContent, baselineTrace);
        const baselines = await getBaselines();
        setBaselineLibrary(baselines);
        return baseline;
      } catch (error) {
        console.error('Failed to add baseline:', error);
        setError(`Failed to save baseline: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return undefined;
      }
    },
    [baselineTrace, traceFilename, rawTraceContent]
  );

  const handleRemoveBaseline = useCallback(
    async (id: string) => {
      try {
        await removeBaseline(id);
        const baselines = await getBaselines();
        setBaselineLibrary(baselines);
        if (selectedBaselineId === id) {
          setRegressionResult(null);
          setSelectedBaselineId(null);
        }
      } catch (error) {
        console.error('Failed to remove baseline:', error);
        setError(`Failed to remove baseline: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [selectedBaselineId]
  );

  const handleSelectBaseline = useCallback(
    async (baseline: BaselineTrace) => {
      if (!baselineTrace) return;
      const rankedBaselines = await rankBaselines(baselineTrace);
      const match = rankedBaselines.find((m) => m.baseline.id === baseline.id);
      const matchScore = match?.matchScore ?? 0;
      const result = compareBehavior(baseline.trace, baselineTrace, {
        id: baseline.id,
        name: baseline.name,
        matchScore,
      });
      setRegressionResult(result);
      setSelectedBaselineId(baseline.id);
    },
    [baselineTrace]
  );

  const showLine = useCallback((lineNumber: number) => {
    setViewerLine(lineNumber);
  }, []);

  const clearAll = () => {
    setBaselineTrace(null);
    setCurrentTrace(null);
    setDiff(null);
    setError(null);
    setRawTraceContent('');
    setViewerLine(null);
    setRegressionResult(null);
    setSelectedBaselineId(null);
    setTraceFilename('');
    setSearchTerm('');
  };

  // Context value
  const contextValue = {
    viewMode,
    setViewMode,
    baselineTrace,
    currentTrace,
    diff,
    error,
    isLoading,
    rawTraceContent,
    viewerLine,
    searchTerm,
    setSearchTerm,
    baselineLibrary,
    showBaselinePanel,
    setShowBaselinePanel,
    regressionResult,
    selectedBaselineId,
    traceFilename,
    handleTraceInput,
    handleFileUpload,
    handleAddToBaselines,
    handleRemoveBaseline,
    handleSelectBaseline,
    showLine,
    clearAll,
  };

  return (
    <TraceViewerContextProvider value={contextValue}>
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <Header />

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">{error}</div>
          )}

          {/* Trace Uploaders */}
          <div className={`grid gap-6 mb-8 ${viewMode === 'compare' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TraceUploader
              label={viewMode === 'compare' ? 'Baseline Trace' : 'Trace File'}
              onFileUpload={(file) => handleFileUpload(file, 'baseline')}
              onPaste={(content) => handleTraceInput(content, 'baseline')}
              hasData={!!baselineTrace}
              isLoading={isLoading}
            />

            {viewMode === 'compare' && (
              <TraceUploader
                label="Current Trace"
                onFileUpload={(file) => handleFileUpload(file, 'current')}
                onPaste={(content) => handleTraceInput(content, 'current')}
                hasData={!!currentTrace}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Controls */}
          {(baselineTrace || currentTrace) && (
            <div className="mb-6 flex items-center gap-4">
              {baselineTrace && viewMode === 'single' && (
                <AddToBaselineButton onAdd={handleAddToBaselines} defaultName={traceFilename} />
              )}
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          {baselineTrace && viewMode === 'single' && (
            <TabNavigation
              activeTab={activeTab}
              viewMode={viewMode}
              matchCounts={matchCounts}
              onTabChange={setActiveTab}
            />
          )}

          {/* Tab Content */}
          {viewMode === 'single' && baselineTrace && (
            <div className="space-y-6 tab-content-enter" key={activeTab}>
              {activeTab === 'info' && <InfoTab trace={baselineTrace} searchTerm={searchTerm} />}
              {activeTab === 'debug' && <DebugTab trace={baselineTrace} searchTerm={searchTerm} />}
              {activeTab === 'integration' && <IntegrationTab trace={baselineTrace} searchTerm={searchTerm} />}
              {activeTab === 'regression' && (
                <RegressionTab
                  regressionResult={regressionResult}
                  baselineLibrary={baselineLibrary}
                  currentTrace={baselineTrace}
                  selectedBaselineId={selectedBaselineId}
                  onRemoveBaseline={handleRemoveBaseline}
                  onSelectBaseline={handleSelectBaseline}
                />
              )}
            </div>
          )}

          {/* Compare Mode Content */}
          {viewMode === 'compare' && baselineTrace && currentTrace && diff && (
            <CompareTab baseline={baselineTrace} current={currentTrace} diff={diff} />
          )}
        </div>

        {/* Raw Trace Viewer Modal */}
        {viewerLine !== null && rawTraceContent && (
          <RawTraceViewer
            content={rawTraceContent}
            lineNumber={viewerLine}
            onClose={() => setViewerLine(null)}
          />
        )}
      </main>
    </TraceViewerContextProvider>
  );
}
