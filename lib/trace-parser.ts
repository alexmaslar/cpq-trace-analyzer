/**
 * CPQ Trace Parser
 * Parses Infor CPQ interactive trace files to extract configuration data.
 * Focuses on universal CPQ engine patterns that work across implementations.
 */

export interface ConfigurationMetadata {
  instance: string;
  application: string;
  configurationId: string;
  partNumber: string;
  partNamespace: string;
  configurationMode: string;
  headerID: string;
}

export interface FeatureData {
  name: string;
  caption: string;
  selectedValue: string | null;
  options: string[]; // Available options from Option List Group
  optionListId: string | null; // Reference to full option list
  optionListGroup: string | null; // Reference to filtered group
  lineNumber: number; // Line in trace where this feature appears
}

export interface ParsedTrace {
  metadata: ConfigurationMetadata;
  features: Map<string, FeatureData>;
  rulesSummary: RuleExecutionSummary;
  integrationOutputs: IntegrationOutputSummary;
  variableTracking: VariableTrackingSummary;
  conditionTracking: ConditionSummary;
  issues: IssuesSummary;
  timeline: RuleExecutionTimeline;
  rulesExecuted: number;
  rollbackPoints: number;
  parseErrors: string[];
}

// Rule execution types
export interface RuleStats {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  ruleset: string;
  executionCount: number;
}

export interface RulesetSummary {
  name: string;
  namespace: string;
  executionCount: number;
  rules: Map<string, RuleStats>;
}

export interface RuleExecutionSummary {
  totalExecutions: number;
  uniqueRules: number;
  rulesets: Map<string, RulesetSummary>;
  topRules: RuleStats[];
  ruleTypeBreakdown: Map<string, number>;
}

// Integration output types
export interface IntegrationOutputRow {
  id: string; // IntegrationOutputID
  properties: Map<string, string | number | null>;
  lineNumber: number;
}

export interface IntegrationTemplate {
  name: string;
  columns: string[]; // Property names in order of first appearance
  rows: IntegrationOutputRow[];
}

export interface IntegrationOutputSummary {
  templates: Map<string, IntegrationTemplate>;
  totalRows: number;
}

// Variable tracking types
export interface VariableAssignment {
  variableName: string;        // Raw name from trace (e.g., "ROOT[infeat]")
  displayName: string;         // Resolved name (e.g., "root.Feature")
  assignmentExpression: string; // "=input.BUS_PROCESS" or plain value
  previousValue: string | null;
  resultValue: string | null;
  lineNumber: number;
  ruleType: string;            // "VariableRule", "ForEachRule"
  ruleName: string;            // Rule description
  ruleset: string;             // Full ruleset name
}

export interface VariableSummary {
  name: string;                // Display name (resolved)
  rawName: string;             // Original name from trace
  assignments: VariableAssignment[];
  finalValue: string | null;
  assignmentCount: number;
  firstAssignmentLine: number;
  lastAssignmentLine: number;
  hasChanges: boolean;         // Whether value changed between assignments
}

export interface VariableTrackingSummary {
  variables: Map<string, VariableSummary>;
  totalAssignments: number;
  uniqueVariables: number;
}

// Condition tracing types
export interface ConditionEvaluation {
  ruleId: string;
  ruleName: string;
  ruleType: string;             // "ConditionRule", "LoadRulesetRule", "VariableRule", etc.
  ruleset: string;
  expression: string;           // "=EXISTS(input.BUS_PROCESS)"
  trace: string;                // "Exists("CSR")"
  result: boolean;              // true or false
  lineNumber: number;
}

export interface ConditionSummary {
  totalConditions: number;
  firedCount: number;           // Result: True
  skippedCount: number;         // Result: False
  conditions: ConditionEvaluation[];
}

// Rule execution timeline types
export interface RuleExecution {
  executionId: number;          // Sequential ID in order of execution
  ruleId: string;
  ruleName: string;
  ruleType: string;
  ruleset: string;
  lineNumber: number;
  depth: number;                // Nesting depth (0 = top level, 1+ = triggered by LoadRulesetRule)
  parentExecutionId: number | null;  // ID of LoadRulesetRule that triggered this
  childExecutionIds: number[]; // IDs of rules triggered by this LoadRulesetRule
  duration?: {                  // Estimated from lines between this rule and next
    startLine: number;
    endLine: number;
  };
}

export interface RuleExecutionTimeline {
  executions: RuleExecution[];
  totalExecutions: number;
  maxDepth: number;
  rulesetOrder: string[];       // Order in which rulesets were first executed
  hotspots: {                   // Clusters of high activity
    startExecution: number;
    endExecution: number;
    ruleCount: number;
    ruleset: string;
  }[];
}

// Issue detection types
export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory = 'performance' | 'logic' | 'data' | 'configuration';

export interface DetectedIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  lineNumber: number;
  context: {
    ruleName?: string;
    ruleset?: string;
    variableName?: string;
    expression?: string;
    count?: number;
  };
}

