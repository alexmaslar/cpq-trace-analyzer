/**
 * Features & Options section component
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FeatureData } from '@/lib/trace-parser';

interface FeaturesSectionProps {
  features: FeatureData[];
  searchTerm?: string;
}

export function FeaturesSection({ features, searchTerm = '' }: FeaturesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevSearchTerm, setPrevSearchTerm] = useState('');

  // Filter features - memoized
  const filteredFeatures = useMemo(() => {
    if (!searchTerm) return features;
    const term = searchTerm.toLowerCase();
    return features.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.caption.toLowerCase().includes(term) ||
      f.options.some(opt => opt.toLowerCase().includes(term)) ||
      (f.selectedValue && f.selectedValue.toLowerCase().includes(term))
    );
  }, [features, searchTerm]);

  // Auto-expand when search has matches
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    if (searchTerm && filteredFeatures.length > 0) {
      setIsExpanded(true);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Features & Options</h2>
          <span className="text-sm text-gray-400">
            {searchTerm ? `${filteredFeatures.length} of ${features.length}` : `${features.length}`} features
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800 overflow-x-auto">
          {filteredFeatures.length === 0 ? (
            <div className="px-6 py-4 text-gray-500 text-sm">No features match &quot;{searchTerm}&quot;</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Feature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Caption</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Options Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Selected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredFeatures.map((feature) => (
                  <tr key={feature.name} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <code className="text-sm text-blue-400 font-mono">{feature.name}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{feature.caption}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {feature.options.slice(0, 8).map((opt) => (
                          <span
                            key={opt}
                            className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded"
                          >
                            {opt}
                          </span>
                        ))}
                        {feature.options.length > 8 && (
                          <span className="text-xs text-gray-500">
                            +{feature.options.length - 8} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{feature.options.length}</td>
                    <td className="px-6 py-4">
                      {feature.selectedValue ? (
                        <span className="text-sm bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
                          {feature.selectedValue}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
