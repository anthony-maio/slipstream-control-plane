import React, { useState, useEffect, useRef } from 'react';
import { Metrics } from './components/Metrics.jsx';
import { TrafficLog } from './components/TrafficLog.jsx';
import { NetworkGraph } from './components/NetworkGraph.jsx';
import { Registry } from './components/Registry.jsx';
import { Resources } from './components/Resources.jsx';
import { Autotuner } from './components/Autotuner.jsx';
import { Layers, LayoutDashboard, Database, BookOpen } from 'lucide-react';
import { cn } from './lib/utils.js';

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
    <div className="min-h-screen bg-background text-foreground p-8 font-sans selection:bg-primary/30">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Layers className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Slipstream
                <span className="text-blue-500 text-sm align-top ml-2 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">v2.4</span>
              </h1>
              <p className="text-secondary font-medium">Semantic Control Plane</p>
            </div>
          </div>

          <div className="flex items-center bg-card p-1 rounded-lg border border-border">
            <button
              onClick={() => setView('dashboard')}
              className={cn("px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors", view === 'dashboard' ? "bg-primary text-white" : "text-secondary hover:text-white")}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              onClick={() => setView('registry')}
              className={cn("px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors", view === 'registry' ? "bg-primary text-white" : "text-secondary hover:text-white")}
            >
              <Database size={16} /> Registry
            </button>
            <button
              onClick={() => setView('resources')}
              className={cn("px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors", view === 'resources' ? "bg-primary text-white" : "text-secondary hover:text-white")}
            >
              <BookOpen size={16} /> Resources
            </button>
          </div>

          <div className="flex items-center gap-4 bg-card p-1.5 rounded-full border border-border shadow-sm">
            {/* Mode Toggles */}
            <ModeToggle
              value="json"
              current={mode}
              onClick={setMode}
              label="Verbose (JSON)"
              tooltip="Monitor raw, uncompressed traffic. Identify redundant data patterns manually."
            />
            <ModeToggle
              value="slipstream"
              current={mode}
              onClick={setMode}
              label="Slipstream (Quantized)"
              tooltip="View semantic anchors and compressed token streams. Observe bandwidth savings in real-time."
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-secondary">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            {isConnected ? "SYSTEM ACTIVE" : "DISCONNECTED"}
          </div>
        </header>

        {view === 'dashboard' ? (
          <>
            {/* Metrics */}
            <Metrics stats={finalStats} />

            {/* Network Graph */}
            <NetworkGraph messages={messages} />

            {/* Main Content */}
            <TrafficLog messages={messages} mode={mode} />
          </>
        ) : view === 'registry' ? (
          <Registry />
        ) : (
          <Resources onNavigate={setView} />
        )}

        {/* Autotuner Overlay (Always active) */}
        <Autotuner
          proposals={proposals}
          onApprove={(id) => {
            if (!id) {
              // Dismiss
              setProposals(prev => prev.filter(p => p.id !== proposals[proposals.length - 1]?.id));
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

      </div>
    </div>
  );
}

function ModeToggle({ value, current, onClick, label, tooltip }) {
  const isActive = value === current;
  return (
    <div className="relative group">
      <button
        onClick={() => onClick(value)}
        className={cn(
          "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
          isActive
            ? "bg-primary text-white shadow-md scale-105"
            : "text-secondary hover:text-foreground hover:bg-white/5"
        )}
      >
        {label}
      </button>
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[10px] text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {tooltip}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-black/90" />
      </div>
    </div>
  );
}

export default App;