export interface IssuesSummary {
  issues: DetectedIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Parse an Infor CPQ trace file
 * Extracts Screen Option sections which are standard CPQ engine output.
 * Options are resolved by tracing back from Option List Group GUIDs.
 */
export function parseTrace(traceContent: string): ParsedTrace {
  // Handle both Unix (\n) and Windows (\r\n) line endings
  const lines = traceContent.split(/\r?\n/);
  const parseErrors: string[] = [];

  // Initialize metadata with defaults
  const metadata: ConfigurationMetadata = {
    instance: '',
    application: '',
    configurationId: '',
    partNumber: '',
    partNamespace: '',
    configurationMode: '',
    headerID: '',
  };

  const features = new Map<string, FeatureData>();
  let rulesExecuted = 0;
  let rollbackPoints = 0;

  // Pattern matchers for metadata (XML header)
  const instancePattern = /<InputParameters Instance="([^"]+)" Application="([^"]+)">/;
  const configIdPattern = /<ConfigurationID>(\d+)<\/ConfigurationID>/;
  const partNumberPattern = /<PartNumber>([^<]+)<\/PartNumber>/;
  const partNamespacePattern = /<PartNamespace>([^<]+)<\/PartNamespace>/;
  const configModePattern = /<ConfigurationMode>([^<]+)<\/ConfigurationMode>/;
  const headerIdPattern = /<HeaderID>([^<]+)<\/HeaderID>/;

  // Universal CPQ engine patterns
  const screenOptionPattern = /^\s*Screen Option:\s*(\S+)/;
  const propertyPattern = /^\s+Property\s+:\s+(.+)/;
  const traceValuePattern = /^\s+Trace\s+:\s+"([^"]+)"/;
  const resultValuePattern = /^\s+Result\s+:\s+"([^"]+)"/;
  const resultArrayPattern = /^\s+Result\s+:\s+(\{.+\})/;
  const selectedValuePattern = /^\s+Value:\s*(.+)/;
  const rollbackPattern = /Rollback point (\d+)/;
  const rulesExecutedPattern = /^(\d+) rules executed/;
  const sectionDivider = /^-{10,}/;

  // PASS 1: Build map of Option List Group GUIDs to their options
  // Look for "Property : Group Name" followed by "Property : Group Values"
  const groupOptionsMap = new Map<string, string[]>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const propMatch = line.match(propertyPattern);

    if (propMatch && propMatch[1].trim() === 'Group Name') {
      // Look for Result with GUID on next few lines
      let groupGuid: string | null = null;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const resultMatch = lines[j].match(resultValuePattern);
        if (resultMatch) {
          groupGuid = resultMatch[1];
          break;
        }
      }

      // Now look for "Property : Group Values" nearby
      if (groupGuid) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextPropMatch = lines[j].match(propertyPattern);
          if (nextPropMatch && nextPropMatch[1].trim() === 'Group Values') {
            // Look for Result with options array
            for (let k = j + 1; k < Math.min(j + 5, lines.length); k++) {
              const arrayMatch = lines[k].match(resultArrayPattern);
              if (arrayMatch) {
                const options = parseOptionArray(arrayMatch[1]);
                groupOptionsMap.set(groupGuid, options);
                break;
              }
            }
            break;
          }
        }
      }
    }
  }

  // PASS 2: Parse trace for metadata, features, and stats
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Parse metadata from XML header
    const instanceMatch = line.match(instancePattern);
    if (instanceMatch) {
      metadata.instance = instanceMatch[1];
      metadata.application = instanceMatch[2];
    }

    const configIdMatch = line.match(configIdPattern);
    if (configIdMatch) {
      metadata.configurationId = configIdMatch[1];
    }

    const partNumMatch = line.match(partNumberPattern);
    if (partNumMatch && !metadata.partNumber) {
      metadata.partNumber = partNumMatch[1];
    }

    const partNsMatch = line.match(partNamespacePattern);
    if (partNsMatch) {
      metadata.partNamespace = partNsMatch[1];
    }

    const configModeMatch = line.match(configModePattern);
    if (configModeMatch) {
      metadata.configurationMode = configModeMatch[1];
    }

    const headerIdMatch = line.match(headerIdPattern);
    if (headerIdMatch) {
      metadata.headerID = headerIdMatch[1];
    }

    // Track rollback points
    const rollbackMatch = line.match(rollbackPattern);
    if (rollbackMatch) {
      rollbackPoints = Math.max(rollbackPoints, parseInt(rollbackMatch[1]));
    }

    // Track rules executed
    const rulesMatch = line.match(rulesExecutedPattern);
    if (rulesMatch) {
      rulesExecuted = parseInt(rulesMatch[1]);
    }

    // Parse Screen Option sections (standard CPQ engine output)
    const screenMatch = line.match(screenOptionPattern);
    if (screenMatch) {
      const featureName = screenMatch[1];
      const featureLineNumber = i + 1; // 1-indexed for display
      let caption = featureName;
      let selectedValue: string | null = null;
      let optionListId: string | null = null;
      let optionListGroup: string | null = null;

      // Look ahead within this section to find properties and Value
      for (let j = i + 1; j < lines.length; j++) {
        const sectionLine = lines[j];

        // Stop at section divider
        if (sectionDivider.test(sectionLine)) {
          break;
        }

        const propMatch = sectionLine.match(propertyPattern);
        if (propMatch) {
          const propName = propMatch[1].trim();

          // Look for Result/Trace on next few lines based on property type
          if (propName === 'Caption') {
            for (let k = j + 1; k < Math.min(j + 4, lines.length); k++) {
              const traceMatch = lines[k].match(traceValuePattern);
              if (traceMatch) {
                caption = traceMatch[1];
                break;
              }
              const resultMatch = lines[k].match(resultValuePattern);
              if (resultMatch) {
                caption = resultMatch[1];
                break;
              }
            }
          } else if (propName === 'Option List Id') {
            for (let k = j + 1; k < Math.min(j + 4, lines.length); k++) {
              const resultMatch = lines[k].match(resultValuePattern);
              if (resultMatch) {
                optionListId = resultMatch[1];
                break;
              }
            }
          } else if (propName === 'Option List Group') {
            for (let k = j + 1; k < Math.min(j + 4, lines.length); k++) {
              const resultMatch = lines[k].match(resultValuePattern);
              if (resultMatch) {
                optionListGroup = resultMatch[1];
                break;
              }
            }
          }
        }

        // Look for selected Value (at end of Screen Option section)
        const valueMatch = sectionLine.match(selectedValuePattern);
        if (valueMatch) {
          const val = valueMatch[1].trim();
          // Handle null, empty, and unassigned values
          if (val === 'null' || val === '(unassigned)' || val === '""' || val === '') {
            selectedValue = null;
          } else {
            // Remove surrounding quotes if present
            selectedValue = val.replace(/^"|"$/g, '');
          }
          break; // Value is typically at the end of a Screen Option section
        }
      }

      // Look up options from the group GUID
      const options = optionListGroup ? (groupOptionsMap.get(optionListGroup) || []) : [];

      // Store or update feature (later occurrences may have updated values)
      features.set(featureName, {
        name: featureName,
        caption,
        selectedValue,
        options,
        optionListId,
        optionListGroup,
        lineNumber: featureLineNumber,
      });
    }

    i++;
  }

  // Parse rule executions
  const rulesSummary = parseRuleExecutions(lines);

  // Parse integration outputs
  const integrationOutputs = parseIntegrationOutputs(lines);

  // Parse variable assignments
  const variableTracking = parseVariableAssignments(lines);

  // Parse condition evaluations
  const conditionTracking = parseConditions(lines);

  // Parse rule execution timeline
  const timeline = parseRuleExecutionTimeline(lines);

  // Detect issues and warnings
  const issues = detectIssues({
    rulesSummary,
    conditionTracking,
    variableTracking,
    rollbackPoints,
    lines,
  });

  return {
    metadata,
    features,
    rulesSummary,
    integrationOutputs,
    variableTracking,
    conditionTracking,
    issues,
    timeline,
    rulesExecuted,
    rollbackPoints,
    parseErrors,
  };
}

/**
 * Parse an option array string like {"OPT1", "OPT2", "OPT3"}
 */
function parseOptionArray(arrayStr: string): string[] {
  const match = arrayStr.match(/\{([^}]*)\}/);
  if (!match) return [];

  const content = match[1];
  const options: string[] = [];

  // Extract quoted strings
  const quotedPattern = /"([^"]+)"/g;
  let m;
  while ((m = quotedPattern.exec(content)) !== null) {
    options.push(m[1]);
  }

  return options;
}

/**
 * Parse rule executions from trace content
 */
function parseRuleExecutions(lines: string[]): RuleExecutionSummary {
  const rulesets = new Map<string, RulesetSummary>();
  const ruleTypeBreakdown = new Map<string, number>();
  const ruleExecutionCounts = new Map<string, RuleStats>();
  let totalExecutions = 0;

  // Pattern: Ruleset: <name> Rule: <id> <name> (Ruleset: <name>)
  const rulesetPattern = /^Ruleset: (\S+) Rule: (\d+) (.+?) \(Ruleset:/;
  // Rule type appears on the next line
  const ruleTypePattern = /^(ConditionRule|VariableRule|LoadRulesetRule|CreateComponentRule|CreateDynamicOptionListRule|CreateDynamicOptionListGroupRule|ScreenDisplayRule|ForEachRule|LoopRule)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ruleMatch = line.match(rulesetPattern);

    if (ruleMatch) {
      const rulesetName = ruleMatch[1];
      const ruleId = ruleMatch[2];
      const ruleName = ruleMatch[3].trim();
      totalExecutions++;

      // Look for rule type on next line
      let ruleType = 'Unknown';
      if (i + 1 < lines.length) {
        const typeMatch = lines[i + 1].match(ruleTypePattern);
        if (typeMatch) {
          ruleType = typeMatch[1];
        }
      }

      // Extract namespace from ruleset name (first segment)
      const namespace = rulesetName.split('.')[0];

      // Update ruleset summary
      if (!rulesets.has(rulesetName)) {
        rulesets.set(rulesetName, {
          name: rulesetName,
          namespace,
          executionCount: 0,
          rules: new Map(),
        });
      }
      const rulesetSummary = rulesets.get(rulesetName)!;
      rulesetSummary.executionCount++;

      // Create unique key for rule
      const ruleKey = `${rulesetName}:${ruleId}`;

      // Update rule stats within ruleset
      if (!rulesetSummary.rules.has(ruleKey)) {
        rulesetSummary.rules.set(ruleKey, {
          ruleId,
          ruleName,
          ruleType,
          ruleset: rulesetName,
          executionCount: 0,
        });
      }
      rulesetSummary.rules.get(ruleKey)!.executionCount++;

      // Track global rule counts for top rules
      if (!ruleExecutionCounts.has(ruleKey)) {
        ruleExecutionCounts.set(ruleKey, {
          ruleId,
          ruleName,
          ruleType,
          ruleset: rulesetName,
          executionCount: 0,
        });
      }
      ruleExecutionCounts.get(ruleKey)!.executionCount++;

      // Update rule type breakdown
      ruleTypeBreakdown.set(ruleType, (ruleTypeBreakdown.get(ruleType) || 0) + 1);
    }
  }

  // Get top rules by execution count
  const topRules = Array.from(ruleExecutionCounts.values())
    .sort((a, b) => b.executionCount - a.executionCount)
    .slice(0, 20);

  return {
    totalExecutions,
    uniqueRules: ruleExecutionCounts.size,
    rulesets,
    topRules,
    ruleTypeBreakdown,
  };
}

