/**
 * Header component with search bar, mode toggle, and baseline button
 */

'use client';

import { Database, Search, X } from 'lucide-react';
import { useTraceViewerContext } from '@/app/context/TraceViewerContext';

export function Header() {
  const {
    viewMode,
    setViewMode,
    baselineLibrary,
    setShowBaselinePanel,
    searchTerm,
    setSearchTerm,
    baselineTrace,
  } = useTraceViewerContext();

  const showSearch = viewMode === 'single' && baselineTrace;

  return (
    <header className="border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CPQ Trace Analyzer</h1>
            <p className="text-sm text-gray-400">Parse and compare Infor CPQ trace files</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBaselinePanel(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Baselines ({baselineLibrary.length})
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Single Trace
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'compare'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Compare Traces
            </button>
          </div>
        </div>

        {/* Global search bar (only in single mode with trace loaded) */}
        {showSearch && (
          <div className="mt-4">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search traces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
