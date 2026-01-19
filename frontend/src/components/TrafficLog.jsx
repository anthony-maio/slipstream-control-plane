import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Box, Cpu, Zap, TrendingDown, Server, Database, Brain, Globe, Laptop, Bot, User } from 'lucide-react';

// Icon mappings (same as NetworkGraph)
const ICONS = {
    Planner: Brain,
    Executor: Server,
    Frontend: Laptop,
    Backend: Database,
    QA: Globe,
    HumanOperator: User
};

const COLORS = {
    Planner: "text-purple-400",
    Executor: "text-blue-400",
    Frontend: "text-pink-400",
    Backend: "text-green-400",
    QA: "text-orange-400",
    HumanOperator: "text-yellow-400"
};

const BG_COLORS = {
    Planner: "bg-purple-500/20 border-purple-500/30",
    Executor: "bg-blue-500/20 border-blue-500/30",
    Frontend: "bg-pink-500/20 border-pink-500/30",
    Backend: "bg-green-500/20 border-green-500/30",
    QA: "bg-orange-500/20 border-orange-500/30",
    HumanOperator: "bg-yellow-500/20 border-yellow-500/30"
};

function AgentIcon({ name }) {
    const IconComponent = ICONS[name] || Bot;
    const colorClass = COLORS[name] || "text-gray-400";
    const bgClass = BG_COLORS[name] || "bg-gray-500/20 border-gray-500/30";
    return (
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${bgClass}`}>
            <IconComponent className={colorClass} size={16} />
        </div>
    );
}

export function TrafficLog({ messages, mode }) {
    return (
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Cpu className="text-blue-500" size={18} />
                    Protocol Traffic
                </h2>
                <div className="text-xs font-mono text-secondary">
                    Live Feed • {messages.length} events
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                    {messages.slice().reverse().map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="group relative"
                        >
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-background/40 hover:bg-background/80 border border-border/50 hover:border-primary/20 transition-all">
                                {/* Agent Icons */}
                                <div className="flex flex-col items-center gap-2 min-w-[60px]">
                                    <AgentIcon name={msg.src} />
                                    <ArrowRight size={14} className="text-secondary rotate-90" />
                                    <AgentIcon name={msg.dst} />
                                </div>

                                <div className="flex-1 space-y-3">
                                    {/* Thought Process (Always Visible) */}
                                    <div className="text-sm text-secondary italic border-l-2 border-border pl-3">
                                        "{msg.thought}"
                                    </div>

                                    {/* Wire Format Comparison - Controlled by Mode */}
                                    {mode === 'json' ? (
                                        /* JSON View */
                                        <div className="p-3 rounded-lg bg-black/40 border border-border font-mono text-xs overflow-x-auto ring-1 ring-white/5 animate-in fade-in slide-in-from-left-4 duration-300">
                                            <div className="text-secondary mb-1 flex justify-between">
                                                <span className="font-bold text-red-400 flex items-center gap-2">
                                                    <Box size={14} /> Raw JSON
                                                </span>
                                                <span className="text-secondary/60">{msg.metrics.json_tokens} tokens</span>
                                            </div>
                                            <pre className="text-secondary/80 whitespace-pre-wrap break-all opacity-80 hover:opacity-100 transition-opacity">
                                                {msg.json_equiv}
                                            </pre>
                                        </div>
                                    ) : (
                                        /* Slipstream View */
                                        <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/50 font-mono text-xs overflow-x-auto ring-1 ring-blue-500/20 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="text-blue-400 mb-1 flex justify-between">
                                                <span className="flex items-center gap-1.5 font-bold"><ZapIcon /> Slipstream Quantized</span>
                                                <span className="text-blue-200">{msg.metrics.slip_tokens} tokens</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-blue-500/30">Anchor</span>
                                                <span className="text-blue-200 font-bold text-sm tracking-wide">{msg.anchor}</span>
                                            </div>
                                            <div className="text-blue-100/80 whitespace-pre-wrap break-all">
                                                {msg.slip_wire}
                                            </div>
                                        </div>
                                    )}

                                    {/* Savings Badge */}
                                    <div className="flex justify-end">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                            <TrendingDownIcon size={12} />
                                            {msg.metrics.savings_pct}% Reduction
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ZapIcon() {
    return <Zap size={12} className="inline" />
}

function TrendingDownIcon({ size }) {
    return <TrendingDown size={size} />
}


