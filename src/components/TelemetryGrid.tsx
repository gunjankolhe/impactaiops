'use client';

import React from 'react';
import { DollarSign, Activity, CreditCard, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TelemetrySnapshot, ChaosScenario } from '@/types';

interface TelemetryGridProps {
  snapshot: TelemetrySnapshot;
  activeScenario: ChaosScenario | null;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({ snapshot, activeScenario }) => {
  const isSpendAnomalous = snapshot.cloudSpendPerMin > 50;
  const isAuthAnomalous = snapshot.authRatePct < 90;
  const isLatencyAnomalous = snapshot.p99LatencyMs > 500;
  const isTpsAnomalous = snapshot.transactionsPerSec > 2000;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Cloud Spend & BigQuery Slots */}
      <div
        className={`rounded-xl border p-4.5 transition-all ${
          isSpendAnomalous
            ? 'bg-rose-950/20 border-rose-600/80 shadow-lg shadow-rose-950/30'
            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Cloud FinOps Spend
          </span>
          {isSpendAnomalous ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              RUNAWAY
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              NOMINAL
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            ${snapshot.cloudSpendPerMin.toFixed(2)}
            <span className="text-xs font-normal text-zinc-400 ml-1">/min</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-zinc-500" />
            BQ Slots: <strong className="text-zinc-200 font-mono">{snapshot.bigQuerySlotsUsed}</strong>
          </span>
          <span className="font-mono text-zinc-400">
            Est: ${(snapshot.cloudSpendPerMin * 60 * 24).toLocaleString(undefined, { maximumFractionDigits: 0 })}/day
          </span>
        </div>
      </div>

      {/* 2. Payment Authorization Rate */}
      <div
        className={`rounded-xl border p-4.5 transition-all ${
          isAuthAnomalous
            ? 'bg-amber-950/20 border-amber-500/80 shadow-lg shadow-amber-950/30'
            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
            Payment Auth Rate
          </span>
          {isAuthAnomalous ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              DEGRADED
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              HEALTHY
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <div className={`text-2xl font-bold font-mono tracking-tight ${isAuthAnomalous ? 'text-amber-400' : 'text-white'}`}>
            {snapshot.authRatePct.toFixed(1)}%
          </div>
          <span className="text-xs text-zinc-500">SLA: 99.0%</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
          <span>Stripe / Adyen Rails</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Zero-Loss Mode
          </span>
        </div>
      </div>

      {/* 3. Transaction Throughput (TPS) */}
      <div
        className={`rounded-xl border p-4.5 transition-all ${
          isTpsAnomalous
            ? 'bg-purple-950/20 border-purple-500/80 shadow-lg shadow-purple-950/30'
            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Throughput (TPS)
          </span>
          {isTpsAnomalous ? (
            <span className="text-[11px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded-full animate-pulse">
              CARDING BURST
            </span>
          ) : (
            <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full">
              STEADY
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {snapshot.transactionsPerSec.toLocaleString()}
            <span className="text-xs font-normal text-zinc-400 ml-1">req/s</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
          <span>API Gateway Load</span>
          <span className="font-mono text-zinc-300">
            {snapshot.aiTokenRatePerMin > 10000 ? `${(snapshot.aiTokenRatePerMin / 1000).toFixed(1)}k tok/m` : 'Normal'}
          </span>
        </div>
      </div>

      {/* 4. p99 Latency & Error Rate */}
      <div
        className={`rounded-xl border p-4.5 transition-all ${
          isLatencyAnomalous
            ? 'bg-rose-950/20 border-rose-600/80 shadow-lg shadow-rose-950/30'
            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            p99 Latency & Error
          </span>
          <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
            snapshot.errorRatePct > 1 ? 'text-rose-400 bg-rose-950/80 border border-rose-800' : 'text-zinc-400 bg-zinc-800/60'
          }`}>
            Err: {snapshot.errorRatePct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <div className={`text-2xl font-bold font-mono tracking-tight ${isLatencyAnomalous ? 'text-rose-400' : 'text-white'}`}>
            {snapshot.p99LatencyMs}
            <span className="text-xs font-normal text-zinc-400 ml-1">ms</span>
          </div>
          <span className="text-xs text-zinc-500">Target &lt; 200ms</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
          <span>Webhooks & Rails</span>
          <span className="font-mono text-zinc-300">
            {activeScenario ? activeScenario.category : 'All systems nominal'}
          </span>
        </div>
      </div>
    </div>
  );
};
