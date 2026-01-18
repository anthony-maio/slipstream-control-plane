import { NetworkGraph } from './components/NetworkGraph';
import { Registry } from './components/Registry';
import { Resources } from './components/Resources';
import { Activity, Radio, Layers, LayoutDashboard, Database, BookOpen } from 'lucide-react';
import { cn } from './lib/utils';;

function App() {
  const [messages, setMessages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [mode, setMode] = useState('slipstream');
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'registry' | 'resources'
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  // ... (Stats calculation code remains same) ...

  // ... (useEffect / WebSocket code remains same) ...

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
            <ModeToggle value="json" current={mode} onClick={setMode} label="Verbose (JSON)" />
            <ModeToggle value="slipstream" current={mode} onClick={setMode} label="Slipstream (Quantized)" />
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
          <Resources />
        )}

        {/* Autotuner Overlay (Always active) */}
        <Autotuner
          proposals={proposals}
          onApprove={(id) => setProposals(prev => prev.filter(p => p.id !== id))}
        />

      </div>
    </div>
  );
}

function ModeToggle({ value, current, onClick, label }) {
  const isActive = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-primary text-white shadow-md"
          : "text-secondary hover:text-foreground hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}

export default App;