/**
 * Parse integration outputs (Template sections) from trace content
 */
function parseIntegrationOutputs(lines: string[]): IntegrationOutputSummary {
  const templates = new Map<string, IntegrationTemplate>();
  let totalRows = 0;

  // Pattern to match Template: <name>
  const templatePattern = /^\s+Template:\s+(.+)$/;
  // Pattern to match Property : <name>
  const propertyPattern = /^\s+Property\s+:\s+(.+)$/;
  // Patterns to extract values
  const resultStringPattern = /^\s+Result\s+:\s+"([^"]*)"/;
  const resultNumberPattern = /^\s+Result\s+:\s+(-?\d+\.?\d*)/;
  const resultNullPattern = /^\s+Result\s+:\s+(null|\{\}|\(unassigned\))/;
  const sectionDivider = /^-{10,}/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const templateMatch = line.match(templatePattern);

    if (templateMatch) {
      const templateName = templateMatch[1].trim();
      const lineNumber = i + 1; // 1-indexed
      const properties = new Map<string, string | number | null>();
      let integrationOutputId = '0';

      // Parse all properties in this template section
      for (let j = i + 1; j < lines.length; j++) {
        const sectionLine = lines[j];

        // Stop at section divider
        if (sectionDivider.test(sectionLine)) {
          break;
        }

        const propMatch = sectionLine.match(propertyPattern);
        if (propMatch) {
          const propName = propMatch[1].trim();

          // Look for Result on next few lines
          for (let k = j + 1; k < Math.min(j + 6, lines.length); k++) {
            const resultLine = lines[k];

            // Check for next Property or section end
            if (propertyPattern.test(resultLine) || sectionDivider.test(resultLine)) {
              break;
            }

            const stringMatch = resultLine.match(resultStringPattern);
            if (stringMatch) {
              properties.set(propName, stringMatch[1]);
              if (propName === 'IntegrationOutputID') {
                integrationOutputId = stringMatch[1];
              }
              break;
            }

            const numberMatch = resultLine.match(resultNumberPattern);
            if (numberMatch) {
              const numValue = parseFloat(numberMatch[1]);
              properties.set(propName, numValue);
              if (propName === 'IntegrationOutputID') {
                integrationOutputId = numberMatch[1];
              }
              break;
            }

            const nullMatch = resultLine.match(resultNullPattern);
            if (nullMatch) {
              properties.set(propName, null);
              break;
            }
          }
        }
      }

      // Only add if we got some properties
      if (properties.size > 0) {
        // Initialize template if not exists
        if (!templates.has(templateName)) {
          templates.set(templateName, {
            name: templateName,
            columns: [],
            rows: [],
          });
        }

        const template = templates.get(templateName)!;

        // Add new columns in order of first appearance
        for (const propName of properties.keys()) {
          if (!template.columns.includes(propName)) {
            template.columns.push(propName);
          }
        }

        // Add the row
        template.rows.push({
          id: integrationOutputId,
          properties,
          lineNumber,
        });

        totalRows++;
      }
    }

    i++;
  }

  return { templates, totalRows };
}

/**
 * Parse variable assignments from trace content
 * Resolves indexed variables like ROOT[infeat] to root.Feature
 */
function parseVariableAssignments(lines: string[]): VariableTrackingSummary {
  const assignments: VariableAssignment[] = [];
  const variableValues = new Map<string, string>(); // Track current values for index resolution

  // Patterns for rule context
  const rulesetPattern = /^Ruleset: (\S+) Rule: (\d+) (.+?) \(Ruleset:/;
  const ruleTypePattern = /^(ConditionRule|VariableRule|LoadRulesetRule|CreateComponentRule|CreateDynamicOptionListRule|CreateDynamicOptionListGroupRule|ScreenDisplayRule|ForEachRule|LoopRule)/;

  // Patterns for variable assignments
  const variablePattern = /^\s+Variable\s+:\s+(.+)/;
  const assignmentPattern = /^\s+Assignment\s+:\s+(.+)/;
  const previousPattern = /^\s+Previous\s+:\s+(.+)/;
  const resultPattern = /^\s+Result\s+:\s+(.+)/;

  let currentRuleset = '';
  let currentRuleName = '';
  let currentRuleType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track rule context
    const ruleMatch = line.match(rulesetPattern);
    if (ruleMatch) {
      currentRuleset = ruleMatch[1];
      currentRuleName = ruleMatch[3].trim();

      // Look for rule type on next line
      if (i + 1 < lines.length) {
        const typeMatch = lines[i + 1].match(ruleTypePattern);
        if (typeMatch) {
          currentRuleType = typeMatch[1];
        }
      }
    }

    // Look for Variable : lines
    const varMatch = line.match(variablePattern);
    if (varMatch) {
      const rawVariableName = varMatch[1].trim();
      let assignmentExpr = '';
      let previousValue: string | null = null;
      let resultValue: string | null = null;

      // Look ahead for Assignment, Previous, Result
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j];

        // Stop if we hit another Variable line or section end
        if (variablePattern.test(nextLine) || /^-{10,}/.test(nextLine) || rulesetPattern.test(nextLine)) {
          break;
        }

        const assignMatch = nextLine.match(assignmentPattern);
        if (assignMatch) {
          assignmentExpr = assignMatch[1].trim();
        }

        const prevMatch = nextLine.match(previousPattern);
        if (prevMatch) {
          previousValue = parseVariableValue(prevMatch[1].trim());
        }

        const resMatch = nextLine.match(resultPattern);
        if (resMatch) {
          resultValue = parseVariableValue(resMatch[1].trim());
          break; // Result is typically the last field
        }
      }

      // Resolve display name (handles indexed variables)
      const displayName = resolveVariableName(rawVariableName, variableValues);

      // Store the assignment
      assignments.push({
        variableName: rawVariableName,
        displayName,
        assignmentExpression: assignmentExpr,
        previousValue,
        resultValue,
        lineNumber: i + 1, // 1-indexed
        ruleType: currentRuleType,
        ruleName: currentRuleName,
        ruleset: currentRuleset,
      });

      // Track the value for future index resolution
      // Use the display name as the key for simple variables
      if (resultValue !== null) {
        // Store by raw name for index lookup
        variableValues.set(rawVariableName.toLowerCase(), resultValue);
        // Also store without case sensitivity for flexible matching
        const simpleName = rawVariableName.replace(/\[.*\]/, '').toLowerCase();
        if (!variableValues.has(simpleName)) {
          variableValues.set(simpleName, resultValue);
        }
      }
    }
  }

  // Group assignments by display name
  const variablesMap = new Map<string, VariableSummary>();

  for (const assignment of assignments) {
    const key = assignment.displayName;

    if (!variablesMap.has(key)) {
      variablesMap.set(key, {
        name: assignment.displayName,
        rawName: assignment.variableName,
        assignments: [],
        finalValue: null,
        assignmentCount: 0,
        firstAssignmentLine: assignment.lineNumber,
        lastAssignmentLine: assignment.lineNumber,
        hasChanges: false,
      });
    }

    const summary = variablesMap.get(key)!;
    summary.assignments.push(assignment);
    summary.assignmentCount++;
    summary.lastAssignmentLine = assignment.lineNumber;
    summary.finalValue = assignment.resultValue;

    // Check if value changed
    if (assignment.previousValue !== null &&
        assignment.resultValue !== null &&
        assignment.previousValue !== assignment.resultValue &&
        assignment.previousValue !== '(unassigned)') {
      summary.hasChanges = true;
    }
  }

  return {
    variables: variablesMap,
    totalAssignments: assignments.length,
    uniqueVariables: variablesMap.size,
  };
}

