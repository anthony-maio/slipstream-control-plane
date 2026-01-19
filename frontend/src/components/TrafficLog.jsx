import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Brain, Globe, Laptop, Bot, User } from 'lucide-react';

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
    Planner: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
    Executor: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
    Frontend: { text: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30" },
    Backend: { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
    QA: { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
    HumanOperator: { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" }
};

const DEFAULT_COLOR = { text: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30" };

function AgentBadge({ name }) {
    const IconComponent = ICONS[name] || Bot;
    const colors = COLORS[name] || DEFAULT_COLOR;
    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${colors.bg} ${colors.border} border`}>
            <IconComponent className={colors.text} size={14} />
            <span className={`text-sm font-medium ${colors.text}`}>{name}</span>
        </div>
    );
}

function formatTimeAgo(index, total) {
    // Simple mock time ago based on position
    if (index === total - 1) return 'Now';
    const seconds = (total - 1 - index) * 2;
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
}

export function TrafficLog({ messages, mode }) {
    return (
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h2 className="text-base font-semibold text-foreground">Protocol Traffic</h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-secondary">Real-time update</span>
                </div>
            </div>

            {/* Traffic List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <AnimatePresence initial={false}>
                    {messages.slice().reverse().slice(0, 20).map((msg, idx) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-card/60 rounded-xl p-3 border border-border/30 hover:border-border/60 transition-colors"
                        >
                            {/* Header: Agent + Time */}
                            <div className="flex items-center justify-between mb-2">
                                <AgentBadge name={msg.src} />
                                <span className="text-[10px] text-secondary/60 font-mono">
                                    {formatTimeAgo(messages.length - 1 - idx, messages.length)}
                                </span>
                            </div>

                            {/* Thought/Message */}
                            <p className="text-xs text-secondary mb-3 leading-relaxed">
                                <span className="text-secondary/60">"</span>
                                {msg.thought?.slice(0, 60)}{msg.thought?.length > 60 ? '...' : ''}
                                <span className="text-secondary/60">"</span>
                            </p>

                            {/* Code Block */}
                            <div className="bg-background/80 rounded-lg p-2.5 font-mono text-[11px] border border-border/20 mb-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-cyan-400 text-[10px]">
                                        Slipstream::Quantized::ANCHOR:
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
                                        {msg.metrics.savings_pct}% Reduction
                                    </span>
                                </div>
                                <div className="text-secondary/80 break-all">
                                    {mode === 'json' ? (
                                        <span className="text-amber-300/80">
                                            {msg.json_equiv?.slice(0, 100)}{msg.json_equiv?.length > 100 ? '...' : ''}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-blue-300">{msg.anchor}</span>
                                            <span className="text-secondary/50">(</span>
                                            <span className="text-purple-300">{msg.slip_wire?.slice(0, 60)}</span>
                                            {msg.slip_wire?.length > 60 ? '...' : ''}
                                            <span className="text-secondary/50">)</span>
                                        </>
                                    )}
                                </div>
                                <div className="text-secondary/40 text-[10px] mt-1.5">
                                    Size: {msg.metrics.json_tokens}b → {msg.metrics.slip_tokens}b
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {messages.length === 0 && (
                    <div className="text-center py-12 text-secondary/50 text-sm">
                        Waiting for traffic...
                    </div>
                )}
            </div>
        </div>
    );
}


