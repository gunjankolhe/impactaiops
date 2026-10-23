'use client';

import React, { useState } from 'react';
import { ShieldCheck, Hash, Key, RotateCcw, AlertTriangle, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { CryptographicLedgerEntry } from '@/types';

interface CryptographicLedgerViewProps {
  ledger: CryptographicLedgerEntry[];
  onRefreshLedger: () => void;
  onRollback: (index: number) => void;
}

export const CryptographicLedgerView: React.FC<CryptographicLedgerViewProps> = ({
  ledger,
  onRefreshLedger,
  onRollback,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isValid: boolean;
    totalBlocks: number;
    compromisedIndex?: number;
    reason?: string;
  } | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/ledger/verify');
      const data = await res.json();
      setVerifyResult(data.integrity);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Cryptographic Action Ledger
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                {ledger.length} Blocks
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Immutable SHA-256 hash-chained ledger of all autonomous decisions with HMAC non-repudiation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-950 text-teal-300 border border-teal-700/80 hover:bg-teal-900/60 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{verifying ? 'Recalculating Hashes...' : 'Verify Ledger Integrity'}</span>
          </button>

          <button
            onClick={onRefreshLedger}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Integrity Result Banner */}
      {verifyResult && (
        <div
          className={`mb-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            verifyResult.isValid
              ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/40 border-rose-700 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {verifyResult.isValid ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {verifyResult.isValid
                ? `Cryptographic proof verified: All ${verifyResult.totalBlocks} blocks in chain are tamper-free with intact SHA-256 digests.`
                : `INTEGRITY COMPROMISED: ${verifyResult.reason}`}
            </span>
          </div>
          <button
            onClick={() => setVerifyResult(null)}
            className="text-[11px] text-zinc-400 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Block Explorer List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {ledger
          .slice()
          .reverse()
          .map((block) => {
            const isGenesis = block.index === 0;
            const isReverted = block.status === 'REVERTED';

            return (
              <div
                key={block.index}
                className={`rounded-xl border p-3.5 text-xs font-mono transition-all ${
                  isReverted
                    ? 'bg-zinc-950/40 border-zinc-800 opacity-60'
                    : isGenesis
                    ? 'bg-teal-950/20 border-teal-800/60'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-teal-400 font-bold">
                      Block #{block.index}
                    </span>
                    <span className="text-zinc-300 font-sans font-semibold">
                      {block.actionType}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-sans">
                      by {block.agentId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold ${
                        isReverted
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {block.status}
                    </span>

                    {!isGenesis && !isReverted && (
                      <button
                        onClick={() => onRollback(block.index)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-300 hover:bg-rose-950/50 px-2 py-0.5 rounded border border-zinc-800 transition-colors"
                        title="Rollback this autonomous action"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-zinc-500 flex items-center gap-1 min-w-[90px]">
                      <Hash className="w-3 h-3 text-zinc-600" /> Block Hash:
                    </span>
                    <span className="text-zinc-200 select-all">{block.blockHash}</span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <span className="text-zinc-500 flex items-center gap-1 min-w-[90px]">
                      <Key className="w-3 h-3 text-zinc-600" /> HMAC Signature:
                    </span>
                    <span className="text-emerald-400 select-all">{block.digitalSignature}</span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <span className="text-zinc-500 min-w-[90px]">Target Resource:</span>
                    <span className="text-cyan-400">{block.targetResource}</span>
                  </div>

                  <div className="text-zinc-300 font-sans mt-1 text-[11px] pt-1 border-t border-zinc-800/60">
                    {block.expectedOutcome}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