/**
 * Parse a variable value from trace output
 * Handles: "value", null, (unassigned), numbers
 */
function parseVariableValue(value: string): string | null {
  if (value === 'null' || value === '(unassigned)') {
    return value;
  }

  // Remove surrounding quotes if present
  const quotedMatch = value.match(/^"(.*)"/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  return value;
}

/**
 * Resolve indexed variable names like ROOT[infeat] to root.Feature
 * Uses tracked variable values to resolve the index
 */
function resolveVariableName(rawName: string, variableValues: Map<string, string>): string {
  // Match indexed patterns like ROOT[infeat], root[someVar]
  const indexedPattern = /^(\w+)\[(\w+)\]$/;
  const match = rawName.match(indexedPattern);

  if (match) {
    const baseName = match[1].toLowerCase(); // ROOT -> root
    const indexVar = match[2].toLowerCase();

    // Look up the value of the index variable
    const indexValue = variableValues.get(indexVar);

    if (indexValue) {
      // Return resolved form: root.Feature
      return `${baseName}.${indexValue}`;
    }

    // If we can't resolve, return with the variable name: root[infeat]
    return `${baseName}[${match[2]}]`;
  }

  // Handle nested patterns like root.MullLevelFlag
  // Just normalize casing for consistency
  return rawName;
}

/**
 * Parse condition evaluations from trace content
 * Tracks which conditions evaluated True/False for rule firing decisions
 */
function parseConditions(lines: string[]): ConditionSummary {
  const conditions: ConditionEvaluation[] = [];

  // Patterns for rule context
  const rulesetPattern = /^Ruleset: (\S+) Rule: (\d+) (.+?) \(Ruleset:/;
  const ruleTypePattern = /^(ConditionRule|VariableRule|LoadRulesetRule|CreateComponentRule|CreateDynamicOptionListRule|CreateDynamicOptionListGroupRule|ScreenDisplayRule|ForEachRule|LoopRule|ClearUserValueRule)/;

  // Pattern 1: RuleCondition Property (ConditionRule, LoadRulesetRule, ClearUserValueRule)
  const ruleConditionPropertyPattern = /^\s+Property\s+:\s+RuleCondition/;
  const expressionPattern = /^\s+Expression\s+:\s+=(.+)/;
  const tracePattern = /^\s+Trace\s+:\s+(.+)/;
  const resultBoolPattern = /^\s+Result\s+:\s+(True|False)/;

  // Pattern 2: VariableRule with Condition Expression/Result
  const conditionExpressionPattern = /^\s+Condition Expression\s+:\s+=(.+)/;
  const conditionResultPattern = /^\s+Condition Result\s+:\s+(True|False)/;

  let currentRuleset = '';
  let currentRuleId = '';
  let currentRuleName = '';
  let currentRuleType = '';
  let currentRuleLineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track rule context
    const ruleMatch = line.match(rulesetPattern);
    if (ruleMatch) {
      currentRuleset = ruleMatch[1];
      currentRuleId = ruleMatch[2];
      currentRuleName = ruleMatch[3].trim();
      currentRuleLineNumber = i + 1;

      // Look for rule type on next line
      if (i + 1 < lines.length) {
        const typeMatch = lines[i + 1].match(ruleTypePattern);
        if (typeMatch) {
          currentRuleType = typeMatch[1];
        }
      }
    }

    // Pattern 1: Property : RuleCondition
    if (ruleConditionPropertyPattern.test(line)) {
      let expression = '';
      let trace = '';
      let result: boolean | null = null;
      const conditionLineNumber = i + 1;

      // Look ahead for Expression, Trace, Result
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];

        // Stop if we hit another Property or section divider
        if (/^\s+Property\s+:/.test(nextLine) || /^-{10,}/.test(nextLine) || rulesetPattern.test(nextLine)) {
          break;
        }

        const exprMatch = nextLine.match(expressionPattern);
        if (exprMatch) {
          expression = `=${exprMatch[1].trim()}`;
        }

        const traceMatch = nextLine.match(tracePattern);
        if (traceMatch) {
          trace = traceMatch[1].trim();
        }

        const resultMatch = nextLine.match(resultBoolPattern);
        if (resultMatch) {
          result = resultMatch[1] === 'True';
          break; // Result is the last field we need
        }
      }

      // Only add if we got an expression and result
      if (expression && result !== null) {
        conditions.push({
          ruleId: currentRuleId,
          ruleName: currentRuleName,
          ruleType: currentRuleType,
          ruleset: currentRuleset,
          expression,
          trace,
          result,
          lineNumber: conditionLineNumber,
        });
      }
    }

    // Pattern 2: VariableRule Condition Expression (only if non-empty)
    const condExprMatch = line.match(conditionExpressionPattern);
    if (condExprMatch && currentRuleType === 'VariableRule') {
      const expression = `=${condExprMatch[1].trim()}`;
      let result: boolean | null = null;

      // Look ahead for Condition Result
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const resultMatch = lines[j].match(conditionResultPattern);
        if (resultMatch) {
          result = resultMatch[1] === 'True';
          break;
        }
      }

      // Only add if we got a result (expression is non-empty by regex match)
      if (result !== null) {
        conditions.push({
          ruleId: currentRuleId,
          ruleName: currentRuleName,
          ruleType: currentRuleType,
          ruleset: currentRuleset,
          expression,
          trace: '', // VariableRule conditions don't have trace
          result,
          lineNumber: i + 1,
        });
      }
    }
  }

  // Calculate summary stats
  const firedCount = conditions.filter(c => c.result).length;
  const skippedCount = conditions.filter(c => !c.result).length;

  return {
    totalConditions: conditions.length,
    firedCount,
    skippedCount,
    conditions,
  };
}

/**
 * Parse rule executions into a timeline showing order and relationships
 * Tracks which rules trigger other rules via LoadRulesetRule
 */
