'use client';

import React from 'react';
import {
  Brain,
  ShieldAlert,
  Search,
  Lock,
  Wrench,
  CheckCircle2,
  Clock,
  Terminal,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AnomalyIncident, AgentRole } from '@/types';

interface AgentWarRoomProps {
  incident: AnomalyIncident | null;
  isOrchestrating: boolean;
  onRunOrchestration: () => void;
  killSwitchActive: boolean;
}

const AGENT_CONFIGS: Record<
  AgentRole,
  { name: string; title: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  Supervisor: {
    name: 'Supervisor',
    title: 'Cognitive Swarm Orchestrator',
    icon: Brain,
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/30',
    border: 'border-indigo-800/60',
  },
  AnomalyDetector: {
    name: 'AnomalyDetector',
    title: 'EWMA & Statistical Analyst',
    icon: ShieldAlert,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/60',
  },
  ForensicDiagnostician: {
    name: 'ForensicDiagnostician',
    title: 'Root-Cause & Trace Correlator',
    icon: Search,
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/30',
    border: 'border-cyan-800/60',
  },
  PolicyCritic: {
    name: 'PolicyCritic',
    title: 'Zero-Trust & Prompt Shield Guard',
    icon: Lock,
    color: 'text-purple-400',
    bg: 'bg-purple-950/30',
    border: 'border-purple-800/60',
  },
  HealingActuator: {
    name: 'HealingActuator',
    title: 'Autonomous Remediation & Ledger',
    icon: Wrench,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/60',
  },
};

export const AgentWarRoom: React.FC<AgentWarRoomProps> = ({
  incident,
  isOrchestrating,
  onRunOrchestration,
  killSwitchActive,
}) => {
  const steps = incident?.agentReasoningChain || [];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Autonomous Multi-Agent War Room
              {isOrchestrating && (
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse">
                  Reasoning active...
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              5-agent supervisor-worker-critic cognitive pipeline with zero-trust execution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunOrchestration}
            disabled={isOrchestrating || killSwitchActive}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              killSwitchActive
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : isOrchestrating
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 cursor-wait'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isOrchestrating ? 'Orchestrating Swarm...' : 'Trigger Autonomous Analysis'}</span>
          </button>
        </div>
      </div>

      {/* 5-Agent Step Visualizer */}
      <div className="space-y-3.5">
        {(['Supervisor', 'AnomalyDetector', 'ForensicDiagnostician', 'PolicyCritic', 'HealingActuator'] as AgentRole[]).map(
          (role, idx) => {
            const config = AGENT_CONFIGS[role];
            const step = steps.find((s) => s.agentRole === role);
            const Icon = config.icon;

            return (
              <div
                key={role}
                className={`rounded-xl border p-4 transition-all ${
                  step
                    ? `${config.bg} ${config.border} shadow-sm`
                    : 'bg-zinc-950/40 border-zinc-800/50 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-900 border border-zinc-700 text-[11px] font-mono font-bold text-zinc-300">
                      0{idx + 1}
                    </span>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-xs font-semibold text-white">{config.name}</span>
                    <span className="text-[11px] text-zinc-400 hidden sm:inline">({config.title})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {step ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {step.durationMs}ms
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          {(step.confidenceScore * 100).toFixed(0)}% conf
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-zinc-600 font-mono">STANDBY</span>
                    )}
                  </div>
                </div>

                {step ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-line bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
                      {step.thought}
                    </p>

                    {step.toolCall && (
                      <div className="bg-zinc-950 rounded-lg p-2.5 border border-zinc-800/80 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                          <Terminal className="w-3.5 h-3.5 text-teal-400" />
                          <span className="text-teal-400 font-semibold">{step.toolCall.toolName}</span>
                          <span className="text-zinc-600">parameters:</span>
                        </div>
                        <pre className="text-zinc-300 text-[10px] overflow-x-auto p-1.5 bg-zinc-900/50 rounded">
                          {JSON.stringify(step.toolCall.parameters, null, 2)}
                        </pre>
                        <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 text-zinc-400 text-[10px] flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                          <span>Output:</span>
                          <code className="text-emerald-400">
                            {JSON.stringify(step.toolCall.result)}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic mt-1">
                    Waiting for anomaly trigger or supervisor dispatch...
                  </p>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};
