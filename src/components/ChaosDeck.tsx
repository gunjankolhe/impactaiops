'use client';

import React from 'react';
import { Flame, Database, CreditCard, ShieldAlert, Bug, ArrowRight, Zap } from 'lucide-react';
import { CHAOS_SCENARIOS } from '@/lib/telemetry/scenarios';
import { ChaosScenario } from '@/types';

interface ChaosDeckProps {
  activeScenario: ChaosScenario | null;
  onInjectChaos: (scenarioId: string) => void;
  onAutoMitigate: () => void;
  isOrchestrating: boolean;
  killSwitchActive: boolean;
}

export const ChaosDeck: React.FC<ChaosDeckProps> = ({
  activeScenario,
  onInjectChaos,
  onAutoMitigate,
  isOrchestrating,
  killSwitchActive,
}) => {
  const scenarios = Object.values(CHAOS_SCENARIOS);

  const getIcon = (category: string) => {
    switch (category) {
      case 'FinOps Cloud Spend':
        return Database;
      case 'Payment Rails':
        return CreditCard;
      case 'API Security':
        return ShieldAlert;
      case 'GenAI Security':
        return Bug;
      default:
        return Flame;
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">FinTech Chaos Simulation Deck</h2>
            <p className="text-xs text-zinc-400">
              Inject real-world catastrophic production incidents to verify autonomous self-healing
            </p>
          </div>
        </div>

        {activeScenario && (
          <button
            onClick={onAutoMitigate}
            disabled={isOrchestrating || killSwitchActive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Mitigate Active Incident</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {scenarios.map((scenario) => {
          const Icon = getIcon(scenario.category);
          const isActive = activeScenario?.id === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`rounded-xl border p-4 transition-all ${
                isActive
                  ? 'bg-rose-950/30 border-rose-600/90 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                  : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${isActive ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-800/80 text-zinc-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{scenario.title}</h3>
                    <span className="text-[10px] text-zinc-400 font-mono">{scenario.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    scenario.severity === 'CRITICAL'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                  }`}>
                    {scenario.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                {scenario.description}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/70 text-xs">
                <span className="font-mono text-zinc-400 text-[11px]">
                  Impact: <strong className="text-rose-400">${scenario.costImpactPerMin}/min</strong>
                </span>

                <button
                  onClick={() => onInjectChaos(scenario.id)}
                  disabled={isOrchestrating || killSwitchActive}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-rose-900 text-rose-200 border border-rose-700 cursor-default'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  <span>{isActive ? 'Injected & Active' : 'Inject Incident'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
