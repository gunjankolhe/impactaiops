'use client';

import React from 'react';
import { TelemetrySnapshot } from '@/types';

interface LiveTelemetryChartProps {
  history: TelemetrySnapshot[];
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({ history }) => {
  if (!history || history.length < 2) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
        Ingesting real-time FinTech telemetry data points...
      </div>
    );
  }

  const width = 800;
  const height = 160;
  const padding = { top: 20, right: 20, bottom: 25, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max spend calculation
  const maxSpend = Math.max(50, ...history.map((h) => h.cloudSpendPerMin * 1.15));

  // Points for spend line
  const spendPoints = history
    .map((d, i) => {
      const x = padding.left + (i / (history.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - (d.cloudSpendPerMin / maxSpend) * plotHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Points for auth rate line (scaled 50% to 100%)
  const authPoints = history
    .map((d, i) => {
      const x = padding.left + (i / (history.length - 1)) * plotWidth;
      const normalizedAuth = Math.max(0, Math.min(1, (d.authRatePct - 50) / 50));
      const y = padding.top + plotHeight - normalizedAuth * plotHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const latest = history[history.length - 1];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4.5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-300">Live Telemetry Stream</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Spend: ${latest.cloudSpendPerMin.toFixed(1)}/min
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Auth Rate: {latest.authRatePct.toFixed(1)}%
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Window: Last {history.length * 2}s (Sampling 1Hz)
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible font-mono text-[10px]"
        >
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#27272a"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight / 2}
            x2={width - padding.right}
            y2={padding.top + plotHeight / 2}
            stroke="#27272a"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={width - padding.right}
            y2={padding.top + plotHeight}
            stroke="#3f3f46"
          />

          {/* Left Y Axis Labels (Spend) */}
          <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fill="#71717a">
            ${Math.round(maxSpend)}
          </text>
          <text x={padding.left - 8} y={padding.top + plotHeight / 2 + 4} textAnchor="end" fill="#71717a">
            ${Math.round(maxSpend / 2)}
          </text>
          <text x={padding.left - 8} y={padding.top + plotHeight} textAnchor="end" fill="#71717a">
            $0
          </text>

          {/* Area under spend curve */}
          <polygon
            points={`${padding.left},${padding.top + plotHeight} ${spendPoints} ${width - padding.right},${padding.top + plotHeight}`}
            fill="url(#spendGradient)"
            opacity="0.25"
          />

          {/* Polyline: Cloud Spend Rate */}
          <polyline
            points={spendPoints}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Polyline: Auth Rate */}
          <polyline
            points={authPoints}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 2"
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
