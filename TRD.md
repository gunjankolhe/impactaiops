# Technical Requirements Document (TRD)

## Project: ApexFin AI
**Autonomous FinTech Cloud & Transaction Resilience Platform**  
*Challenge: "Build Beyond AI: Engineer Secure, Intelligent and Autonomous Applications"*

---

## 1. System Architecture Overview

ApexFin AI is built on a modern, decoupled, full-stack architecture leveraging Next.js 15 App Router, TypeScript, React 19, Tailwind CSS, and the Google GenAI SDK (`@google/genai`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ApexFin Next.js 15 UI                           │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Mission Control Grid  │  │ Agent War Room  │  │ Chaos Deck       │  │
│  └───────────────────────┘  └─────────────────┘  └──────────────────┘  │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Cryptographic Ledger  │  │ BigQuery FinOps │  │ Telemetry Stream │  │
│  └───────────────────────┘  └─────────────────┘  └──────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ React State & Server-Sent Events (SSE)
┌────────────────────────────────────▼───────────────────────────────────┐
│                    ApexFin Core Agentic Engine (API)                   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Zero-Trust & Security Boundary                 │   │
│   │   [ PII/PCI-DSS Tokenizer ]   [ Prompt Injection Firewall ]    │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                Supervisor-Worker Cognitive Swarm               │   │
│   │   ┌────────────────┐   ┌───────────────┐   ┌───────────────┐   │   │
│   │   │ Anomaly Worker │◄-►│ Forensic Lead │◄-►│ Policy Critic │   │   │
│   │   └────────────────┘   └───────────────┘   └───────┬───────┘   │   │
│   │                                                    ▼           │   │
│   │                                            [ Healing Actuator] │   │
│   └───────────────────────────────┬────────────────────┬───────────┘   │
│                                   │                    │               │
│   ┌───────────────────────────────▼┐   ┌───────────────▼───────────┐   │
│   │  Google Cloud & AI Layer       │   │ Cryptographic Audit Vault │   │
│   │  • Gemini 2.0 / 1.5 Flash/Pro  │   │ • SHA-256 Hash Chain      │   │
│   │  • BigQuery SQL/Cost Optimizer │   │ • Ed25519/HMAC Signatures │   │
│   │  • Vertex AI Vector Matcher    │   │ • Rollback Invariants     │   │
│   └────────────────────────────────┘   └───────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Dependency Specifications

### 2.1 Core Technologies
- **Framework**: Next.js 15.0+ (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript 5.6+ (Strict Type Checking enabled)
- **Styling**: Tailwind CSS v4 / v3.4 with custom dark FinTech theme palette
- **Icons & UI Primitives**: `lucide-react`, `@radix-ui` primitives, `clsx`, `tailwind-merge`
- **Charts & Visualizations**: Recharts / SVG micro-sparklines for high-frequency telemetry

### 2.2 Google Cloud & AI Integrations
- **SDK**: `@google/genai` (Google Gen AI SDK for Node.js / TypeScript)
- **Models Used**:
  - `gemini-2.0-flash` or `gemini-1.5-flash`: Fast anomaly classification, telemetry parsing, and initial triage (low latency < 800ms).
  - `gemini-1.5-pro`: Deep financial forensic reasoning, complex root-cause correlation, BigQuery SQL optimization, and policy validation.
- **Context Caching**: Implements structured context caching patterns for static policy rules and schema definitions to reduce input token consumption by up to 75%.
- **Google BigQuery Simulator & Cost Model**: Emulates Google BigQuery dry-run cost estimation (`query.dryRun()`), slot reservation analysis, and partition/clustering recommendations.

### 2.3 Cryptographic & Security Modules
- **Hashing & Signatures**: Node.js `crypto` module (SHA-256 digest chains and HMAC-SHA256 non-repudiation signatures).
- **Sanitization**: In-memory regex tokenization engine masking credit cards (Luhn-compliant PANs), CVVs, and SSNs.
- **Prompt Defense**: Heuristic and semantic injection scoring against prompt jailbreaks and privilege escalation payloads.

---

## 3. Data Models & Interface Contracts

### 3.1 Telemetry Metric Data Model
```typescript
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
```

### 3.2 Anomaly Incident Data Model
```typescript
export interface AnomalyIncident {
  incidentId: string;
  timestamp: number;
  source: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  detectedMetrics: {
    metric: string;
    expected: number;
    observed: number;
    deviationFactor: number;
  }[];
  financialRunawayRate: number; // in $/minute
  status: 'DETECTED' | 'ANALYZING' | 'POLICY_CHECK' | 'REMEDIATING' | 'RESOLVED' | 'ROLLBACK';
  agentReasoningChain: AgentReasoningStep[];
  remediationAction?: RemediationAction;
}
```

### 3.3 Agent Reasoning Step Data Model
```typescript
export interface AgentReasoningStep {
  agentRole: 'Supervisor' | 'AnomalyDetector' | 'ForensicDiagnostician' | 'PolicyCritic' | 'HealingActuator';
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
```

### 3.4 Cryptographically Signed Action Ledger Model
```typescript
export interface CryptographicLedgerEntry {
  index: number;
  actionId: string;
  timestamp: number;
  agentId: string;
  actionType: 'CLAMP_SLOTS' | 'ROUTE_FAILOVER' | 'RATE_LIMIT_WAF' | 'THROTTLE_TOKENS' | 'CANCEL_QUERY';
  targetResource: string;
  parameters: Record<string, unknown>;
  preActionMetrics: Record<string, number>;
  expectedOutcome: string;
  digitalSignature: string; // HMAC-SHA256 signature using zero-trust private seed
  previousBlockHash: string;
  blockHash: string; // SHA-256(index + actionId + timestamp + actionType + digitalSignature + previousBlockHash)
  status: 'COMMITTED' | 'VERIFIED' | 'REVERTED';
}
```

---

## 4. API Endpoints & Interfaces

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/telemetry/stream` | Server-Sent Events (SSE) delivering continuous real-time system metrics (1-second intervals). |
| `POST` | `/api/telemetry/chaos` | Injects synthetic chaos scenarios (runaway BigQuery, Stripe webhook drop, carding attack, prompt injection). |
| `POST` | `/api/agents/orchestrate` | Triggers the multi-agent cognitive loop on an anomaly, streaming reasoning steps and decisions. |
| `GET` | `/api/ledger/verify` | Validates the cryptographic integrity of the entire action ledger hash-chain. |
| `POST` | `/api/ledger/rollback` | Executes a safe rollback of a specific autonomous remediation action. |
| `POST` | `/api/bigquery/optimize` | Analyzes a natural-language or raw BigQuery SQL query, calculating estimated costs and generating an optimized, partitioned version. |

---

## 5. Security & Zero-Trust Requirements

1. **Cardholder Data Redaction (PCI-DSS DSS 3.4)**: All telemetry and payload strings are sanitized using a Luhn-validated regex tokenizer before reaching LLM inference memory or persistence layers:
   ```typescript
   // Example redaction rule:
   const PAN_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
   const sanitizedInput = rawInput.replace(PAN_REGEX, '[REDACTED_PCI_PAN]');
   ```
2. **Prompt Injection Defense**: Evaluates incoming prompts and instructions against delimiter smuggling, system prompt overrides, and unauthorized state manipulations.
3. **Cryptographic Action Non-Repudiation**: Every autonomous remediation is signed with a deterministic HMAC/Ed25519 key, preventing repudiation or rogue modification of logs.
4. **Emergency Operator Kill-Switch**: A global hardware-style software toggle that instantly suspends autonomous actuation and forces all operations into manual review mode.

---

## 6. Execution & Deployment Environments

- **Local Development**: Node.js 20+ / 24+ via Next.js Turbopack (`npm run dev`).
- **Cloud Deployment**: Containerized Docker image ready for **Google Cloud Run** or Vercel Edge.
- **Environment Configuration**:
  - `GEMINI_API_KEY`: (Optional) Google GenAI API Key for live multimodal & text model inference.
  - `SIMULATION_MODE`: `true` by default when no API key is provided, enabling instant evaluation without setup overhead.
