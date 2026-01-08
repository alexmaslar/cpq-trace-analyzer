/**
 * Tab navigation with icons and search match badges
 */

'use client';

import { Info, Bug, Layers, GitCompare, ShieldCheck } from 'lucide-react';
import type { TabId, ViewMode, SearchMatchCounts } from '@/app/types';

interface TabNavigationProps {
  activeTab: TabId;
  viewMode: ViewMode;
  matchCounts: SearchMatchCounts;
  onTabChange: (tab: TabId) => void;
}

const TABS = [
  { id: 'info' as TabId, label: 'Info', icon: Info, visibleIn: ['single'] as ViewMode[] },
  { id: 'debug' as TabId, label: 'Debug', icon: Bug, visibleIn: ['single'] as ViewMode[] },
  { id: 'integration' as TabId, label: 'Integration', icon: Layers, visibleIn: ['single'] as ViewMode[] },
  { id: 'compare' as TabId, label: 'Compare', icon: GitCompare, visibleIn: ['compare'] as ViewMode[] },
  { id: 'regression' as TabId, label: 'Regression', icon: ShieldCheck, visibleIn: ['single'] as ViewMode[] },
];

export function TabNavigation({ activeTab, viewMode, matchCounts, onTabChange }: TabNavigationProps) {
  const visibleTabs = TABS.filter(tab => tab.visibleIn.includes(viewMode));

  return (
    <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const matchCount = matchCounts[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2
                  ${isActive
                    ? 'text-white bg-gray-800/30 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border-transparent'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {matchCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 rounded-full text-xs font-semibold">
                    {matchCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