function parseRuleExecutionTimeline(lines: string[]): RuleExecutionTimeline {
  const executions: RuleExecution[] = [];
  const rulesetOrder: string[] = [];
  const seenRulesets = new Set<string>();

  // Pattern: Ruleset: <name> Rule: <id> <name> (Ruleset: <name>)
  const rulesetPattern = /^Ruleset: (\S+) Rule: (\d+) (.+?) \(Ruleset:/;
  const ruleTypePattern = /^(ConditionRule|VariableRule|LoadRulesetRule|CreateComponentRule|CreateDynamicOptionListRule|CreateDynamicOptionListGroupRule|ScreenDisplayRule|ForEachRule|LoopRule|ClearUserValueRule)/;

  // Stack to track ruleset nesting (LoadRulesetRule triggers)
  const rulesetStack: { ruleset: string; executionId: number }[] = [];
  let currentDepth = 0;
  let executionId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ruleMatch = line.match(rulesetPattern);

    if (ruleMatch) {
      const ruleset = ruleMatch[1];
      const ruleId = ruleMatch[2];
      const ruleName = ruleMatch[3].trim();

      // Look for rule type on next line
      let ruleType = 'Unknown';
      if (i + 1 < lines.length) {
        const typeMatch = lines[i + 1].match(ruleTypePattern);
        if (typeMatch) {
          ruleType = typeMatch[1];
        }
      }

      // Track ruleset order
      if (!seenRulesets.has(ruleset)) {
        seenRulesets.add(ruleset);
        rulesetOrder.push(ruleset);
      }

      // Handle depth changes based on ruleset switches
      // If we're in a different ruleset than the top of stack, we've gone deeper
      while (rulesetStack.length > 0 && rulesetStack[rulesetStack.length - 1].ruleset !== ruleset) {
        // Check if this ruleset is anywhere in the stack (coming back up)
        const stackIndex = rulesetStack.findIndex(s => s.ruleset === ruleset);
        if (stackIndex >= 0) {
          // Pop back to that level
          rulesetStack.splice(stackIndex + 1);
          currentDepth = rulesetStack.length;
          break;
        } else {
          // New ruleset - we're going deeper
          break;
        }
      }

      // Find parent (the LoadRulesetRule that triggered this ruleset)
      let parentExecutionId: number | null = null;
      if (rulesetStack.length > 0) {
        const parent = rulesetStack[rulesetStack.length - 1];
        if (parent.ruleset !== ruleset) {
          parentExecutionId = parent.executionId;
        }
      }

      const execution: RuleExecution = {
        executionId: executionId++,
        ruleId,
        ruleName,
        ruleType,
        ruleset,
        lineNumber: i + 1,
        depth: currentDepth,
        parentExecutionId,
        childExecutionIds: [],
        duration: { startLine: i + 1, endLine: i + 1 },
      };

      executions.push(execution);

      // If this is a LoadRulesetRule, push to stack for tracking children
      if (ruleType === 'LoadRulesetRule') {
        rulesetStack.push({ ruleset, executionId: execution.executionId });
        currentDepth++;
      }

      // Update parent's child list
      if (parentExecutionId !== null) {
        const parent = executions.find(e => e.executionId === parentExecutionId);
        if (parent) {
          parent.childExecutionIds.push(execution.executionId);
        }
      }
    }
  }

  // Calculate end lines (duration) - each rule ends when the next one starts
  for (let i = 0; i < executions.length - 1; i++) {
    executions[i].duration = {
      startLine: executions[i].lineNumber,
      endLine: executions[i + 1].lineNumber - 1,
    };
  }

  // Find hotspots (clusters of high activity in same ruleset)
  const hotspots: RuleExecutionTimeline['hotspots'] = [];
  const HOTSPOT_THRESHOLD = 10; // Min rules to be a hotspot

  let currentHotspot: { ruleset: string; start: number; count: number } | null = null;

  for (let i = 0; i < executions.length; i++) {
    const exec = executions[i];

    if (currentHotspot && currentHotspot.ruleset === exec.ruleset) {
      currentHotspot.count++;
    } else {
      // Save previous hotspot if it meets threshold
      if (currentHotspot && currentHotspot.count >= HOTSPOT_THRESHOLD) {
        hotspots.push({
          startExecution: currentHotspot.start,
          endExecution: i - 1,
          ruleCount: currentHotspot.count,
          ruleset: currentHotspot.ruleset,
        });
      }
      // Start new hotspot tracking
      currentHotspot = { ruleset: exec.ruleset, start: i, count: 1 };
    }
  }

  // Don't forget the last hotspot
  if (currentHotspot && currentHotspot.count >= HOTSPOT_THRESHOLD) {
    hotspots.push({
      startExecution: currentHotspot.start,
      endExecution: executions.length - 1,
      ruleCount: currentHotspot.count,
      ruleset: currentHotspot.ruleset,
    });
  }

  // Calculate max depth
  const maxDepth = executions.reduce((max, e) => Math.max(max, e.depth), 0);

  return {
    executions,
    totalExecutions: executions.length,
    maxDepth,
    rulesetOrder,
    hotspots,
  };
}

/**
 * Compare two parsed traces and find differences
 */
export interface TraceDiff {
  addedFeatures: string[];
  removedFeatures: string[];
  optionChanges: OptionChange[];
  valueChanges: ValueChange[];
  metadataChanges: MetadataChange[];
  integrationOutputDiff: IntegrationOutputDiff;
  variableDiff: VariableDiff;
  conditionDiff: ConditionDiff;
}

// Integration output comparison types
export interface IntegrationOutputDiff {
  addedTemplates: string[];
  removedTemplates: string[];
  templateDiffs: Map<string, TemplateDiff>;
}

export interface TemplateDiff {
  templateName: string;
  addedRows: IntegrationOutputRow[];
  removedRows: IntegrationOutputRow[];
  changedRows: RowChange[];
  addedColumns: string[];
  removedColumns: string[];
}

export interface RowChange {
  id: string;
  baselineRow: IntegrationOutputRow;
  currentRow: IntegrationOutputRow;
  changedProperties: PropertyChange[];
}

export interface PropertyChange {
  property: string;
  baselineValue: string | number | null;
  currentValue: string | number | null;
}

// Variable diff types
export interface VariableDiff {
  changedVariables: VariableChange[];
  addedVariables: string[];
  removedVariables: string[];
  totalChanges: number;
}

export interface VariableChange {
  variableName: string;
  baselineFinalValue: string | null;
  currentFinalValue: string | null;
  baselineAssignmentCount: number;
  currentAssignmentCount: number;
}

// Condition diff types
export interface ConditionDiff {
  changedConditions: ConditionChange[];
  addedConditions: ConditionEvaluation[];      // Conditions only in current trace
  removedConditions: ConditionEvaluation[];    // Conditions only in baseline trace
  totalChanges: number;
}

export interface ConditionChange {
  ruleId: string;
  ruleName: string;
  ruleset: string;
  expression: string;
  baselineResult: boolean;
  currentResult: boolean;
}

export interface ValueChange {
  feature: string;
  baselineValue: string | null;
  currentValue: string | null;
}

export interface OptionChange {
  feature: string;
  baselineOptions: string[];
  currentOptions: string[];
  addedOptions: string[];
  removedOptions: string[];
}

export interface MetadataChange {
  field: string;
  baseline: string;
  current: string;
}

export function compareTraces(baseline: ParsedTrace, current: ParsedTrace): TraceDiff {
  const addedFeatures: string[] = [];
  const removedFeatures: string[] = [];
  const optionChanges: OptionChange[] = [];
  const valueChanges: ValueChange[] = [];
  const metadataChanges: MetadataChange[] = [];

  // Find added/removed features
  const baselineFeatures = new Set(baseline.features.keys());
  const currentFeatures = new Set(current.features.keys());

  for (const feature of currentFeatures) {
    if (!baselineFeatures.has(feature)) {
      addedFeatures.push(feature);
    }
  }

  for (const feature of baselineFeatures) {
    if (!currentFeatures.has(feature)) {
      removedFeatures.push(feature);
    }
  }

  // Compare options and values for features in both traces
  for (const feature of baselineFeatures) {
    if (!currentFeatures.has(feature)) continue;

    const baselineData = baseline.features.get(feature)!;
    const currentData = current.features.get(feature)!;

    // Compare options
    const baselineSet = new Set(baselineData.options);
    const currentSet = new Set(currentData.options);

    const addedOptions = currentData.options.filter(o => !baselineSet.has(o));
    const removedOptions = baselineData.options.filter(o => !currentSet.has(o));

    if (addedOptions.length > 0 || removedOptions.length > 0) {
      optionChanges.push({
        feature,
        baselineOptions: baselineData.options,
        currentOptions: currentData.options,
        addedOptions,
        removedOptions,
      });
    }

    // Compare selected values
    if (baselineData.selectedValue !== currentData.selectedValue) {
      valueChanges.push({
        feature,
        baselineValue: baselineData.selectedValue,
        currentValue: currentData.selectedValue,
      });
    }
  }

  // Compare metadata
  const metaFields: (keyof ConfigurationMetadata)[] = [
    'instance', 'application', 'configurationId', 'partNumber',
    'partNamespace', 'configurationMode'
  ];

  for (const field of metaFields) {
    if (baseline.metadata[field] !== current.metadata[field]) {
      metadataChanges.push({
        field,
        baseline: baseline.metadata[field],
        current: current.metadata[field],
      });
    }
  }

  // Compare integration outputs
  const integrationOutputDiff = compareIntegrationOutputs(
    baseline.integrationOutputs,
    current.integrationOutputs
  );

  // Compare variable assignments
  const variableDiff = compareVariables(
    baseline.variableTracking,
    current.variableTracking
  );

  // Compare condition evaluations
  const conditionDiff = compareConditions(
    baseline.conditionTracking,
    current.conditionTracking
  );

  return {
    addedFeatures,
    removedFeatures,
    optionChanges,
    valueChanges,
    metadataChanges,
    integrationOutputDiff,
    variableDiff,
    conditionDiff,
  };
}

