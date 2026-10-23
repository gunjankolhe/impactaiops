'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Sparkles,
  Key,
  Power,
  Lock,
  Activity,
  Info,
} from 'lucide-react';

interface HeaderProps {
  apiKey?: string;
  setApiKey?: (key: string) => void;
  killSwitchActive?: boolean;
  setKillSwitchActive?: (active: boolean) => void;
  onOpenSecurityModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey: propApiKey,
  setApiKey: propSetApiKey,
  killSwitchActive: propKillSwitchActive = false,
  setKillSwitchActive: propSetKillSwitchActive,
  onOpenSecurityModal,
}) => {
  const pathname = usePathname();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [internalKey, setInternalKey] = useState('');
  const [internalKillSwitch, setInternalKillSwitch] = useState(false);

  // Initialize key from localStorage if not passed via props
  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem('apexfin_gemini_key') || '';
      setInternalKey(saved);
    });
  }, []);

  const currentApiKey = propApiKey !== undefined ? propApiKey : internalKey;
  const currentKillSwitch = propKillSwitchActive !== undefined ? propKillSwitchActive : internalKillSwitch;

  const [tempKey, setTempKey] = useState(currentApiKey);

  const handleSaveKey = () => {
    if (propSetApiKey) {
      propSetApiKey(tempKey);
    } else {
      setInternalKey(tempKey);
      if (tempKey) {
        localStorage.setItem('apexfin_gemini_key', tempKey);
      } else {
        localStorage.removeItem('apexfin_gemini_key');
      }
    }
    setShowKeyModal(false);
  };

  const handleToggleKillSwitch = () => {
    if (propSetKillSwitchActive) {
      propSetKillSwitchActive(!currentKillSwitch);
    } else {
      setInternalKillSwitch(!currentKillSwitch);
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ApexFin <span className="text-emerald-400 font-mono text-sm uppercase px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">AI</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Autonomous Swarm
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden lg:block">
              Autonomous FinTech Cloud & Transaction Resilience Platform • Google Gemini & BigQuery
            </p>
          </div>
        </Link>
      </div>

      {/* Center Nav Links */}
      <nav className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl">
        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Operations Console</span>
        </Link>

        <Link
          href="/about"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/about'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About Us & Platform</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hidden sm:inline">
            Docs
          </span>
        </Link>
      </nav>

      {/* Control Actions & Status */}
      <div className="flex items-center gap-2.5">
        {/* Security & Shield Sandbox Button */}
        {onOpenSecurityModal ? (
          <button
            onClick={onOpenSecurityModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors shadow-sm"
            title="Open Zero-Trust Security & Prompt Shield Testing Deck"
          >
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Prompt Shield & PCI</span>
            <span className="sm:hidden">Shield</span>
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Test In Console</span>
          </Link>
        )}

        {/* Gemini Engine Mode Badge */}
        <button
          onClick={() => {
            setTempKey(currentApiKey);
            setShowKeyModal(true);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
            currentApiKey
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/50'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-700/80 hover:bg-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">
            {currentApiKey ? 'Live Gemini 2.0 API' : 'Simulation Mode'}
          </span>
          <span className="md:hidden">
            {currentApiKey ? 'Live API' : 'Sim Mode'}
          </span>
          <Key className="w-3 h-3 text-zinc-400 ml-0.5" />
        </button>

        {/* Emergency Kill-Switch */}
        <button
          onClick={handleToggleKillSwitch}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            currentKillSwitch
              ? 'bg-rose-950/80 text-rose-300 border-rose-600 shadow-lg shadow-rose-950/80 animate-pulse'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-rose-400 hover:border-rose-900/60'
          }`}
          title={
            currentKillSwitch
              ? 'Click to resume autonomous actuation'
              : 'Emergency SRE Kill-Switch: Halts all autonomous actions'
          }
        >
          <Power className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {currentKillSwitch ? 'AUTONOMY HALTED' : 'Kill-Switch'}
          </span>
        </button>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Google Gemini API Configuration</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              ApexFin AI operates seamlessly in <strong className="text-zinc-200">Zero-Config Simulation Mode</strong> for instant evaluation. Provide an optional Google Gemini API Key to enable live multimodal reasoning with <code className="text-emerald-400">gemini-2.0-flash</code> and <code className="text-emerald-400">gemini-1.5-pro</code>.
            </p>
            <input
              type="password"
              placeholder="Enter GEMINI_API_KEY (AIzaSy...)"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500 mb-4"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setTempKey('');
                  if (propSetApiKey) propSetApiKey('');
                  else {
                    setInternalKey('');
                    localStorage.removeItem('apexfin_gemini_key');
                  }
                  setShowKeyModal(false);
                }}
                className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Clear / Use Simulation
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
