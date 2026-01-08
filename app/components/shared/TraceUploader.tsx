/**
 * Trace file uploader with drag-and-drop and paste support
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';

interface TraceUploaderProps {
  label: string;
  onFileUpload: (file: File) => void;
  onPaste: (content: string) => void;
  hasData: boolean;
  isLoading: boolean;
}

export function TraceUploader({
  label,
  onFileUpload,
  onPaste,
  hasData,
  isLoading,
}: TraceUploaderProps) {
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handlePasteSubmit = () => {
    if (pasteContent.trim()) {
      onPaste(pasteContent);
      setPasteContent('');
      setPasteMode(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{label}</h2>
        {hasData && (
          <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">
            Loaded
          </span>
        )}
      </div>

      {!pasteMode ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors"
        >
          <div className="text-gray-400 mb-4">
            <Upload className="w-12 h-12 mx-auto mb-2" />
            <p>Drop trace file here</p>
          </div>

          <div className="flex gap-3 justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.trace"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium"
            >
              Choose File
            </button>
            <button
              type="button"
              onClick={() => setPasteMode(true)}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              Paste Content
            </button>
          </div>
        </div>
      ) : (
        <div>
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste trace content here..."
            className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 font-mono resize-none focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteContent.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Parsing...' : 'Parse Trace'}
            </button>
            <button
              onClick={() => {
                setPasteMode(false);
                setPasteContent('');
              }}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
