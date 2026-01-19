import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Brain, Globe, Laptop, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils.js';;

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
    Planner: "text-purple-400",
    Executor: "text-blue-400",
    Frontend: "text-pink-400",
    Backend: "text-green-400",
    QA: "text-orange-400",
    HumanOperator: "text-yellow-400"
};

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

    // Calculate Layout (Circular)
    const layout = useMemo(() => {
        const nodeList = Array.from(nodes);
        const count = nodeList.length;

        const positions = {};

        nodeList.forEach((node, index) => {
            const angle = (index / count) * 2 * Math.PI - (Math.PI / 2); // Start at top

            // Calculate relative keypoints (reduced radius for better containment)
            const relX = 0.5 + 0.28 * Math.cos(angle);
            const relY = 0.5 + 0.30 * Math.sin(angle);

            positions[node] = {
                left: `${relX * 100}%`,
                top: `${relY * 100}%`,
                x: relX * 800, // Project to SVG ViewBox (800w)
                y: relY * 500, // Project to SVG ViewBox (500h)
                icon: ICONS[node] || Bot,
                color: COLORS[node] || "text-gray-400"
            };
        });

        return positions;
    }, [nodes]);

    // Particle Logic
    useEffect(() => {
        if (messages.length === 0) return;
        const latestMsg = messages[messages.length - 1];

        // Wait for layout update if new node just appeared
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
        <div className="w-full h-[400px] bg-card/50 border border-border rounded-2xl relative overflow-hidden backdrop-blur-sm shadow-xl p-4">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />

            <svg className="w-full h-full" viewBox="0 0 800 500">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Edges (Fully Connected Mesh, faint) */}
                {Object.keys(layout).map((k1, i) =>
                    Object.keys(layout).slice(i + 1).map(k2 => (
                        <line
                            key={`${k1}-${k2}`}
                            x1={layout[k1].x} y1={layout[k1].y}
                            x2={layout[k2].x} y2={layout[k2].y}
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="1"
                        />
                    ))
                )}

                {/* Particles */}
                <AnimatePresence>
                    {particles.map(p => (
                        <motion.circle
                            key={p.id}
                            r={p.isSlipstream ? 4 : 8}
                            fill={p.isSlipstream ? "#6366f1" : "#f59e0b"}
                            initial={{ cx: p.x1, cy: p.y1, opacity: 0 }}
                            animate={{
                                cx: [p.x1, p.x2],
                                cy: p.y2, // Correction: target Y
                                opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                                duration: p.isSlipstream ? 0.6 : 1.8,
                                ease: "easeInOut"
                            }}
                        >
                            <animate attributeName="cx" from={p.x1} to={p.x2} dur={p.isSlipstream ? "0.6s" : "1.8s"} fill="freeze" />
                            <animate attributeName="cy" from={p.y1} to={p.y2} dur={p.isSlipstream ? "0.6s" : "1.8s"} fill="freeze" />
                        </motion.circle>
                    ))}
                </AnimatePresence>
            </svg>

            {/* Render Nodes */}
            {Object.entries(layout).map(([name, config]) => (
                <motion.div
                    layout
                    key={name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="absolute flex flex-col items-center gap-2"
                    style={{ left: config.left, top: config.top, transform: 'translate(-50%, -50%)' }}
                >
                    <div className={cn(
                        "p-4 rounded-2xl bg-background border border-border shadow-2xl relative z-10",
                        "shadow-[0_0_30px_-5px_var(--tw-shadow-color)]",
                        config.color.replace('text-', 'shadow-') + '/20'
                    )}>
                        <config.icon className={config.color} size={32} />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-card border border-white/5 text-xs font-mono font-medium text-secondary whitespace-nowrap">
                        {name}
                    </div>
                </motion.div>
            ))}



        </div>
    );
}
