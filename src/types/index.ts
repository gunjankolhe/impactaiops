export type AgentRole =
  | 'Supervisor'
  | 'AnomalyDetector'
  | 'ForensicDiagnostician'
  | 'PolicyCritic'
  | 'HealingActuator';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'DETECTED'
  | 'ANALYZING'
  | 'POLICY_CHECK'
  | 'REMEDIATING'
  | 'RESOLVED'
  | 'ROLLBACK';

export interface TelemetryMetric {
  id: string;
  timestamp: number;
  service: 'payment-gateway' | 'bigquery-pipeline' | 'ai-inference' | 'api-gateway' | 'database';
  metricName: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'nominal' | 'warning' | 'critical';
  costImpactPerMin: number;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySnapshot {
  timestamp: number;
  transactionsPerSec: number;
  authRatePct: number;
  p99LatencyMs: number;
  cloudSpendPerMin: number;
  bigQuerySlotsUsed: number;
  errorRatePct: number;
  aiTokenRatePerMin: number;
}

export interface AgentReasoningStep {
  agentRole: AgentRole;
  timestamp: number;
  thought: string;
  toolCall?: {
    toolName: string;
    parameters: Record<string, unknown>;
    result: Record<string, unknown>;
  };
  confidenceScore: number;
  durationMs: number;
}

export type RemediationActionType =
  | 'CLAMP_BIGQUERY_SLOTS'
  | 'ROUTE_FAILOVER'
  | 'RATE_LIMIT_WAF'
  | 'THROTTLE_TOKENS'
  | 'CANCEL_QUERY'
  | 'BLOCK_INJECTION';

export interface RemediationAction {
  actionId: string;
  actionType: RemediationActionType;
  targetResource: string;
  parameters: Record<string, unknown>;
  preActionMetrics: Record<string, number>;
  expectedOutcome: string;
  requiresHumanApproval: boolean;
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTED' | 'REVERTED';
}

export interface AnomalyIncident {
  incidentId: string;
  timestamp: number;
  source: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  detectedMetrics: {
    metric: string;
    expected: number;
    observed: number;
    deviationFactor: number;
  }[];
  financialRunawayRate: number; // in $/min
  status: IncidentStatus;
  agentReasoningChain: AgentReasoningStep[];
  remediationAction?: RemediationAction;
  ledgerIndex?: number;
}

export interface CryptographicLedgerEntry {
  index: number;
  actionId: string;
  timestamp: number;
  agentId: string;
  actionType: RemediationActionType;
  targetResource: string;
  parameters: Record<string, unknown>;
  preActionMetrics: Record<string, number>;
  expectedOutcome: string;
  digitalSignature: string; // HMAC-SHA256 signature
  previousBlockHash: string;
  blockHash: string; // SHA-256 hash
  status: 'COMMITTED' | 'VERIFIED' | 'REVERTED';
}

export interface ChaosScenario {
  id: string;
  title: string;
  category: 'FinOps Cloud Spend' | 'Payment Rails' | 'API Security' | 'GenAI Security';
  severity: IncidentSeverity;
  description: string;
  costImpactPerMin: number;
  initialMetrics: Partial<TelemetrySnapshot>;
  expectedRootCause: string;
  suggestedAction: RemediationActionType;
}

export interface BigQueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  originalBytesScannedGb: number;
  optimizedBytesScannedGb: number;
  originalCostUsd: number;
  optimizedCostUsd: number;
  savingsPercentage: number;
  recommendations: string[];
}

export interface PromptInjectionAnalysis {
  isInjection: boolean;
  confidenceScore: number;
  riskCategory: 'CLEAN' | 'PRIVILEGE_ESCALATION' | 'DELIMITER_OVERRIDE' | 'FINANCIAL_EXPLOIT' | 'DATA_EXFILTRATION';
  detectedPatterns: string[];
  sanitizedInput: string;
  rawInput: string;
  actionBlocked: boolean;
}
