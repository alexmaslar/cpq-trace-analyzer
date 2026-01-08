/**
 * Add to Baseline Button - allows saving current trace as a baseline
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface AddToBaselineButtonProps {
  onAdd: (name: string) => void;
  defaultName: string;
}

export function AddToBaselineButton({ onAdd, defaultName }: AddToBaselineButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(defaultName || '');

  useEffect(() => {
    if (defaultName) {
      setName(defaultName.replace(/\.txt$/, ''));
    }
  }, [defaultName]);

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setIsOpen(false);
      setName('');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add to Baselines
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Add to Baseline Library</h4>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Baseline name..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500 mb-3"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
