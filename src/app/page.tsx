'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { TelemetryGrid } from '@/components/TelemetryGrid';
import { LiveTelemetryChart } from '@/components/LiveTelemetryChart';
import { ChaosDeck } from '@/components/ChaosDeck';
import { AgentWarRoom } from '@/components/AgentWarRoom';
import { CryptographicLedgerView } from '@/components/CryptographicLedgerView';
import { BigQueryStudio } from '@/components/BigQueryStudio';
import { SecurityAuditModal } from '@/components/SecurityAuditModal';
import { TelemetrySnapshot, ChaosScenario, AnomalyIncident, CryptographicLedgerEntry } from '@/types';
import { Activity, Database, Layers, Shield, Info } from 'lucide-react';

const INITIAL_SNAPSHOT: TelemetrySnapshot = {
  timestamp: Date.now(),
  transactionsPerSec: 1420,
  authRatePct: 99.4,
  p99LatencyMs: 142,
  cloudSpendPerMin: 14.25,
  bigQuerySlotsUsed: 120,
  errorRatePct: 0.12,
  aiTokenRatePerMin: 24500,
};

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'bigquery' | 'ledger'>('operations');

  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(INITIAL_SNAPSHOT);
  const [activeScenario, setActiveScenario] = useState<ChaosScenario | null>(null);
  const [history, setHistory] = useState<TelemetrySnapshot[]>([]);
  const [incident, setIncident] = useState<AnomalyIncident | null>(null);
  const [ledger, setLedger] = useState<CryptographicLedgerEntry[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);

  // Initialize API Key from storage
  useEffect(() => {
    queueMicrotask(() => {
      const savedKey = localStorage.getItem('apexfin_gemini_key');
      if (savedKey) setApiKey(savedKey);
    });
  }, []);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('apexfin_gemini_key', key);
    } else {
      localStorage.removeItem('apexfin_gemini_key');
    }
  };

  // Fetch Ledger
  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/ledger/verify');
      const data = await res.json();
      if (data.ledger) {
        setLedger(data.ledger);
      }
    } catch (e) {
      console.error('Failed to fetch ledger:', e);
    }
  }, []);

  // Poll Telemetry Stream and initial fetch
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        const [streamRes, ledgerRes] = await Promise.all([
          fetch('/api/telemetry/stream'),
          fetch('/api/ledger/verify'),
        ]);
        if (streamRes.ok) {
          const sData = await streamRes.json();
          if (isMounted) {
            if (sData.snapshot) setSnapshot(sData.snapshot);
            setActiveScenario(sData.activeScenario || null);
            if (sData.history && sData.history.length > 0) {
              setHistory(sData.history);
            }
          }
        }
        if (ledgerRes.ok) {
          const lData = await ledgerRes.json();
          if (isMounted && lData.ledger) {
            setLedger(lData.ledger);
          }
        }
      } catch (e) {
        console.error('Initial data fetch failed:', e);
      }
    };

    initData();

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/telemetry/stream');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          if (data.snapshot) setSnapshot(data.snapshot);
          setActiveScenario(data.activeScenario || null);
          if (data.history && data.history.length > 0) {
            setHistory(data.history);
          }
        }
      } catch (e) {
        console.error('Telemetry stream poll failed:', e);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Orchestrate incident response
  const handleRunOrchestration = async (overrideScenarioId?: string) => {
    if (isOrchestrating || killSwitchActive) return;

    setIsOrchestrating(true);
    try {
      const res = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: overrideScenarioId || activeScenario?.id,
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.incident) {
        setIncident(data.incident);
      }
      await fetchLedger();
    } catch (e) {
      console.error('Orchestration failed:', e);
    } finally {
      setIsOrchestrating(false);
    }
  };

  // Inject Chaos Incident
  const handleInjectChaos = async (scenarioId: string) => {
    try {
      const res = await fetch('/api/telemetry/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });

      const data = await res.json();
      if (data.scenario) {
        setActiveScenario(data.scenario);
      }
      if (data.snapshot) {
        setSnapshot(data.snapshot);
      }

      // Auto-trigger autonomous remediation after brief latency to show anomaly spike
      if (!killSwitchActive) {
        setTimeout(() => {
          handleRunOrchestration(scenarioId);
        }, 1200);
      }
    } catch (e) {
      console.error('Inject chaos failed:', e);
    }
  };

  // Rollback action in ledger
  const handleRollback = async (index: number) => {
    try {
      const res = await fetch('/api/ledger/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (data.ledger) {
        setLedger(data.ledger);
      }
    } catch (e) {
      console.error('Rollback failed:', e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navigation & Controls */}
      <Header
        apiKey={apiKey}
        setApiKey={handleSetApiKey}
        killSwitchActive={killSwitchActive}
        setKillSwitchActive={setKillSwitchActive}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs & Quick Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('operations')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'operations'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Operations War Room</span>
            </button>

            <button
              onClick={() => setActiveTab('bigquery')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bigquery'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>BigQuery FinOps Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cryptographic Action Ledger</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                {ledger.length}
              </span>
            </button>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900 border border-transparent transition-all"
            >
              <Info className="w-4 h-4 text-emerald-400" />
              <span>About Us & Platform Docs</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">Rail: Visa/Stripe/Adyen Active</span>
            </div>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-zinc-400">
              <span>Ingestion Rate:</span>
              <span className="text-emerald-400 font-bold">{snapshot.transactionsPerSec.toLocaleString()} tps</span>
            </div>
          </div>
        </div>

        {/* TAB 1: OPERATIONS WAR ROOM */}
        {activeTab === 'operations' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Live Telemetry KPI Cards */}
            <TelemetryGrid snapshot={snapshot} activeScenario={activeScenario} />

            {/* Real-Time Telemetry Sparkline Chart */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">Real-Time FinTech Stream Telemetry</h3>
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded">
                    50-point rolling window (1.5s sample)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    <span className="text-zinc-300">Cloud Spend ($/min)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
                    <span className="text-zinc-300">Auth Rate (%)</span>
                  </div>
                </div>
              </div>
              <LiveTelemetryChart history={history} />
            </div>

            {/* Split Grid: Chaos Simulation Deck & Autonomous Multi-Agent War Room */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-6">
                <ChaosDeck
                  activeScenario={activeScenario}
                  onInjectChaos={handleInjectChaos}
                  onAutoMitigate={() => handleRunOrchestration()}
                  isOrchestrating={isOrchestrating}
                  killSwitchActive={killSwitchActive}
                />
              </div>

              <div className="lg:col-span-7 space-y-6">
                <AgentWarRoom
                  incident={incident}
                  isOrchestrating={isOrchestrating}
                  onRunOrchestration={() => handleRunOrchestration()}
                  killSwitchActive={killSwitchActive}
                />
              </div>
            </div>

            {/* Bottom Overview Section: Cryptographic Ledger preview */}
            <div className="pt-2">
              <CryptographicLedgerView
                ledger={ledger}
                onRefreshLedger={fetchLedger}
                onRollback={handleRollback}
              />
            </div>
          </div>
        )}

        {/* TAB 2: BIGQUERY FINOPS OPTIMIZER */}
        {activeTab === 'bigquery' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <BigQueryStudio />
          </div>
        )}

        {/* TAB 3: CRYPTOGRAPHIC ACTION LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <CryptographicLedgerView
              ledger={ledger}
              onRefreshLedger={fetchLedger}
              onRollback={handleRollback}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>ApexFin AI • Autonomous Cloud & Transaction Resilience</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
          <span>Zero-Trust Policy Enforced</span>
          <span>•</span>
          <span>Google Gemini 2.0 Flash</span>
          <span>•</span>
          <span>SHA-256 Hash Chaining</span>
        </div>
      </footer>

      {/* Zero-Trust Security & Prompt Shield Testing Modal */}
      <SecurityAuditModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}
