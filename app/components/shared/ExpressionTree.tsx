/**
 * Expression Tree visualization component
 */

'use client';

import type { ExpressionNode } from '@/lib/expression-parser';

interface ExpressionTreeProps {
  node: ExpressionNode;
  depth: number;
}

export function ExpressionTree({ node, depth }: ExpressionTreeProps) {
  const getNodeColor = (type: ExpressionNode['type']) => {
    switch (type) {
      case 'function': return 'text-blue-400';
      case 'operator': return 'text-yellow-400';
      case 'variable': return 'text-purple-400';
      case 'literal': return 'text-green-400';
      case 'array': return 'text-cyan-400';
      case 'unary': return 'text-orange-400';
      default: return 'text-gray-300';
    }
  };

  const getNodeLabel = (node: ExpressionNode) => {
    switch (node.type) {
      case 'function':
        return `${node.value}()`;
      case 'operator':
        return node.value;
      case 'variable':
        return node.value;
      case 'literal':
        return node.value;
      case 'array':
        return `Array [${node.children?.length || 0}]`;
      case 'unary':
        return node.value;
      default:
        return node.value;
    }
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="font-mono text-xs">
      <div className="flex items-center gap-2 py-0.5">
        {/* Tree connector lines */}
        {depth > 0 && (
          <span className="text-gray-600" style={{ marginLeft: `${(depth - 1) * 16}px` }}>
            └─
          </span>
        )}

        {/* Node type badge */}
        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
          node.type === 'function' ? 'bg-blue-900/50 text-blue-400' :
          node.type === 'operator' ? 'bg-yellow-900/50 text-yellow-400' :
          node.type === 'variable' ? 'bg-purple-900/50 text-purple-400' :
          node.type === 'literal' ? 'bg-green-900/50 text-green-400' :
          node.type === 'array' ? 'bg-cyan-900/50 text-cyan-400' :
          'bg-orange-900/50 text-orange-400'
        }`}>
          {node.type}
        </span>

        {/* Node value */}
        <span className={getNodeColor(node.type)}>
          {getNodeLabel(node)}
        </span>
      </div>

      {/* Render children */}
      {hasChildren && (
        <div className="ml-4">
          {node.children!.map((child, idx) => (
            <ExpressionTree key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
