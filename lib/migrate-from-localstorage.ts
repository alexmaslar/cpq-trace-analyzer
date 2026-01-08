/**
 * Migration Utility: localStorage → Supabase
 * Helps users migrate their existing baselines from localStorage to Supabase
 */

import { addBaseline as addSupabaseBaseline } from './baseline-storage-supabase';
import type { ParsedTrace } from './trace-parser';

// Old localStorage implementation types
interface LegacyBaselineTrace {
  id: string;
  name: string;
  filename: string;
  trace: ParsedTrace;
  selectionPath: Array<{
    featureName: string;
    selectedValue: string | null;
    optionCount: number;
  }>;
  createdAt: number;
}

interface LegacyBaselineLibrary {
  baselines: LegacyBaselineTrace[];
  version: number;
}

const LEGACY_STORAGE_KEY = 'cpq-trace-analyzer-baselines';

/**
 * Check if user has baselines in localStorage
 */
export function hasLocalStorageBaselines(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return false;

    const library = JSON.parse(stored) as LegacyBaselineLibrary;
    return library.baselines && library.baselines.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get count of baselines in localStorage
 */
export function getLocalStorageBaselineCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return 0;

    const library = JSON.parse(stored) as LegacyBaselineLibrary;
    return library.baselines?.length || 0;
  } catch {
    return 0;
  }
}

/**
 * Reconstruct raw content from ParsedTrace (best effort)
 * Note: This won't be perfect, but better than nothing
 */
function reconstructRawContent(trace: ParsedTrace): string {
  // Generate a simplified trace-like format
  const lines: string[] = [];

  // Add metadata header
  lines.push(`<InputParameters Instance="${trace.metadata.instance}" Application="${trace.metadata.application}">`);
  lines.push(`  <ConfigurationID>${trace.metadata.configurationId}</ConfigurationID>`);
  lines.push(`  <PartNumber>${trace.metadata.partNumber}</PartNumber>`);
  lines.push(`  <PartNamespace>${trace.metadata.partNamespace}</PartNamespace>`);
  lines.push(`  <ConfigurationMode>${trace.metadata.configurationMode}</ConfigurationMode>`);
  if (trace.metadata.headerID) {
    lines.push(`  <HeaderID>${trace.metadata.headerID}</HeaderID>`);
  }
  lines.push('</InputParameters>');
  lines.push('');

  // Add warning that this is reconstructed
  lines.push('# NOTE: This trace was reconstructed from localStorage data');
  lines.push('# Original raw trace content was not available');
  lines.push('');

  // Add feature selections
  for (const [name, feature] of trace.features) {
    lines.push(`Screen Option: ${name}`);
    lines.push(`  Property : Caption`);
    lines.push(`    Result : "${feature.caption}"`);
    if (feature.selectedValue !== null) {
      lines.push(`  Value: "${feature.selectedValue}"`);
    }
    lines.push('------------------------------------------------------------');
  }

  // Add summary
  lines.push('');
  lines.push(`${trace.rulesExecuted} rules executed`);
  if (trace.rollbackPoints > 0) {
    lines.push(`Rollback point ${trace.rollbackPoints}`);
  }

  return lines.join('\n');
}

/**
 * Migrate all baselines from localStorage to Supabase
 */
export async function migrateBaselines(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
}> {
  if (typeof window === 'undefined') {
    throw new Error('Migration can only run in browser');
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ name: string; error: string }>,
  };

  try {
    // Load legacy baselines
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) {
      return results;
    }

    const library = JSON.parse(stored) as LegacyBaselineLibrary;

    if (!library.baselines || library.baselines.length === 0) {
      return results;
    }

    // Migrate each baseline
    for (const legacyBaseline of library.baselines) {
      try {
        // Reconstruct raw content (best effort)
        const rawContent = reconstructRawContent(legacyBaseline.trace);

        // Create in Supabase
        await addSupabaseBaseline(
          legacyBaseline.name,
          legacyBaseline.filename,
          rawContent,
          legacyBaseline.trace
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          name: legacyBaseline.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear localStorage baselines after successful migration
 */
export function clearLocalStorageBaselines(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage baselines:', error);
  }
}

/**
 * Full migration workflow with confirmation
 */
export async function performMigration(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
}> {
  const count = getLocalStorageBaselineCount();

  if (count === 0) {
    throw new Error('No baselines found in localStorage');
  }

  // Perform migration
  const results = await migrateBaselines();

  // If all successful, clear localStorage
  if (results.failed === 0) {
    clearLocalStorageBaselines();
  }

  return results;
}
