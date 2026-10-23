'use client';

import React, { useState } from 'react';
import { Database, Sparkles, TrendingDown, CheckCircle2, Copy } from 'lucide-react';
import { BigQueryOptimizationResult } from '@/types';

const SAMPLE_QUERY = `SELECT * 
FROM \`fintech_lake.transactions\`
WHERE amount_cents > 10000;`;

export const BigQueryStudio: React.FC = () => {
  const [query, setQuery] = useState(SAMPLE_QUERY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BigQueryOptimizationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bigquery/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Google BigQuery FinOps Optimizer</h2>
            <p className="text-xs text-zinc-400">
              Analyze queries for costly unpartitioned table scans, estimate byte costs, and generate partitioned SQL
            </p>
          </div>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-zinc-950 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loading ? 'Analyzing with Gemini...' : 'Analyze & Optimize SQL'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Query Editor */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-medium">
            <span>Input SQL Query (or Natural Language Request)</span>
            <span className="font-mono text-[11px] text-zinc-500">BigQuery Standard SQL</span>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={6}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            placeholder="SELECT * FROM `dataset.table`..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setQuery(SAMPLE_QUERY)}
              className="text-[11px] text-zinc-400 hover:text-blue-400 underline transition-colors"
            >
              Load Unpartitioned Query
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() =>
                setQuery(
                  `SELECT user_id, count(*) as count FROM \`billing.invoices\` GROUP BY user_id;`
                )
              }
              className="text-[11px] text-zinc-400 hover:text-blue-400 underline transition-colors"
            >
              Load Invoices Query
            </button>
          </div>
        </div>

        {/* Cost & Savings Summary */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-300 block mb-2.5">
              FinOps Cost Projection (BigQuery On-Demand Tier: $6.25 / TB)
            </span>

            {result ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Original Cost</span>
                    <span className="text-sm font-mono font-bold text-rose-400">
                      ${result.originalCostUsd}
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-mono">
                      {result.originalBytesScannedGb.toFixed(1)} GB
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Optimized Cost</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      ${result.optimizedCostUsd}
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-mono">
                      {result.optimizedBytesScannedGb.toFixed(1)} GB
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80">
                    <span className="text-[10px] text-emerald-300 block mb-0.5">Savings</span>
                    <span className="text-sm font-mono font-bold text-emerald-300 flex items-center justify-center gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {result.savingsPercentage}%
                    </span>
                    <span className="text-[10px] text-emerald-400/80 block font-mono">
                      Pruned partitions
                    </span>
                  </div>
                </div>

                {result.recommendations.length > 0 && (
                  <div className="mt-2 text-xs space-y-1.5">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-zinc-300 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic py-6 text-center">
                Click &quot;Analyze &amp; Optimize SQL&quot; to calculate byte scans and cost reduction.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimized SQL Output */}
      {result && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-medium">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ApexFin Production-Optimized Partitioned SQL
            </span>
            <button
              onClick={() => copyToClipboard(result.optimizedQuery)}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="bg-zinc-950 border border-emerald-900/60 rounded-lg p-3 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
            {result.optimizedQuery}
          </pre>
        </div>
      )}
    </div>
  );
};
