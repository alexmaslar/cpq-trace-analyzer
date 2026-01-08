/**
 * Hook to calculate search match counts per tab
 */

'use client';

import { useMemo } from 'react';
import type { ParsedTrace } from '@/lib/trace-parser';
import type { SearchMatchCounts } from '@/app/types';

export function useSearchMatches(
  trace: ParsedTrace | null,
  searchTerm: string
): SearchMatchCounts {
  return useMemo(() => {
    const counts: SearchMatchCounts = {
      info: 0,
      debug: 0,
      integration: 0,
      compare: 0,
      regression: 0,
    };

    if (!trace || !searchTerm) {
      return counts;
    }

    const term = searchTerm.toLowerCase();

    // Info tab: Features and Issues
    const features = Array.from(trace.features.values());
    features.forEach(feature => {
      if (
        feature.name.toLowerCase().includes(term) ||
        feature.selectedValue?.toLowerCase().includes(term) ||
        feature.options.some(opt => opt.toLowerCase().includes(term))
      ) {
        counts.info++;
      }
    });

    if (trace.issues) {
      trace.issues.issues.forEach(issue => {
        if (
          issue.title.toLowerCase().includes(term) ||
          issue.description.toLowerCase().includes(term)
        ) {
          counts.info++;
        }
      });
    }

    // Debug tab: Variables and Conditions
    if (trace.variableTracking) {
      const variables = Array.from(trace.variableTracking.variables.values());
      variables.forEach(variable => {
        if (
          variable.name.toLowerCase().includes(term) ||
          String(variable.finalValue).toLowerCase().includes(term)
        ) {
          counts.debug++;
        }
      });
    }

    if (trace.conditionTracking) {
      trace.conditionTracking.conditions.forEach(condition => {
        if (
          condition.expression.toLowerCase().includes(term) ||
          condition.ruleName.toLowerCase().includes(term)
        ) {
          counts.debug++;
        }
      });
    }

    // Integration tab: Integration outputs and rules
    if (trace.integrationOutputs) {
      const templates = Array.from(trace.integrationOutputs.templates.values());
      templates.forEach(template => {
        if (template.name.toLowerCase().includes(term)) {
          counts.integration++;
        }
        template.rows.forEach(row => {
          const properties = Array.from(row.properties.values());
          if (properties.some(prop => String(prop).toLowerCase().includes(term))) {
            counts.integration++;
          }
        });
      });
    }

    if (trace.rulesSummary) {
      const rulesets = Array.from(trace.rulesSummary.rulesets.values());
      rulesets.forEach(ruleset => {
        if (ruleset.name.toLowerCase().includes(term)) {
          counts.integration++;
        }
        const rules = Array.from(ruleset.rules.values());
        rules.forEach(rule => {
          if (rule.ruleName.toLowerCase().includes(term)) {
            counts.integration++;
          }
        });
      });
    }

    // Regression tab: Always 0 for now (no search in regression results)
    counts.regression = 0;

    return counts;
  }, [trace, searchTerm]);
}
