/**
 * Execution Flow Timeline section - visualizes ruleset loading hierarchy
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { LineNumber } from '@/app/components/shared/LineNumber';
import type { RuleExecutionTimeline, RuleExecution } from '@/lib/trace-parser';

interface RulesetNode {
  ruleset: string;
  shortName: string;
  executions: RuleExecution[];
  children: RulesetNode[];
  loadedBy: RuleExecution | null;
  ruleCount: number;
  depth: number;
}

function buildRulesetTree(timeline: RuleExecutionTimeline): RulesetNode[] {
  const roots: RulesetNode[] = [];
  const nodeMap = new Map<string, RulesetNode>();

  // First pass: group executions by ruleset
  const executionsByRuleset = new Map<string, RuleExecution[]>();
  for (const exec of timeline.executions) {
    if (!executionsByRuleset.has(exec.ruleset)) {
      executionsByRuleset.set(exec.ruleset, []);
    }
    executionsByRuleset.get(exec.ruleset)!.push(exec);
  }

  // Create nodes for each ruleset
  for (const [ruleset, executions] of executionsByRuleset) {
    const parts = ruleset.split('.');
    // Show first 2 segments - that's the meaningful identifier (e.g., "SO.IED" from "SO.IED.D.Default")
    let shortName = parts.length >= 2 ? parts.slice(0, 2).join('.') : ruleset;
    const node: RulesetNode = {
      ruleset,
      shortName,
      executions,
      children: [],
      loadedBy: null,
      ruleCount: executions.length,
      depth: 0,
    };
    nodeMap.set(ruleset, node);
  }

  // Second pass: build parent-child relationships based on LoadRulesetRule
  // Track which rulesets are loaded by which LoadRulesetRules
  const loadedRulesets = new Set<string>();

  for (const exec of timeline.executions) {
    if (exec.ruleType === 'LoadRulesetRule') {
      // Find the next execution that's in a different ruleset (the loaded one)
      const execIndex = timeline.executions.findIndex(e => e.executionId === exec.executionId);
      for (let i = execIndex + 1; i < timeline.executions.length; i++) {
        const nextExec = timeline.executions[i];
        if (nextExec.ruleset !== exec.ruleset) {
          // This ruleset was loaded by the LoadRulesetRule
          const childNode = nodeMap.get(nextExec.ruleset);
          const parentNode = nodeMap.get(exec.ruleset);
          if (childNode && parentNode && !loadedRulesets.has(nextExec.ruleset)) {
            childNode.loadedBy = exec;
            childNode.depth = parentNode.depth + 1;
            parentNode.children.push(childNode);
            loadedRulesets.add(nextExec.ruleset);
          }
          break;
        }
      }
    }
  }

  // Find root nodes (rulesets not loaded by any other)
  for (const node of nodeMap.values()) {
    if (!loadedRulesets.has(node.ruleset)) {
      roots.push(node);
    }
  }

  return roots;
}

interface TimelineSectionProps {
  timeline: RuleExecutionTimeline;
  searchTerm?: string;
}

export function TimelineSection({ timeline, searchTerm = '' }: TimelineSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedRule, setSelectedRule] = useState<RuleExecution | null>(null);
  const [prevSearchTerm, setPrevSearchTerm] = useState('');

  // Memoize tree building and filtering - must be before any conditional returns
  const rulesetTree = useMemo(() => buildRulesetTree(timeline), [timeline]);

  // Filter tree based on search term - memoized
  const filteredTree = useMemo(() => {
    if (!searchTerm) return rulesetTree;
    const lowerTerm = searchTerm.toLowerCase();

    const filterTree = (nodes: RulesetNode[]): RulesetNode[] => {
      return nodes.reduce((acc: RulesetNode[], node) => {
        const matchesRuleset = node.ruleset.toLowerCase().includes(lowerTerm) ||
                              node.shortName.toLowerCase().includes(lowerTerm);
        const filteredChildren = filterTree(node.children);

        if (matchesRuleset || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        return acc;
      }, []);
    };

    return filterTree(rulesetTree);
  }, [rulesetTree, searchTerm]);

  // Auto-expand only if there are matches
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    if (searchTerm && filteredTree.length > 0) {
      setIsExpanded(true);
    }
  }

  // Early return AFTER all hooks
  if (timeline.totalExecutions === 0) {
    return null;
  }

  // Get color for rule type
  const getRuleTypeColor = (ruleType: string): string => {
    const colors: Record<string, string> = {
      ConditionRule: 'bg-yellow-500',
      VariableRule: 'bg-blue-500',
      LoadRulesetRule: 'bg-purple-500',
      CreateComponentRule: 'bg-green-500',
      CreateDynamicOptionListRule: 'bg-cyan-500',
      CreateDynamicOptionListGroupRule: 'bg-cyan-400',
      ScreenDisplayRule: 'bg-pink-500',
      ForEachRule: 'bg-orange-500',
      LoopRule: 'bg-orange-400',
      ClearUserValueRule: 'bg-red-400',
      Unknown: 'bg-gray-500',
    };
    return colors[ruleType] || colors.Unknown;
  };

  const toggleNode = (ruleset: string) => {
    const next = new Set(expandedNodes);
    if (next.has(ruleset)) {
      next.delete(ruleset);
    } else {
      next.add(ruleset);
    }
    setExpandedNodes(next);
  };

  const expandAll = () => {
    const all = new Set<string>();
    const addAll = (nodes: RulesetNode[]) => {
      for (const node of nodes) {
        all.add(node.ruleset);
        addAll(node.children);
      }
    };
    addAll(rulesetTree);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Render a single ruleset node and its children
  const renderNode = (node: RulesetNode, isLast: boolean, prefix: string) => {
    const isNodeExpanded = expandedNodes.has(node.ruleset);
    const hasChildren = node.children.length > 0;
    const loadRulesetCount = node.executions.filter(e => e.ruleType === 'LoadRulesetRule').length;

    return (
      <div key={node.ruleset} className="font-mono text-sm">
        {/* Node header */}
        <div className="flex items-center gap-2 py-1 hover:bg-gray-800/30 rounded px-2 -mx-2">
          {/* Tree lines */}
          <span className="text-gray-600 select-none whitespace-pre">{prefix}{isLast ? '└─' : '├─'}</span>

          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.ruleset)}
              className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <svg className={`w-3 h-3 transition-transform ${isNodeExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Ruleset name */}
          <button
            onClick={() => toggleNode(node.ruleset)}
            className="flex items-center gap-2 text-left flex-1 min-w-0"
          >
            <span className="text-purple-400 font-medium truncate" title={node.ruleset}>
              {node.shortName}
            </span>
            <span className="text-gray-500 text-xs">
              ({node.ruleCount} rule{node.ruleCount !== 1 ? 's' : ''})
            </span>
            {loadRulesetCount > 0 && (
              <span className="text-purple-400/60 text-xs">
                → {loadRulesetCount} load{loadRulesetCount !== 1 ? 's' : ''}
              </span>
            )}
          </button>

          {/* Loaded by indicator */}
          {node.loadedBy && (
            <span className="text-xs text-gray-500 truncate max-w-48" title={`Loaded by: ${node.loadedBy.ruleName}`}>
              via "{node.loadedBy.ruleName.slice(0, 30)}{node.loadedBy.ruleName.length > 30 ? '...' : ''}"
            </span>
          )}
        </div>

        {/* Expanded rules list */}
        {isNodeExpanded && (
          <div className="ml-6 pl-4 border-l border-gray-700/50">
            {node.executions.slice(0, 20).map((exec) => (
              <div
                key={exec.executionId}
                onClick={() => setSelectedRule(selectedRule?.executionId === exec.executionId ? null : exec)}
                className={`flex items-center gap-2 py-0.5 px-2 -mx-2 rounded cursor-pointer text-xs ${
                  selectedRule?.executionId === exec.executionId
                    ? 'bg-indigo-900/40'
                    : 'hover:bg-gray-800/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-sm ${getRuleTypeColor(exec.ruleType)}`} />
                <span className="text-gray-400 w-16 shrink-0">{exec.ruleType.replace('Rule', '')}</span>
                <span className="text-gray-300 truncate" title={exec.ruleName}>{exec.ruleName}</span>
                <LineNumber line={exec.lineNumber} className="text-gray-600 ml-auto" />
              </div>
            ))}
            {node.executions.length > 20 && (
              <div className="text-xs text-gray-500 py-1">
                ... and {node.executions.length - 20} more rules
              </div>
            )}
          </div>
        )}

        {/* Child nodes */}
        {isNodeExpanded && hasChildren && (
          <div className="ml-6">
            {node.children.map((child, idx) =>
              renderNode(child, idx === node.children.length - 1, prefix + (isLast ? '   ' : '│  '))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Execution Flow</h2>
          <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-1 rounded">
            {timeline.rulesetOrder.length} ruleset{timeline.rulesetOrder.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
            {timeline.totalExecutions.toLocaleString()} rules
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800">
          {/* Controls */}
          <div className="px-6 py-2 bg-gray-800/30 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-500">Shows which rulesets load other rulesets (LoadRulesetRule triggers)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="px-6 py-2 bg-gray-800/20 border-b border-gray-800 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-gray-500">Rule Types:</span>
            {['ConditionRule', 'VariableRule', 'LoadRulesetRule', 'ScreenDisplayRule', 'ForEachRule'].map((type) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${getRuleTypeColor(type)}`} />
                <span className="text-gray-400">{type.replace('Rule', '')}</span>
              </div>
            ))}
          </div>

          {/* Flow Tree */}
          <div className="p-6 max-h-[500px] overflow-auto">
            {filteredTree.length > 0 ? (
              <div className="space-y-1">
                {filteredTree.map((node, idx) => renderNode(node, idx === filteredTree.length - 1, ''))}
              </div>
            ) : searchTerm ? (
              <div className="text-gray-500 text-sm">No rulesets match &quot;{searchTerm}&quot;</div>
            ) : (
              <div className="text-gray-500 text-sm">No ruleset flow detected</div>
            )}
          </div>

          {/* Selected rule details */}
          {selectedRule && (
            <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded ${getRuleTypeColor(selectedRule.ruleType)}`} />
                    <span className="text-sm font-medium text-white">{selectedRule.ruleName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                    <div className="text-gray-400">Type: <span className="text-gray-300">{selectedRule.ruleType}</span></div>
                    <div className="text-gray-400">Rule ID: <span className="text-gray-300">{selectedRule.ruleId}</span></div>
                    <div className="text-gray-400">Ruleset: <span className="text-gray-300">{selectedRule.ruleset}</span></div>
                    <div className="text-gray-400">Line: <LineNumber line={selectedRule.lineNumber} className="text-gray-300" /></div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
