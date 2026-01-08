/**
 * Shared types for the CPQ Trace Analyzer
 */

export type TabId = 'info' | 'debug' | 'integration' | 'compare' | 'regression';

export type ViewMode = 'single' | 'compare';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visibleIn: ViewMode[];
}

export interface SearchMatchCounts {
  info: number;
  debug: number;
  integration: number;
  compare: number;
  regression: number;
}
