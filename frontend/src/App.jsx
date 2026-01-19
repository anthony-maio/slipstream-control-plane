import React, { useState, useEffect, useRef } from 'react';
import { Metrics } from './components/Metrics.jsx';
import { TrafficLog } from './components/TrafficLog.jsx';
import { NetworkGraph } from './components/NetworkGraph.jsx';
import { Registry } from './components/Registry.jsx';
import { Resources } from './components/Resources.jsx';
import { Autotuner } from './components/Autotuner.jsx';
import { Database, BookOpen, Home } from 'lucide-react';
import { cn } from './lib/utils.js';

// Custom Slipstream wave logo
function SlipstreamLogo({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M8 28C12 28 14 20 20 20C26 20 28 28 32 28"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8 20C12 20 14 12 20 12C26 12 28 20 32 20"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('slipstream');
  const [view, setView] = useState('resources'); // Default to 'resources'
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  // Computed Stats
  const stats = messages.reduce((acc, msg) => {
    if (msg.type === 'traffic') {
      acc.totalJsonTokens += msg.metrics.json_tokens;
      acc.totalSlipTokens += msg.metrics.slip_tokens;

      // Advanced Metrics
      if (msg.advanced) {
        acc.latencySum += msg.advanced.latency_ms;
        if (msg.advanced.status === 'disagreement') acc.disagreementCount += 1;
        if (msg.advanced.status === 'recovery') {
          acc.recoverySum += msg.advanced.recovery_time_ms;
          acc.recoveryCount += 1;
        }
      }

      acc.count += 1;
    }
    return acc;
  }, {
    totalJsonTokens: 0,
    totalSlipTokens: 0,
    count: 0,
    latencySum: 0,
    disagreementCount: 0,
    recoverySum: 0,
    recoveryCount: 0
  });

  const totalSavedTokens = stats.totalJsonTokens - stats.totalSlipTokens;
  const avgSavings = stats.count > 0 ? (totalSavedTokens / stats.totalJsonTokens) * 100 : 0;

  const avgLatency = stats.count > 0 ? stats.latencySum / stats.count : 0;
  const disagreementRate = stats.count > 0 ? (stats.disagreementCount / stats.count) * 100 : 0;
  const avgRecoveryTime = stats.recoveryCount > 0 ? stats.recoverySum / stats.recoveryCount : 0;

  const finalStats = {
    totalSavedTokens,
    avgSavings,
    avgLatency,
    disagreementRate,
    avgRecoveryTime
  };

  useEffect(() => {
    // Connect to WebSocket
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hubPath = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}/ws/hub`;
      console.log("Attempting WS Connection to:", hubPath); // DEBUG
      ws.current = new WebSocket(hubPath);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log("Connected to Control Plane");
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'history_sync') {
          setMessages(data.messages.filter(m => m.type === 'traffic'));
          setProposals(data.messages.filter(m => m.type === 'proposal'));
        } else if (data.type === 'traffic') {
          setMessages(prev => [...prev, data]);
        } else if (data.type === 'proposal') {
          setProposals(prev => [...prev, data]);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000); // Reconnect
      };
    };

    connect();
    return () => ws.current?.close();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 bg-glow-top">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 flex flex-col min-h-screen">

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <SlipstreamLogo className="w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                Slipstream
              </span>
              <span className="text-foreground ml-1">Control Plane</span>
              <span className="text-xs align-top ml-2 font-mono text-secondary bg-card px-2 py-0.5 rounded border border-border">v2.4</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-card/50 p-1 rounded-lg border border-border/50 backdrop-blur">
            <button
              onClick={() => setView('dashboard')}
              className={cn(
                "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                view === 'dashboard'
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-secondary hover:text-foreground hover:bg-card"
              )}
            >
              <Home size={16} /> Dashboard
            </button>
            <button
              onClick={() => setView('registry')}
              className={cn(
                "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                view === 'registry'
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-secondary hover:text-foreground hover:bg-card"
              )}
            >
              <Database size={16} /> Registry
            </button>
            <button
              onClick={() => setView('resources')}
              className={cn(
                "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                view === 'resources'
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-secondary hover:text-foreground hover:bg-card"
              )}
            >
              <BookOpen size={16} /> Resources
            </button>
          </nav>

          {/* Mode Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary font-medium">Slipstream (Quantized)</span>
            <button
              onClick={() => setMode(mode === 'slipstream' ? 'json' : 'slipstream')}
              className={cn(
                "relative w-14 h-7 rounded-full transition-all duration-300",
                mode === 'slipstream'
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                  : "bg-card border border-border"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                  mode === 'slipstream' ? "left-8" : "left-1"
                )}
              />
            </button>
          </div>
        </header>

        <main className="flex-1">
          {view === 'dashboard' ? (
            <>
              {/* Metrics */}
              <Metrics stats={finalStats} />

              {/* Side-by-side: Network Graph + Traffic Log */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <NetworkGraph messages={messages} />
                </div>
                <div className="lg:col-span-2">
                  <TrafficLog messages={messages} mode={mode} />
                </div>
              </div>
            </>
          ) : view === 'registry' ? (
            <Registry />
          ) : (
            <Resources onNavigate={setView} />
          )}
        </main>

        {/* Autotuner Overlay (Always active) */}
        <Autotuner
          proposals={proposals}
          onApprove={(id) => {
            const latestProposal = proposals[proposals.length - 1];
            if (!id) {
              // Dismiss - send to backend so it stops re-proposing
              if (latestProposal && ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                  type: 'dismiss_anchor',
                  mnemonic: latestProposal.mnemonic
                }));
              }
              setProposals(prev => prev.filter(p => p.id !== latestProposal?.id));
              return;
            }
            const p = proposals.find(p => p.id === id);
            if (p) {
              // Send approval to backend
              if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                  type: 'approve_anchor',
                  mnemonic: p.mnemonic
                }));
              }
              setToast(`Anchor '${p.mnemonic}' Registered to Universal Control Registry`);
              setTimeout(() => setToast(null), 3000);
            }
            setProposals(prev => prev.filter(p => p.id !== id));
          }}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-3 rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 font-mono text-sm z-50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {toast}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-secondary">
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <span className="text-border">•</span>
              <a href="#" className="hover:text-foreground transition-colors">API Reference</a>
              <span className="text-border">•</span>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              <span className="font-mono">{isConnected ? "SYSTEM ACTIVE" : "DISCONNECTED"}</span>
            </div>
            <p className="text-secondary/60">
              Copyright © {new Date().getFullYear()}. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
