/**
 * CPQ Expression Parser
 * Parses CPQ configuration expressions into an AST for visualization
 */

export type ExpressionNodeType =
  | 'function'      // EXISTS(), IF(), CONTAINS(), etc.
  | 'operator'      // AND, OR, =, IN, etc.
  | 'variable'      // BUS_PROCESS, input.UNIT_ID
  | 'literal'       // "string", 123, true, null
  | 'array'         // {"a", "b"}
  | 'unary';        // NOT, !

export interface ExpressionNode {
  type: ExpressionNodeType;
  value: string;                    // The operator/function name/literal value
  children?: ExpressionNode[];      // For functions/operators
  raw: string;                      // Original text segment
}

export interface ParsedExpression {
  root: ExpressionNode | null;
  original: string;
  isValid: boolean;
  error?: string;
}

// Token types for lexer
type TokenType =
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'NULL'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'DOT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Tokenize a CPQ expression into tokens
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  // Skip leading = if present
  if (expression.startsWith('=')) {
    pos = 1;
  }

  while (pos < expression.length) {
    // Skip whitespace
    if (/\s/.test(expression[pos])) {
      pos++;
      continue;
    }

    const startPos = pos;

    // String literals (double or single quotes)
    if (expression[pos] === '"' || expression[pos] === "'") {
      const quote = expression[pos];
      pos++;
      let value = '';
      while (pos < expression.length && expression[pos] !== quote) {
        value += expression[pos];
        pos++;
      }
      pos++; // Skip closing quote
      tokens.push({ type: 'STRING', value, position: startPos });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(expression[pos]) || (expression[pos] === '-' && /[0-9]/.test(expression[pos + 1] || ''))) {
      let value = '';
      if (expression[pos] === '-') {
        value = '-';
        pos++;
      }
      while (pos < expression.length && /[0-9.]/.test(expression[pos])) {
        value += expression[pos];
        pos++;
      }
      tokens.push({ type: 'NUMBER', value, position: startPos });
      continue;
    }

    // Multi-character operators
    const twoChar = expression.slice(pos, pos + 2);
    if (['!=', '<>', '<=', '>='].includes(twoChar)) {
      tokens.push({ type: 'OPERATOR', value: twoChar, position: startPos });
      pos += 2;
      continue;
    }

    // Single character operators and delimiters
    if ('=<>+-*/!'.includes(expression[pos])) {
      tokens.push({ type: 'OPERATOR', value: expression[pos], position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === '{') {
      tokens.push({ type: 'LBRACE', value: '{', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === '}') {
      tokens.push({ type: 'RBRACE', value: '}', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === '[') {
      tokens.push({ type: 'LBRACKET', value: '[', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === ']') {
      tokens.push({ type: 'RBRACKET', value: ']', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === ',') {
      tokens.push({ type: 'COMMA', value: ',', position: startPos });
      pos++;
      continue;
    }

    if (expression[pos] === '.') {
      tokens.push({ type: 'DOT', value: '.', position: startPos });
      pos++;
      continue;
    }

    // Identifiers and keywords (AND, OR, IN, NOTIN, NOT, TRUE, FALSE, NULL, function names)
    if (/[a-zA-Z_]/.test(expression[pos])) {
      let value = '';
      while (pos < expression.length && /[a-zA-Z0-9_]/.test(expression[pos])) {
        value += expression[pos];
        pos++;
      }

      const upper = value.toUpperCase();

      // Check for boolean literals
      if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'BOOLEAN', value: upper, position: startPos });
        continue;
      }

      // Check for null
      if (upper === 'NULL') {
        tokens.push({ type: 'NULL', value: 'null', position: startPos });
        continue;
      }

      // Check for operators (AND, OR, IN, NOTIN, NOT)
      if (['AND', 'OR', 'IN', 'NOTIN', 'NOT'].includes(upper)) {
        tokens.push({ type: 'OPERATOR', value: upper, position: startPos });
        continue;
      }

      // Otherwise it's an identifier (variable or function name)
      tokens.push({ type: 'IDENTIFIER', value, position: startPos });
      continue;
    }

    // Unknown character - skip it
    pos++;
  }

  tokens.push({ type: 'EOF', value: '', position: pos });
  return tokens;
}

/**
 * Recursive descent parser for CPQ expressions
 */
class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private original: string;

  constructor(tokens: Token[], original: string) {
    this.tokens = tokens;
    this.original = original;
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', position: 0 };
  }

  private advance(): Token {
    const token = this.current();
    this.pos++;
    return token;
  }

  private peek(offset: number = 0): Token {
    return this.tokens[this.pos + offset] || { type: 'EOF', value: '', position: 0 };
  }

  private match(type: TokenType, value?: string): boolean {
    const token = this.current();
    if (token.type === type && (value === undefined || token.value.toUpperCase() === value.toUpperCase())) {
      return true;
    }
    return false;
  }

  private expect(type: TokenType, value?: string): Token {
    if (this.match(type, value)) {
      return this.advance();
    }
    throw new Error(`Expected ${type}${value ? ` '${value}'` : ''} but got ${this.current().type} '${this.current().value}'`);
  }

  parse(): ExpressionNode | null {
    if (this.current().type === 'EOF') {
      return null;
    }
    return this.parseOr();
  }

  // OR has lowest precedence
  private parseOr(): ExpressionNode {
    let left = this.parseAnd();

    while (this.match('OPERATOR', 'OR')) {
      const op = this.advance();
      const right = this.parseAnd();
      left = {
        type: 'operator',
        value: 'OR',
        children: [left, right],
        raw: `${left.raw} OR ${right.raw}`,
      };
    }

    return left;
  }

  private parseAnd(): ExpressionNode {
    let left = this.parseNot();

    while (this.match('OPERATOR', 'AND')) {
      const op = this.advance();
      const right = this.parseNot();
      left = {
        type: 'operator',
        value: 'AND',
        children: [left, right],
        raw: `${left.raw} AND ${right.raw}`,
      };
    }

    return left;
  }

  private parseNot(): ExpressionNode {
    if (this.match('OPERATOR', 'NOT') || this.match('OPERATOR', '!')) {
      const op = this.advance();
      const operand = this.parseNot();
      return {
        type: 'unary',
        value: 'NOT',
        children: [operand],
        raw: `NOT ${operand.raw}`,
      };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExpressionNode {
    let left = this.parseInNotIn();

    const compOps = ['=', '!=', '<>', '<', '>', '<=', '>='];
    while (this.current().type === 'OPERATOR' && compOps.includes(this.current().value)) {
      const op = this.advance();
      const right = this.parseInNotIn();
      left = {
        type: 'operator',
        value: op.value === '<>' ? '!=' : op.value,
        children: [left, right],
        raw: `${left.raw} ${op.value} ${right.raw}`,
      };
    }

    return left;
  }

  private parseInNotIn(): ExpressionNode {
    let left = this.parseAddSub();

    while (this.match('OPERATOR', 'IN') || this.match('OPERATOR', 'NOTIN')) {
      const op = this.advance();
      const right = this.parseAddSub();
      left = {
        type: 'operator',
        value: op.value.toUpperCase(),
        children: [left, right],
        raw: `${left.raw} ${op.value.toUpperCase()} ${right.raw}`,
      };
    }

    return left;
  }

  private parseAddSub(): ExpressionNode {
    let left = this.parseMulDiv();

    while (this.current().type === 'OPERATOR' && ['+', '-'].includes(this.current().value)) {
      const op = this.advance();
      const right = this.parseMulDiv();
      left = {
        type: 'operator',
        value: op.value,
        children: [left, right],
        raw: `${left.raw} ${op.value} ${right.raw}`,
      };
    }

    return left;
  }

  private parseMulDiv(): ExpressionNode {
    let left = this.parsePrimary();

    while (this.current().type === 'OPERATOR' && ['*', '/'].includes(this.current().value)) {
      const op = this.advance();
      const right = this.parsePrimary();
      left = {
        type: 'operator',
        value: op.value,
        children: [left, right],
        raw: `${left.raw} ${op.value} ${right.raw}`,
      };
    }

    return left;
  }

  private parsePrimary(): ExpressionNode {
    const token = this.current();

    // Parenthesized expression
    if (token.type === 'LPAREN') {
      this.advance();
      const expr = this.parseOr();
      this.expect('RPAREN');
      return expr;
    }

    // Array literal
    if (token.type === 'LBRACE') {
      return this.parseArray();
    }

    // String literal
    if (token.type === 'STRING') {
      this.advance();
      return {
        type: 'literal',
        value: `"${token.value}"`,
        raw: `"${token.value}"`,
      };
    }

    // Number literal
    if (token.type === 'NUMBER') {
      this.advance();
      return {
        type: 'literal',
        value: token.value,
        raw: token.value,
      };
    }

    // Boolean literal
    if (token.type === 'BOOLEAN') {
      this.advance();
      return {
        type: 'literal',
        value: token.value,
        raw: token.value,
      };
    }

    // Null literal
    if (token.type === 'NULL') {
      this.advance();
      return {
        type: 'literal',
        value: 'null',
        raw: 'null',
      };
    }

    // Identifier (variable or function call)
    if (token.type === 'IDENTIFIER') {
      return this.parseIdentifierOrFunction();
    }

    // Unary minus
    if (token.type === 'OPERATOR' && token.value === '-') {
      this.advance();
      const operand = this.parsePrimary();
      return {
        type: 'unary',
        value: '-',
        children: [operand],
        raw: `-${operand.raw}`,
      };
    }

    throw new Error(`Unexpected token: ${token.type} '${token.value}'`);
  }

  private parseIdentifierOrFunction(): ExpressionNode {
    let name = this.advance().value;
    let raw = name;

    // Check if it's a function call
    if (this.match('LPAREN')) {
      this.advance(); // consume (
      const args: ExpressionNode[] = [];

      if (!this.match('RPAREN')) {
        args.push(this.parseOr());
        while (this.match('COMMA')) {
          this.advance();
          args.push(this.parseOr());
        }
      }

      this.expect('RPAREN');

      const argsRaw = args.map(a => a.raw).join(', ');
      return {
        type: 'function',
        value: name.toUpperCase(),
        children: args,
        raw: `${name}(${argsRaw})`,
      };
    }

    // Variable with possible property access (dot or bracket notation)
    while (this.match('DOT') || this.match('LBRACKET')) {
      if (this.match('DOT')) {
        this.advance();
        if (this.match('IDENTIFIER')) {
          const prop = this.advance().value;
          name += '.' + prop;
          raw += '.' + prop;
        }
      } else if (this.match('LBRACKET')) {
        this.advance();
        // Handle bracket contents - could be identifier, string, or expression
        if (this.match('STRING')) {
          const key = this.advance().value;
          name += `["${key}"]`;
          raw += `["${key}"]`;
        } else if (this.match('IDENTIFIER')) {
          const key = this.advance().value;
          name += `[${key}]`;
          raw += `[${key}]`;
        } else if (this.match('NUMBER')) {
          const key = this.advance().value;
          name += `[${key}]`;
          raw += `[${key}]`;
        } else {
          // Complex expression in brackets
          const expr = this.parseOr();
          name += `[${expr.raw}]`;
          raw += `[${expr.raw}]`;
        }
        this.expect('RBRACKET');
      }
    }

    return {
      type: 'variable',
      value: name,
      raw,
    };
  }

  private parseArray(): ExpressionNode {
    this.expect('LBRACE');
    const elements: ExpressionNode[] = [];

    if (!this.match('RBRACE')) {
      elements.push(this.parseOr());
      while (this.match('COMMA')) {
        this.advance();
        if (!this.match('RBRACE')) {
          elements.push(this.parseOr());
        }
      }
    }

    this.expect('RBRACE');

    const elementsRaw = elements.map(e => e.raw).join(', ');
    return {
      type: 'array',
      value: `{${elementsRaw}}`,
      children: elements,
      raw: `{${elementsRaw}}`,
    };
  }
}

/**
 * Parse a CPQ expression string into an AST
 */
export function parseExpression(expression: string): ParsedExpression {
  if (!expression || expression.trim() === '' || expression.trim() === '=') {
    return {
      root: null,
      original: expression,
      isValid: false,
      error: 'Empty expression',
    };
  }

  try {
    const tokens = tokenize(expression);
    const parser = new Parser(tokens, expression);
    const root = parser.parse();

    return {
      root,
      original: expression,
      isValid: root !== null,
    };
  } catch (error) {
    return {
      root: null,
      original: expression,
      isValid: false,
      error: error instanceof Error ? error.message : 'Parse error',
    };
  }
}
