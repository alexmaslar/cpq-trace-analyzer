/**
 * Raw Trace Viewer Modal - shows full trace content with scroll to target line
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';

interface RawTraceViewerProps {
  content: string;
  lineNumber: number;
  onClose: () => void;
}

export function RawTraceViewer({ content, lineNumber, onClose }: RawTraceViewerProps) {
  const lines = useMemo(() => content.split(/\r?\n/), [content]);
  const WINDOW_SIZE = 200; // Show 200 lines at a time

  // Calculate initial window centered on target line
  const getWindowForLine = (targetLine: number) => {
    const start = Math.max(0, targetLine - Math.floor(WINDOW_SIZE / 2));
    const end = Math.min(lines.length, start + WINDOW_SIZE);
    return { start, end };
  };

  const [window, setWindow] = useState(() => getWindowForLine(lineNumber - 1));
  const targetRef = useRef<HTMLTableRowElement>(null);

  // Scroll to target line when window changes
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ block: 'center' });
    }
  }, [window]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const goToLine = (line: number) => {
    setWindow(getWindowForLine(line - 1));
  };

  const pageUp = () => {
    setWindow(prev => {
      const newStart = Math.max(0, prev.start - WINDOW_SIZE);
      return { start: newStart, end: newStart + WINDOW_SIZE };
    });
  };

  const pageDown = () => {
    setWindow(prev => {
      const newStart = Math.min(lines.length - WINDOW_SIZE, prev.start + WINDOW_SIZE);
      return { start: Math.max(0, newStart), end: Math.min(lines.length, newStart + WINDOW_SIZE) };
    });
  };

  const visibleLines = lines.slice(window.start, window.end);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Raw Trace</h3>
            <span className="text-sm text-blue-400">Line {lineNumber.toLocaleString()}</span>
            <span className="text-xs text-gray-500">({lines.length.toLocaleString()} total)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToLine(lineNumber)}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white"
            >
              Go to target
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between bg-gray-800/50 shrink-0">
          <button
            onClick={pageUp}
            disabled={window.start === 0}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white"
          >
            ↑ Previous {WINDOW_SIZE}
          </button>
          <span className="text-xs text-gray-400">
            Showing lines {(window.start + 1).toLocaleString()} - {window.end.toLocaleString()}
          </span>
          <button
            onClick={pageDown}
            disabled={window.end >= lines.length}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white"
          >
            ↓ Next {WINDOW_SIZE}
          </button>
        </div>

        {/* Content - windowed trace */}
        <div className="flex-1 overflow-auto font-mono text-xs min-h-0">
          <table className="w-full">
            <tbody>
              {visibleLines.map((line, idx) => {
                const actualLineNum = window.start + idx + 1;
                const isTarget = actualLineNum === lineNumber;
                return (
                  <tr
                    key={actualLineNum}
                    ref={isTarget ? targetRef : undefined}
                    className={isTarget ? 'bg-blue-900/50' : 'hover:bg-gray-800/50'}
                  >
                    <td className={`px-3 py-0.5 text-right select-none border-r border-gray-700 sticky left-0 bg-gray-900 ${isTarget ? 'text-blue-400 font-bold bg-blue-900/50' : 'text-gray-600'}`} style={{ minWidth: '70px' }}>
                      {actualLineNum.toLocaleString()}
                    </td>
                    <td className={`px-3 py-0.5 whitespace-pre ${isTarget ? 'text-white' : 'text-gray-300'}`}>
                      {line || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between shrink-0">
          <span>Target line highlighted in blue</span>
          <span>Press Escape to close</span>
        </div>
      </div>
    </div>
  );
}
