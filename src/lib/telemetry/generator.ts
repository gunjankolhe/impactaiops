import type { TelemetrySnapshot, ChaosScenario } from '../../types';
import { CHAOS_SCENARIOS } from './scenarios.ts';

class TelemetryGeneratorService {
  private activeScenario: ChaosScenario | null = null;
  private currentSnapshot: TelemetrySnapshot = {
    timestamp: Date.now(),
    transactionsPerSec: 485,
    authRatePct: 99.4,
    p99LatencyMs: 145,
    cloudSpendPerMin: 14.2,
    bigQuerySlotsUsed: 140,
    errorRatePct: 0.12,
    aiTokenRatePerMin: 4800,
  };
  private history: TelemetrySnapshot[] = [];

  constructor() {
    this.seedHistory();
  }

  private seedHistory() {
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      this.history.push({
        timestamp: now - i * 2000,
        transactionsPerSec: 470 + Math.floor(Math.random() * 40),
        authRatePct: +(99.2 + Math.random() * 0.6).toFixed(2),
        p99LatencyMs: 130 + Math.floor(Math.random() * 30),
        cloudSpendPerMin: +(13.5 + Math.random() * 1.5).toFixed(2),
        bigQuerySlotsUsed: 130 + Math.floor(Math.random() * 30),
        errorRatePct: +(0.1 + Math.random() * 0.1).toFixed(2),
        aiTokenRatePerMin: 4600 + Math.floor(Math.random() * 500),
      });
    }
  }

  public triggerChaos(scenarioId: string): ChaosScenario | null {
    const scenario = CHAOS_SCENARIOS[scenarioId];
    if (!scenario) return null;

    this.activeScenario = scenario;
    this.currentSnapshot = {
      ...this.currentSnapshot,
      ...scenario.initialMetrics,
      timestamp: Date.now(),
    };
    this.history.push({ ...this.currentSnapshot });
    return scenario;
  }

  public remediateActive(): boolean {
    this.activeScenario = null;
    // Restore nominal values with slight jitter
    this.currentSnapshot = {
      timestamp: Date.now(),
      transactionsPerSec: 492,
      authRatePct: 99.5,
      p99LatencyMs: 138,
      cloudSpendPerMin: 14.1,
      bigQuerySlotsUsed: 135,
      errorRatePct: 0.08,
      aiTokenRatePerMin: 4900,
    };
    this.history.push({ ...this.currentSnapshot });
    return true;
  }

  public getActiveScenario(): ChaosScenario | null {
    return this.activeScenario;
  }

  public getNextSnapshot(): TelemetrySnapshot {
    const now = Date.now();

    if (this.activeScenario) {
      // In chaos state: keep high anomaly values with slight fluctuation
      this.currentSnapshot = {
        timestamp: now,
        transactionsPerSec: this.fluctuate(this.currentSnapshot.transactionsPerSec, 50),
        authRatePct: Math.min(100, Math.max(10, this.fluctuate(this.currentSnapshot.authRatePct, 0.5, 2))),
        p99LatencyMs: this.fluctuate(this.currentSnapshot.p99LatencyMs, 40),
        cloudSpendPerMin: this.fluctuate(this.currentSnapshot.cloudSpendPerMin, 5, 2),
        bigQuerySlotsUsed: this.fluctuate(this.currentSnapshot.bigQuerySlotsUsed, 30),
        errorRatePct: this.fluctuate(this.currentSnapshot.errorRatePct, 0.4, 2),
        aiTokenRatePerMin: this.fluctuate(this.currentSnapshot.aiTokenRatePerMin, 200),
      };
    } else {
      // Nominal stable state
      this.currentSnapshot = {
        timestamp: now,
        transactionsPerSec: Math.floor(470 + Math.random() * 50),
        authRatePct: +(99.3 + Math.random() * 0.5).toFixed(2),
        p99LatencyMs: Math.floor(135 + Math.random() * 25),
        cloudSpendPerMin: +(13.8 + Math.random() * 1.2).toFixed(2),
        bigQuerySlotsUsed: Math.floor(130 + Math.random() * 25),
        errorRatePct: +(0.08 + Math.random() * 0.08).toFixed(2),
        aiTokenRatePerMin: Math.floor(4700 + Math.random() * 400),
      };
    }

    this.history.push({ ...this.currentSnapshot });
    if (this.history.length > 50) {
      this.history.shift();
    }

    return this.currentSnapshot;
  }

  public getHistory(): TelemetrySnapshot[] {
    return [...this.history];
  }

  private fluctuate(val: number, delta: number, decimals: number = 0): number {
    const change = (Math.random() * 2 - 1) * delta;
    const res = Math.max(0, val + change);
    return decimals > 0 ? +res.toFixed(decimals) : Math.round(res);
  }
}

declare global {
  var __apexFinTelemetry: TelemetryGeneratorService | undefined;
}

export const telemetryService = global.__apexFinTelemetry || new TelemetryGeneratorService();
if (process.env.NODE_ENV !== 'production') {
  global.__apexFinTelemetry = telemetryService;
}