/**
 * Compare integration outputs between two traces
 */
function compareIntegrationOutputs(
  baseline: IntegrationOutputSummary,
  current: IntegrationOutputSummary
): IntegrationOutputDiff {
  const addedTemplates: string[] = [];
  const removedTemplates: string[] = [];
  const templateDiffs = new Map<string, TemplateDiff>();

  const baselineTemplateNames = new Set(baseline.templates.keys());
  const currentTemplateNames = new Set(current.templates.keys());

  // Find added/removed templates
  for (const name of currentTemplateNames) {
    if (!baselineTemplateNames.has(name)) {
      addedTemplates.push(name);
    }
  }

  for (const name of baselineTemplateNames) {
    if (!currentTemplateNames.has(name)) {
      removedTemplates.push(name);
    }
  }

  // Compare templates that exist in both
  for (const templateName of baselineTemplateNames) {
    if (!currentTemplateNames.has(templateName)) continue;

    const baselineTemplate = baseline.templates.get(templateName)!;
    const currentTemplate = current.templates.get(templateName)!;

    const diff = compareTemplates(baselineTemplate, currentTemplate);

    // Only add if there are actual differences
    if (diff.addedRows.length > 0 || diff.removedRows.length > 0 ||
        diff.changedRows.length > 0 || diff.addedColumns.length > 0 ||
        diff.removedColumns.length > 0) {
      templateDiffs.set(templateName, diff);
    }
  }

  return { addedTemplates, removedTemplates, templateDiffs };
}

/**
 * Compare two templates and find row/column differences
 */
function compareTemplates(
  baseline: IntegrationTemplate,
  current: IntegrationTemplate
): TemplateDiff {
  const addedRows: IntegrationOutputRow[] = [];
  const removedRows: IntegrationOutputRow[] = [];
  const changedRows: RowChange[] = [];

  // Compare columns
  const baselineColumns = new Set(baseline.columns);
  const currentColumns = new Set(current.columns);
  const addedColumns = current.columns.filter(c => !baselineColumns.has(c));
  const removedColumns = baseline.columns.filter(c => !currentColumns.has(c));

  // Build maps by row ID for comparison
  const baselineRowsById = new Map<string, IntegrationOutputRow>();
  const currentRowsById = new Map<string, IntegrationOutputRow>();

  for (const row of baseline.rows) {
    baselineRowsById.set(row.id, row);
  }
  for (const row of current.rows) {
    currentRowsById.set(row.id, row);
  }

  // Find added/removed rows
  for (const [id, row] of currentRowsById) {
    if (!baselineRowsById.has(id)) {
      addedRows.push(row);
    }
  }

  for (const [id, row] of baselineRowsById) {
    if (!currentRowsById.has(id)) {
      removedRows.push(row);
    }
  }

  // Compare rows that exist in both
  for (const [id, baselineRow] of baselineRowsById) {
    const currentRow = currentRowsById.get(id);
    if (!currentRow) continue;

    const changedProperties: PropertyChange[] = [];

    // Get all property names from both rows
    const allProps = new Set([
      ...baselineRow.properties.keys(),
      ...currentRow.properties.keys()
    ]);

    for (const prop of allProps) {
      const baselineValue = baselineRow.properties.get(prop) ?? null;
      const currentValue = currentRow.properties.get(prop) ?? null;

      // Compare values (handle different types)
      if (String(baselineValue) !== String(currentValue)) {
        changedProperties.push({
          property: prop,
          baselineValue,
          currentValue,
        });
      }
    }

    if (changedProperties.length > 0) {
      changedRows.push({
        id,
        baselineRow,
        currentRow,
        changedProperties,
      });
    }
  }

  return {
    templateName: baseline.name,
    addedRows,
    removedRows,
    changedRows,
    addedColumns,
    removedColumns,
  };
}

/**
 * Compare variable assignments between two traces
 */
function compareVariables(
  baseline: VariableTrackingSummary,
  current: VariableTrackingSummary
): VariableDiff {
  const changedVariables: VariableChange[] = [];
  const addedVariables: string[] = [];
  const removedVariables: string[] = [];

  const baselineVarNames = new Set(baseline.variables.keys());
  const currentVarNames = new Set(current.variables.keys());

  // Find added variables
  for (const name of currentVarNames) {
    if (!baselineVarNames.has(name)) {
      addedVariables.push(name);
    }
  }

  // Find removed variables
  for (const name of baselineVarNames) {
    if (!currentVarNames.has(name)) {
      removedVariables.push(name);
    }
  }

  // Compare variables that exist in both
  for (const name of baselineVarNames) {
    if (!currentVarNames.has(name)) continue;

    const baselineVar = baseline.variables.get(name)!;
    const currentVar = current.variables.get(name)!;

    // Compare final values
    if (baselineVar.finalValue !== currentVar.finalValue) {
      changedVariables.push({
        variableName: name,
        baselineFinalValue: baselineVar.finalValue,
        currentFinalValue: currentVar.finalValue,
        baselineAssignmentCount: baselineVar.assignmentCount,
        currentAssignmentCount: currentVar.assignmentCount,
      });
    }
  }

  return {
    changedVariables,
    addedVariables,
    removedVariables,
    totalChanges: changedVariables.length + addedVariables.length + removedVariables.length,
  };
}

/**
 * Compare condition evaluations between two traces
 * Finds conditions where the result changed (fired vs skipped)
 */
function compareConditions(
  baseline: ConditionSummary,
  current: ConditionSummary
): ConditionDiff {
  const changedConditions: ConditionChange[] = [];
  const addedConditions: ConditionEvaluation[] = [];
  const removedConditions: ConditionEvaluation[] = [];

  // Create maps keyed by ruleId+ruleset+expression for matching
  // This handles cases where the same rule is evaluated multiple times
  const createConditionKey = (c: ConditionEvaluation) =>
    `${c.ruleset}:${c.ruleId}:${c.expression}`;

  // Build maps for baseline and current conditions
  // Store the LAST evaluation of each unique condition (latest result)
  const baselineMap = new Map<string, ConditionEvaluation>();
  const currentMap = new Map<string, ConditionEvaluation>();

  for (const c of baseline.conditions) {
    baselineMap.set(createConditionKey(c), c);
  }
  for (const c of current.conditions) {
    currentMap.set(createConditionKey(c), c);
  }

  // Find conditions only in current (added)
  for (const [key, condition] of currentMap) {
    if (!baselineMap.has(key)) {
      addedConditions.push(condition);
    }
  }

  // Find conditions only in baseline (removed)
  for (const [key, condition] of baselineMap) {
    if (!currentMap.has(key)) {
      removedConditions.push(condition);
    }
  }

  // Find conditions where result changed
  for (const [key, baselineCondition] of baselineMap) {
    const currentCondition = currentMap.get(key);
    if (!currentCondition) continue;

    // Compare results
    if (baselineCondition.result !== currentCondition.result) {
      changedConditions.push({
        ruleId: baselineCondition.ruleId,
        ruleName: baselineCondition.ruleName,
        ruleset: baselineCondition.ruleset,
        expression: baselineCondition.expression,
        baselineResult: baselineCondition.result,
        currentResult: currentCondition.result,
      });
    }
  }

  return {
    changedConditions,
    addedConditions,
    removedConditions,
    totalChanges: changedConditions.length + addedConditions.length + removedConditions.length,
  };
}

// ============================================
// BEHAVIORAL REGRESSION TESTING
// ============================================

/**
 * Types for behavioral regression testing
 * Compares test traces against baselines to find behavioral changes
 */

export type BehavioralIssueType =
  | 'options_changed'      // Same selection but different available options
  | 'integration_changed'  // Same selection but different integration output
  | 'condition_changed'    // Same selection but condition fired differently
  | 'feature_missing'      // Feature exists in baseline but not test
  | 'feature_added';       // Feature exists in test but not baseline (info only)

