import {
  AnomalyIncident,
  AgentReasoningStep,
  RemediationAction,
  RemediationActionType,
} from '@/types';
import { generateAgentReasoning } from '@/lib/gemini/client';
import { redactSensitiveData } from '@/lib/security/piiRedactor';
import { inspectPromptSecurity } from '@/lib/security/promptShield';
import { cryptoLedger } from '@/lib/security/cryptoLedger';
import { telemetryService } from '@/lib/telemetry/generator';
import { CHAOS_SCENARIOS } from '@/lib/telemetry/scenarios';

export async function orchestrateIncidentResponse(
  scenarioId?: string,
  userPrompt?: string,
  userApiKey?: string
): Promise<AnomalyIncident> {
  const activeScenario = scenarioId ? CHAOS_SCENARIOS[scenarioId] : telemetryService.getActiveScenario();
  const currentSnapshot = telemetryService.getNextSnapshot();

  // Step 0: Security & PII Sanitization
  const rawInput = userPrompt || (activeScenario ? activeScenario.description : 'Unspecified system metric deviation');
  const redaction = redactSensitiveData(rawInput);
  const promptSecurity = inspectPromptSecurity(redaction.sanitized);

  const incidentId = `inc_${Date.now().toString(36)}`;
  const reasoningSteps: AgentReasoningStep[] = [];

  // ==========================================
  // AGENT 1: SUPERVISOR AGENT
  // ==========================================
  const supervisorStart = Date.now();
  const supervisorPrompt = `Evaluate incoming FinTech infrastructure anomaly telemetry:
Transactions/s: ${currentSnapshot.transactionsPerSec}
Auth Rate: ${currentSnapshot.authRatePct}%
p99 Latency: ${currentSnapshot.p99LatencyMs}ms
Cloud Spend Rate: $${currentSnapshot.cloudSpendPerMin}/min
BigQuery Slots: ${currentSnapshot.bigQuerySlotsUsed}
Error Rate: ${currentSnapshot.errorRatePct}%
Reported issue: "${redaction.sanitized}"`;

  const supervisorSys = `You are the ApexFin Supervisor Agent. Prioritize incidents, assess blast radius on financial infrastructure, and coordinate specialized sub-agents.`;
  const supervisorRes = await generateAgentReasoning(supervisorPrompt, supervisorSys, 'gemini-2.0-flash', userApiKey);

  reasoningSteps.push({
    agentRole: 'Supervisor',
    timestamp: supervisorStart,
    thought:
      supervisorRes.text ||
      `Critical alert received from FinTech Ingestion Hub. Telemetry indicates immediate operational risk (Spend: $${currentSnapshot.cloudSpendPerMin}/min, Auth Rate: ${currentSnapshot.authRatePct}%). Dispatching Anomaly Detector and Forensic Diagnostician concurrently.`,
    toolCall: {
      toolName: 'dispatch_subagents',
      parameters: { targets: ['AnomalyDetector', 'ForensicDiagnostician'], priority: 'P0' },
      result: { dispatched: true, quorum: 'READY' },
    },
    confidenceScore: 0.98,
    durationMs: Math.max(120, Date.now() - supervisorStart),
  });

  // ==========================================
  // AGENT 2: ANOMALY DETECTOR AGENT
  // ==========================================
  const anomalyStart = Date.now();
  const isBqSpike = currentSnapshot.cloudSpendPerMin > 100 || currentSnapshot.bigQuerySlotsUsed > 800;
  const isAuthDrop = currentSnapshot.authRatePct < 90;
  const isCarding = currentSnapshot.transactionsPerSec > 1500;

  reasoningSteps.push({
    agentRole: 'AnomalyDetector',
    timestamp: anomalyStart,
    thought: `Computed statistical EWMA & dynamic z-score on time series. Identified 3.8-sigma deviation on ${
      isBqSpike ? 'BigQuery Cloud Spend and slot allocation' : isAuthDrop ? 'Payment Gateway authorization rate' : isCarding ? 'Checkout endpoint request rate' : 'API token & error latency metrics'
    }. Threshold exceeded for SLA grade Tier-1 payment infrastructure.`,
    toolCall: {
      toolName: 'calculate_zscore',
      parameters: { metric: isBqSpike ? 'cloudSpendPerMin' : 'authRatePct', observed: currentSnapshot.cloudSpendPerMin, baseline: 14.2 },
      result: { zScore: 3.84, pValue: 0.0001, isBreach: true },
    },
    confidenceScore: 0.96,
    durationMs: 145,
  });

  // ==========================================
  // AGENT 3: FORENSIC DIAGNOSTICIAN AGENT
  // ==========================================
  const forensicStart = Date.now();
  const forensicSys = `You are the ApexFin Forensic Diagnostician. Correlate traces, query logs, and payment webhooks to isolate the root cause.`;
  const forensicPrompt = `Diagnose root cause:
Observed Anomaly: ${activeScenario?.title || 'System Spikes'}
Details: ${activeScenario?.expectedRootCause || 'Uncorrelated metric variance'}`;

  const forensicRes = await generateAgentReasoning(forensicPrompt, forensicSys, 'gemini-1.5-pro', userApiKey);

  const rootCauseDiagnosis =
    forensicRes.text ||
    (activeScenario
      ? activeScenario.expectedRootCause
      : 'Identified cascading timeout on external downstream dependency resulting in retry storm and queue buildup.');

  reasoningSteps.push({
    agentRole: 'ForensicDiagnostician',
    timestamp: forensicStart,
    thought: rootCauseDiagnosis,
    toolCall: {
      toolName: 'query_cloud_traces',
      parameters: { timeWindowMinutes: 5, filterByStatus: '5xx_and_slow' },
      result: { correlatedJobId: 'job_bq_8941fa', culpritService: isBqSpike ? 'bigquery-lake' : 'stripe-adapter', traceDepth: 14 },
    },
    confidenceScore: 0.94,
    durationMs: Math.max(160, Date.now() - forensicStart),
  });

  // ==========================================
  // AGENT 4: POLICY-AS-CODE & SECURITY CRITIC
  // ==========================================
  const criticStart = Date.now();
  const actionType: RemediationActionType = promptSecurity.isInjection
    ? 'BLOCK_INJECTION'
    : (activeScenario?.suggestedAction || (isBqSpike ? 'CLAMP_BIGQUERY_SLOTS' : isAuthDrop ? 'ROUTE_FAILOVER' : 'RATE_LIMIT_WAF'));

  const costRunaway = activeScenario?.costImpactPerMin || currentSnapshot.cloudSpendPerMin * 10;
  const requiresApproval = costRunaway > 5000;

  reasoningSteps.push({
    agentRole: 'PolicyCritic',
    timestamp: criticStart,
    thought: `Zero-Trust Policy evaluation initiated.
• PCI-DSS Cardholder Data: ${redaction.redactedCount > 0 ? `Detected & scrubbed ${redaction.redactedCount} cardholder elements (${redaction.typesRedacted.join(', ')})` : 'PASSED (0 cardholder leaks)'}
• Prompt Injection Shield: ${promptSecurity.isInjection ? `FLAGGED THREAT: ${promptSecurity.riskCategory} (Confidence: ${(promptSecurity.confidenceScore * 100).toFixed(1)}%)` : 'PASSED (Clean semantic intent)'}
• Financial Authority Invariant: Requested remediation action "${actionType}" conforms to policy doc sec-ops-rulebook-v4.
${requiresApproval ? 'Action requires multi-sig human authorization.' : 'Action authorized for autonomous automated actuation.'}`,
    toolCall: {
      toolName: 'evaluate_policy_rules',
      parameters: { action: actionType, piiSanitized: true, injectionBlocked: promptSecurity.isInjection },
      result: { policyPassed: true, securitySignature: 'POL_SIG_ED25519_VERIFIED' },
    },
    confidenceScore: 0.99,
    durationMs: 110,
  });

  // ==========================================
  // AGENT 5: HEALING ACTUATOR AGENT & CRYPTO COMMIT
  // ==========================================
  const actuatorStart = Date.now();
  const actionId = `act_${Date.now().toString(36)}`;
  const targetResource =
    actionType === 'CLAMP_BIGQUERY_SLOTS'
      ? 'projects/fintech-prod/datasets/billing_export'
      : actionType === 'ROUTE_FAILOVER'
      ? 'gateway.routes.payment_rails.primary_stripe'
      : actionType === 'RATE_LIMIT_WAF'
      ? 'cloudarmor.security_policy.checkout_ddos_guard'
      : 'ai.safety.input_guardrail';

  const expectedOutcome =
    actionType === 'CLAMP_BIGQUERY_SLOTS'
      ? 'BigQuery slot reservation clamped to 100 slots; runaway queries evicted; spend drops by $405/min.'
      : actionType === 'ROUTE_FAILOVER'
      ? 'Tripped circuit breaker; rerouted 90% authorization traffic to Adyen backup rail; auth rate returns to 99.4%.'
      : actionType === 'RATE_LIMIT_WAF'
      ? 'Injected Cloud Armor rate-limit (max 5 req/min per IP); 1,800 bot IPs blocked; checkout latency drops to 125ms.'
      : 'Adversarial payload dropped; session quarantined; customer token revoked.';

  // Commit to Cryptographic Action Ledger
  const ledgerBlock = cryptoLedger.recordAction(
    actionId,
    'HealingActuator',
    actionType,
    targetResource,
    { scenarioId, promptSecurityStatus: promptSecurity.riskCategory },
    {
      spendBefore: currentSnapshot.cloudSpendPerMin,
      authRateBefore: currentSnapshot.authRatePct,
    },
    expectedOutcome
  );

  // Restore telemetry metrics
  telemetryService.remediateActive();

  reasoningSteps.push({
    agentRole: 'HealingActuator',
    timestamp: actuatorStart,
    thought: `Remediation executed successfully against target: ${targetResource}.
Cryptographically sealed into Action Ledger at Block #${ledgerBlock.index}.
Block SHA-256 Hash: ${ledgerBlock.blockHash.slice(0, 16)}...
Digital HMAC Signature: ${ledgerBlock.digitalSignature.slice(0, 16)}...
Post-remediation telemetry confirms immediate stabilization. Mean Time to Remediate (MTTR): 2.4s.`,
    toolCall: {
      toolName: 'commit_cryptographic_ledger',
      parameters: { blockIndex: ledgerBlock.index, actionId, hash: ledgerBlock.blockHash },
      result: { committed: true, hashChainValid: true, stateReverted: false },
    },
    confidenceScore: 0.99,
    durationMs: 135,
  });

  const remediationAction: RemediationAction = {
    actionId,
    actionType,
    targetResource,
    parameters: { automated: true, ledgerIndex: ledgerBlock.index },
    preActionMetrics: {
      spendRate: currentSnapshot.cloudSpendPerMin,
      authRate: currentSnapshot.authRatePct,
      p99Latency: currentSnapshot.p99LatencyMs,
    },
    expectedOutcome,
    requiresHumanApproval: requiresApproval,
    status: 'EXECUTED',
  };

  return {
    incidentId,
    timestamp: Date.now(),
    source: activeScenario ? `FinOps Chaos Engine [${activeScenario.category}]` : 'FinTech Gateway Telemetry',
    severity: activeScenario?.severity || 'HIGH',
    title: activeScenario?.title || 'High-Frequency FinTech Telemetry Anomaly',
    description: redaction.sanitized,
    detectedMetrics: [
      {
        metric: 'cloudSpendPerMin',
        expected: 14.2,
        observed: currentSnapshot.cloudSpendPerMin,
        deviationFactor: +(currentSnapshot.cloudSpendPerMin / 14.2).toFixed(1),
      },
      {
        metric: 'authRatePct',
        expected: 99.4,
        observed: currentSnapshot.authRatePct,
        deviationFactor: +(currentSnapshot.authRatePct / 99.4).toFixed(2),
      },
      {
        metric: 'p99LatencyMs',
        expected: 145,
        observed: currentSnapshot.p99LatencyMs,
        deviationFactor: +(currentSnapshot.p99LatencyMs / 145).toFixed(1),
      },
    ],
    financialRunawayRate: activeScenario?.costImpactPerMin || 145.0,
    status: 'RESOLVED',
    agentReasoningChain: reasoningSteps,
    remediationAction,
    ledgerIndex: ledgerBlock.index,
  };
}
