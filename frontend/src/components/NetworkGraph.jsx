import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Brain, Globe, Laptop, Bot, User, Cpu } from 'lucide-react';
import { cn } from '../lib/utils.js';

// Icon mapping (Fallback to Bot if unknown)
const ICONS = {
    Planner: Brain,
    Executor: Server,
    Frontend: Laptop,
    Backend: Database,
    QA: Globe,
    HumanOperator: User
};

const COLORS = {
    Planner: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40", glow: "shadow-purple-500/30" },
    Executor: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40", glow: "shadow-blue-500/30" },
    Frontend: { text: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/40", glow: "shadow-pink-500/30" },
    Backend: { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40", glow: "shadow-emerald-500/30" },
    QA: { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/40", glow: "shadow-orange-500/30" },
    HumanOperator: { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/40", glow: "shadow-yellow-500/30" }
};

const DEFAULT_COLOR = { text: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/40", glow: "shadow-gray-500/30" };

export function NetworkGraph({ messages }) {
    const [nodes, setNodes] = useState(new Set(["Planner", "Executor", "Frontend", "Backend", "QA"]));
    const [particles, setParticles] = useState([]);

    // Auto-discover nodes from traffic
    useEffect(() => {
        if (messages.length === 0) return;

        const latestMsg = messages[messages.length - 1];
        setNodes(prev => {
            const next = new Set(prev);
            if (!next.has(latestMsg.src)) next.add(latestMsg.src);
            if (!next.has(latestMsg.dst)) next.add(latestMsg.dst);
            return next.size > prev.size ? next : prev;
        });
    }, [messages]);

    // Calculate Layout (Circular with specific positions matching ui.png)
    const layout = useMemo(() => {
        const nodeList = Array.from(nodes);
        const count = nodeList.length;
        const centerX = 250;
        const centerY = 220;
        const radius = 160;

        const positions = {};

        nodeList.forEach((node, index) => {
            // Position nodes around the circle, starting from top-left
            const angle = (index / count) * 2 * Math.PI - (Math.PI / 2) - (Math.PI / 5);

            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            positions[node] = {
                x,
                y,
                icon: ICONS[node] || Bot,
                colors: COLORS[node] || DEFAULT_COLOR
            };
        });

        return positions;
    }, [nodes]);

    // Particle Logic
    useEffect(() => {
        if (messages.length === 0) return;
        const latestMsg = messages[messages.length - 1];

        if (!layout[latestMsg.src] || !layout[latestMsg.dst]) return;

        const srcNode = layout[latestMsg.src];
        const dstNode = layout[latestMsg.dst];

        const id = Math.random().toString(36);
        const isSlipstream = !latestMsg.json_equiv || (latestMsg.metrics && latestMsg.metrics.savings_pct > 0);

        setParticles(prev => [...prev, {
            id,
            x1: srcNode.x,
            y1: srcNode.y,
            x2: dstNode.x,
            y2: dstNode.y,
            isSlipstream
        }]);

        setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 2000);

    }, [messages, layout]);

    return (
        <div className="w-full h-[500px] glass-card rounded-2xl relative overflow-hidden">
            {/* Background gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-blue-500/5" />

            <svg className="w-full h-full" viewBox="0 0 500 480">
                <defs>
                    {/* Glow filter for particles */}
                    <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Central glow gradient */}
                    <radialGradient id="centerGlow" cx="50%" cy="46%" r="30%">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
                        <stop offset="50%" stopColor="rgba(99, 102, 241, 0.08)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>

                    {/* Line gradient */}
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
                        <stop offset="50%" stopColor="rgba(99, 102, 241, 0.2)" />
                        <stop offset="100%" stopColor="rgba(56, 189, 248, 0.3)" />
                    </linearGradient>
                </defs>

                {/* Central glow */}
                <circle cx="250" cy="220" r="150" fill="url(#centerGlow)" />

                {/* Orbital rings */}
                <circle cx="250" cy="220" r="160" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
                <circle cx="250" cy="220" r="120" fill="none" stroke="rgba(99, 102, 241, 0.06)" strokeWidth="1" />
                <circle cx="250" cy="220" r="80" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />

                {/* Connection lines (mesh) */}
                {Object.keys(layout).map((k1, i) =>
                    Object.keys(layout).slice(i + 1).map(k2 => (
                        <line
                            key={`${k1}-${k2}`}
                            x1={layout[k1].x} y1={layout[k1].y}
                            x2={layout[k2].x} y2={layout[k2].y}
                            stroke="url(#lineGradient)"
                            strokeWidth="1"
                            opacity="0.4"
                        />
                    ))
                )}

                {/* Animated particles */}
                <AnimatePresence>
                    {particles.map(p => (
                        <motion.g key={p.id}>
                            {/* Particle trail */}
                            <motion.line
                                x1={p.x1}
                                y1={p.y1}
                                x2={p.x1}
                                y2={p.y1}
                                stroke={p.isSlipstream ? "#38bdf8" : "#f59e0b"}
                                strokeWidth="2"
                                opacity="0.5"
                                initial={{ x2: p.x1, y2: p.y1 }}
                                animate={{ x2: p.x2, y2: p.y2 }}
                                transition={{
                                    duration: p.isSlipstream ? 0.6 : 1.8,
                                    ease: "easeInOut"
                                }}
                            />
                            {/* Particle dot */}
                            <motion.circle
                                r={p.isSlipstream ? 5 : 7}
                                fill={p.isSlipstream ? "#38bdf8" : "#f59e0b"}
                                filter="url(#particleGlow)"
                                initial={{ cx: p.x1, cy: p.y1, opacity: 0 }}
                                animate={{
                                    cx: p.x2,
                                    cy: p.y2,
                                    opacity: [0, 1, 1, 0]
                                }}
                                transition={{
                                    duration: p.isSlipstream ? 0.6 : 1.8,
                                    ease: "easeInOut"
                                }}
                            />
                        </motion.g>
                    ))}
                </AnimatePresence>

                {/* Node circles and icons */}
                {Object.entries(layout).map(([name, config]) => (
                    <g key={name}>
                        {/* Outer glow ring */}
                        <circle
                            cx={config.x}
                            cy={config.y}
                            r="36"
                            fill="none"
                            stroke={config.colors.text.includes('purple') ? 'rgba(168, 85, 247, 0.2)' :
                                   config.colors.text.includes('blue') ? 'rgba(59, 130, 246, 0.2)' :
                                   config.colors.text.includes('pink') ? 'rgba(236, 72, 153, 0.2)' :
                                   config.colors.text.includes('emerald') ? 'rgba(16, 185, 129, 0.2)' :
                                   config.colors.text.includes('orange') ? 'rgba(249, 115, 22, 0.2)' :
                                   'rgba(156, 163, 175, 0.2)'}
                            strokeWidth="2"
                        />
                        {/* Inner circle background */}
                        <circle
                            cx={config.x}
                            cy={config.y}
                            r="30"
                            fill="rgba(24, 24, 27, 0.9)"
                            stroke={config.colors.text.includes('purple') ? 'rgba(168, 85, 247, 0.4)' :
                                   config.colors.text.includes('blue') ? 'rgba(59, 130, 246, 0.4)' :
                                   config.colors.text.includes('pink') ? 'rgba(236, 72, 153, 0.4)' :
                                   config.colors.text.includes('emerald') ? 'rgba(16, 185, 129, 0.4)' :
                                   config.colors.text.includes('orange') ? 'rgba(249, 115, 22, 0.4)' :
                                   'rgba(156, 163, 175, 0.4)'}
                            strokeWidth="1"
                        />
                    </g>
                ))}
            </svg>

            {/* Render Node Icons (as HTML for better icon rendering) */}
            {Object.entries(layout).map(([name, config]) => {
                const IconComponent = config.icon;
                return (
                    <motion.div
                        key={name}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="absolute flex flex-col items-center"
                        style={{
                            left: `${(config.x / 500) * 100}%`,
                            top: `${(config.y / 480) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center",
                            config.colors.bg,
                            "border",
                            config.colors.border,
                            "shadow-lg",
                            config.colors.glow
                        )}>
                            <IconComponent className={config.colors.text} size={24} />
                        </div>
                        <span className="mt-2 text-xs font-medium text-secondary whitespace-nowrap">
                            {name}
                        </span>
                    </motion.div>
                );
            })}

            {/* Compressed Traffic indicator */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-secondary">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/50">
                    <Cpu size={12} className="text-cyan-400" />
                    <span>Compressed Traffic</span>
                </div>
            </div>
        </div>
    );
}