export interface BehavioralIssue {
  type: BehavioralIssueType;
  featureName: string;
  lineNumber: number;
  selection: string | null;        // The matching selection that led to different behavior
  baseline: {
    value: string | string[] | boolean | null;
  };
  test: {
    value: string | string[] | boolean | null;
  };
  severity: 'error' | 'warning' | 'info';
  details?: string;                // Additional context
}

export interface SelectionComparison {
  featureName: string;
  baselineValue: string | null;
  testValue: string | null;
  isMatch: boolean;
}

export interface RegressionResult {
  matchedBaselineName: string;
  matchedBaselineId: string;
  matchScore: number;              // 0-100% of selection path matched

  // Selection comparison
  matchingSelections: SelectionComparison[];    // Features where user made same choice
  divergentSelections: SelectionComparison[];   // Features where user chose differently

  // Behavioral issues (the important part!)
  issues: BehavioralIssue[];

  // Summary
  summary: {
    totalFeaturesCompared: number;
    behavioralIssuesFound: number;
    userChoicesDiverged: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}

/**
 * Compare behavior between a baseline trace and test trace
 * Only flags issues where SAME selection led to DIFFERENT behavior
 * Different user selections are expected and not flagged
 */
export function compareBehavior(
  baseline: ParsedTrace,
  test: ParsedTrace,
  baselineInfo: { id: string; name: string; matchScore: number }
): RegressionResult {
  const issues: BehavioralIssue[] = [];
  const matchingSelections: SelectionComparison[] = [];
  const divergentSelections: SelectionComparison[] = [];

  // Get all feature names from both traces
  const allFeatures = new Set([
    ...baseline.features.keys(),
    ...test.features.keys(),
  ]);

  // Compare each feature
  for (const featureName of allFeatures) {
    const baselineFeature = baseline.features.get(featureName);
    const testFeature = test.features.get(featureName);

    // Feature missing in test trace
    if (baselineFeature && !testFeature) {
      issues.push({
        type: 'feature_missing',
        featureName,
        lineNumber: baselineFeature.lineNumber,
        selection: baselineFeature.selectedValue,
        baseline: { value: baselineFeature.selectedValue },
        test: { value: null },
        severity: 'error',
        details: `Feature "${featureName}" exists in baseline but not in test trace`,
      });
      continue;
    }

    // Feature added in test trace (new feature, not necessarily an issue)
    if (!baselineFeature && testFeature) {
      issues.push({
        type: 'feature_added',
        featureName,
        lineNumber: testFeature.lineNumber,
        selection: testFeature.selectedValue,
        baseline: { value: null },
        test: { value: testFeature.selectedValue },
        severity: 'info',
        details: `New feature "${featureName}" appears in test but not baseline`,
      });
      continue;
    }

    // Both have this feature - compare
    if (baselineFeature && testFeature) {
      const comparison: SelectionComparison = {
        featureName,
        baselineValue: baselineFeature.selectedValue,
        testValue: testFeature.selectedValue,
        isMatch: baselineFeature.selectedValue === testFeature.selectedValue,
      };

      if (comparison.isMatch) {
        matchingSelections.push(comparison);

        // SAME SELECTION - check for behavioral differences
        // This is where we flag real issues!

        // Compare available options
        const baseOpts = new Set(baselineFeature.options);
        const testOpts = new Set(testFeature.options);

        if (!setsEqual(baseOpts, testOpts)) {
          const addedOptions = testFeature.options.filter(o => !baseOpts.has(o));
          const removedOptions = baselineFeature.options.filter(o => !testOpts.has(o));

          issues.push({
            type: 'options_changed',
            featureName,
            lineNumber: testFeature.lineNumber,
            selection: testFeature.selectedValue,
            baseline: { value: baselineFeature.options },
            test: { value: testFeature.options },
            severity: 'error',
            details: removedOptions.length > 0
              ? `Missing options: ${removedOptions.join(', ')}`
              : `Added options: ${addedOptions.join(', ')}`,
          });
        }
      } else {
        // DIFFERENT SELECTION - expected divergence, just note it
        divergentSelections.push(comparison);
      }
    }
  }

  // Compare integration outputs for matching configurations
  // Only compare templates/rows that should exist given the matching selections
  const integrationIssues = compareIntegrationBehavior(
    baseline.integrationOutputs,
    test.integrationOutputs,
    matchingSelections
  );
  issues.push(...integrationIssues);

  // Compare condition evaluations for matching selections
  // If same inputs led to different condition outcomes, that's a flag
  const conditionIssues = compareConditionBehavior(
    baseline.conditionTracking,
    test.conditionTracking
  );
  issues.push(...conditionIssues);

  // Calculate summary stats
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const infos = issues.filter(i => i.severity === 'info').length;

  // Sort issues by severity
  issues.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    matchedBaselineName: baselineInfo.name,
    matchedBaselineId: baselineInfo.id,
    matchScore: baselineInfo.matchScore,
    matchingSelections,
    divergentSelections,
    issues,
    summary: {
      totalFeaturesCompared: allFeatures.size,
      behavioralIssuesFound: errors + warnings,
      userChoicesDiverged: divergentSelections.length,
      errors,
      warnings,
      infos,
    },
  };
}

/**
 * Compare integration outputs for behavioral differences
 */
function compareIntegrationBehavior(
  baseline: IntegrationOutputSummary,
  test: IntegrationOutputSummary,
  matchingSelections: SelectionComparison[]
): BehavioralIssue[] {
  const issues: BehavioralIssue[] = [];

  // Get template names from both
  const allTemplates = new Set([
    ...baseline.templates.keys(),
    ...test.templates.keys(),
  ]);

  for (const templateName of allTemplates) {
    const baselineTemplate = baseline.templates.get(templateName);
    const testTemplate = test.templates.get(templateName);

    // Template missing in test
    if (baselineTemplate && !testTemplate) {
      issues.push({
        type: 'integration_changed',
        featureName: templateName,
        lineNumber: baselineTemplate.rows[0]?.lineNumber || 0,
        selection: null,
        baseline: { value: `${baselineTemplate.rows.length} rows` },
        test: { value: 'Template missing' },
        severity: 'warning',
        details: `Integration template "${templateName}" missing from test trace`,
      });
      continue;
    }

    // Template added in test (might be expected)
    if (!baselineTemplate && testTemplate) {
      // This could be expected if new features were selected
      // Mark as info only
      continue;
    }

    // Both have template - compare row counts and values
    if (baselineTemplate && testTemplate) {
      // Row count difference
      if (baselineTemplate.rows.length !== testTemplate.rows.length) {
        issues.push({
          type: 'integration_changed',
          featureName: templateName,
          lineNumber: testTemplate.rows[0]?.lineNumber || 0,
          selection: null,
          baseline: { value: `${baselineTemplate.rows.length} rows` },
          test: { value: `${testTemplate.rows.length} rows` },
          severity: 'warning',
          details: `Row count changed from ${baselineTemplate.rows.length} to ${testTemplate.rows.length}`,
        });
      }

      // Compare rows by ID
      const baselineRowsById = new Map(baselineTemplate.rows.map(r => [r.id, r]));
      const testRowsById = new Map(testTemplate.rows.map(r => [r.id, r]));

      for (const [id, baselineRow] of baselineRowsById) {
        const testRow = testRowsById.get(id);

        if (!testRow) {
          issues.push({
            type: 'integration_changed',
            featureName: `${templateName}[${id}]`,
            lineNumber: baselineRow.lineNumber,
            selection: null,
            baseline: { value: id },
            test: { value: 'Row missing' },
            severity: 'warning',
            details: `Integration row ${id} missing from template ${templateName}`,
          });
          continue;
        }

        // Compare property values
        for (const [prop, baseValue] of baselineRow.properties) {
          const testValue = testRow.properties.get(prop);

          if (String(baseValue) !== String(testValue)) {
            issues.push({
              type: 'integration_changed',
              featureName: `${templateName}[${id}].${prop}`,
              lineNumber: testRow.lineNumber,
              selection: null,
              baseline: { value: String(baseValue) },
              test: { value: String(testValue) },
              severity: 'warning',
              details: `Property value changed in integration output`,
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Compare condition evaluations for behavioral differences
 * If the same condition fired differently, that's important to flag
 */
function compareConditionBehavior(
  baseline: ConditionSummary,
  test: ConditionSummary
): BehavioralIssue[] {
  const issues: BehavioralIssue[] = [];

  // Create maps keyed by ruleId+ruleset+expression
  const createKey = (c: ConditionEvaluation) =>
    `${c.ruleset}:${c.ruleId}:${c.expression}`;

  const baselineMap = new Map<string, ConditionEvaluation>();
  const testMap = new Map<string, ConditionEvaluation>();

  // Store last evaluation of each condition
  for (const c of baseline.conditions) {
    baselineMap.set(createKey(c), c);
  }
  for (const c of test.conditions) {
    testMap.set(createKey(c), c);
  }

  // Find conditions where result changed
  for (const [key, baselineCondition] of baselineMap) {
    const testCondition = testMap.get(key);

    if (testCondition && baselineCondition.result !== testCondition.result) {
      issues.push({
        type: 'condition_changed',
        featureName: baselineCondition.ruleName,
        lineNumber: testCondition.lineNumber,
        selection: baselineCondition.expression,
        baseline: { value: baselineCondition.result },
        test: { value: testCondition.result },
        severity: 'warning',
        details: `Condition "${baselineCondition.ruleName}" ${baselineCondition.result ? 'fired' : 'was skipped'} in baseline but ${testCondition.result ? 'fired' : 'was skipped'} in test`,
      });
    }
  }

  return issues;
}

/**
 * Helper to compare two sets for equality
 */
function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

// ============================================
// ISSUE DETECTION
// ============================================

/**
 * Detect issues and warnings in parsed trace data
 */
function detectIssues(data: {
  rulesSummary: RuleExecutionSummary;
  conditionTracking: ConditionSummary;
  variableTracking: VariableTrackingSummary;
  rollbackPoints: number;
  lines: string[];
}): IssuesSummary {
  const issues: DetectedIssue[] = [];
  let issueId = 0;

  const createId = () => `issue-${++issueId}`;

  // === PERFORMANCE ISSUES ===

  // Check for hot rules (rules that execute many times)
  for (const rule of data.rulesSummary.topRules) {
    if (rule.executionCount > 50) {
      issues.push({
        id: createId(),
        severity: 'error',
        category: 'performance',
        title: `Rule executes ${rule.executionCount} times`,
        description: `"${rule.ruleName}" may indicate a performance issue or infinite loop`,
        lineNumber: 0, // We don't track first occurrence line in topRules
        context: {
          ruleName: rule.ruleName,
          ruleset: rule.ruleset,
          count: rule.executionCount,
        },
      });
    } else if (rule.executionCount > 20) {
      issues.push({
        id: createId(),
        severity: 'warning',
        category: 'performance',
        title: `Rule executes ${rule.executionCount} times`,
        description: `"${rule.ruleName}" executes frequently - consider optimization`,
        lineNumber: 0,
        context: {
          ruleName: rule.ruleName,
          ruleset: rule.ruleset,
          count: rule.executionCount,
        },
      });
    } else if (rule.executionCount > 10) {
      issues.push({
        id: createId(),
        severity: 'info',
        category: 'performance',
        title: `Rule executes ${rule.executionCount} times`,
        description: `"${rule.ruleName}" - consider if this frequency is expected`,
        lineNumber: 0,
        context: {
          ruleName: rule.ruleName,
          ruleset: rule.ruleset,
          count: rule.executionCount,
        },
      });
    }
  }

  // Check for excessive rollback points
  if (data.rollbackPoints > 15) {
    issues.push({
      id: createId(),
      severity: 'warning',
      category: 'performance',
      title: `${data.rollbackPoints} rollback points`,
      description: 'High rollback count may indicate complex conflict resolution',
      lineNumber: 0,
      context: {
        count: data.rollbackPoints,
      },
    });
  }

  // === LOGIC ISSUES ===

  // Check for conditions that always evaluate to False (never fire)
  // Group conditions by ruleId+ruleset+expression to find patterns
  const conditionsByRule = new Map<string, { condition: ConditionEvaluation; trueCount: number; falseCount: number }>();

  for (const condition of data.conditionTracking.conditions) {
    const key = `${condition.ruleset}:${condition.ruleId}:${condition.expression}`;
    if (!conditionsByRule.has(key)) {
      conditionsByRule.set(key, { condition, trueCount: 0, falseCount: 0 });
    }
    const entry = conditionsByRule.get(key)!;
    if (condition.result) {
      entry.trueCount++;
    } else {
      entry.falseCount++;
    }
  }

  for (const [, entry] of conditionsByRule) {
    const totalEvals = entry.trueCount + entry.falseCount;
    // If a condition is evaluated 3+ times and ALWAYS False, it's suspicious
    if (totalEvals >= 3 && entry.trueCount === 0) {
      issues.push({
        id: createId(),
        severity: 'warning',
        category: 'logic',
        title: `Condition always False (${totalEvals} evaluations)`,
        description: `"${entry.condition.ruleName}" - rule never fires`,
        lineNumber: entry.condition.lineNumber,
        context: {
          ruleName: entry.condition.ruleName,
          ruleset: entry.condition.ruleset,
          expression: entry.condition.expression,
          count: totalEvals,
        },
      });
    }
  }

  // === DATA ISSUES ===

  // Check for null values in condition traces
  const nullTraceConditions = data.conditionTracking.conditions.filter(
    c => c.trace && c.trace.includes('null')
  );

  // Group by unique expression to avoid flooding with same issue
  const uniqueNullExpressions = new Map<string, ConditionEvaluation>();
  for (const c of nullTraceConditions) {
    const key = c.expression;
    if (!uniqueNullExpressions.has(key)) {
      uniqueNullExpressions.set(key, c);
    }
  }

  for (const [, condition] of uniqueNullExpressions) {
    issues.push({
      id: createId(),
      severity: 'info',
      category: 'data',
      title: 'Null value in expression',
      description: `Expression evaluates with null: ${condition.expression.slice(0, 60)}`,
      lineNumber: condition.lineNumber,
      context: {
        expression: condition.expression,
        ruleName: condition.ruleName,
      },
    });
  }

  // Check for variables read when unassigned
  for (const [, variable] of data.variableTracking.variables) {
    for (const assignment of variable.assignments) {
      if (assignment.previousValue === '(unassigned)' && assignment.assignmentExpression.startsWith('=')) {
        // This is a read before being properly assigned
        issues.push({
          id: createId(),
          severity: 'warning',
          category: 'data',
          title: 'Variable read when unassigned',
          description: `"${variable.name}" was unassigned when used in expression`,
          lineNumber: assignment.lineNumber,
          context: {
            variableName: variable.name,
            expression: assignment.assignmentExpression,
          },
        });
        break; // Only report first occurrence per variable
      }
    }
  }

  // === CONFIGURATION ISSUES ===

  // Check for duplicate rollback points by scanning the lines
  const rollbackPattern = /Rollback point (\d+)/;
  const rollbackCounts = new Map<string, { count: number; firstLine: number }>();

  for (let i = 0; i < data.lines.length; i++) {
    const match = data.lines[i].match(rollbackPattern);
    if (match) {
      const pointNum = match[1];
      if (!rollbackCounts.has(pointNum)) {
        rollbackCounts.set(pointNum, { count: 0, firstLine: i + 1 });
      }
      rollbackCounts.get(pointNum)!.count++;
    }
  }

  for (const [pointNum, info] of rollbackCounts) {
    if (info.count > 1) {
      issues.push({
        id: createId(),
        severity: 'info',
        category: 'configuration',
        title: `Duplicate rollback point ${pointNum}`,
        description: `Rollback point ${pointNum} appears ${info.count} times`,
        lineNumber: info.firstLine,
        context: {
          count: info.count,
        },
      });
    }
  }

  // Calculate severity counts
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  // Sort issues: errors first, then warnings, then info
  issues.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    issues,
    errorCount,
    warningCount,
    infoCount,
  };
}
