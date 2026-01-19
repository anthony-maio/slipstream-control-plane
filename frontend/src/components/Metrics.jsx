import { TrendingUp, TrendingDown, Zap, DollarSign, Clock, AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export function Metrics({ stats }) {
    const cards = [
        {
            label: "Avg Token Reduction",
            value: `${stats.avgSavings.toFixed(1)}%`,
            icon: TrendingUp,
            iconBg: "bg-emerald-500/20",
            iconColor: "text-emerald-400",
            trend: "up",
            sub: "Last 24h"
        },
        {
            label: "Total Tokens Saved",
            value: stats.totalSavedTokens.toLocaleString(),
            icon: Zap,
            iconBg: "bg-cyan-500/20",
            iconColor: "text-cyan-400",
            trend: "up",
            sub: "Last 24h"
        },
        {
            label: "Est. Cost Savings",
            value: `$${(stats.totalSavedTokens * 0.00001).toFixed(2)}`,
            icon: DollarSign,
            iconBg: "bg-green-500/20",
            iconColor: "text-green-400",
            trend: "up",
            sub: "Last 24h"
        },
        {
            label: "Avg Latency",
            value: `${stats.avgLatency.toFixed(0)}ms`,
            icon: Clock,
            iconBg: "bg-blue-500/20",
            iconColor: "text-blue-400",
            trend: "neutral",
            sub: "Last 24h"
        },
        {
            label: "Disagreement Rate",
            value: `${stats.disagreementRate.toFixed(1)}%`,
            icon: AlertTriangle,
            iconBg: "bg-amber-500/20",
            iconColor: "text-amber-400",
            trend: "down",
            sub: "Last 24h"
        },
        {
            label: "Avg Recovery Time",
            value: `${(stats.avgRecoveryTime / 1000).toFixed(1)}s`,
            icon: RefreshCcw,
            iconBg: "bg-violet-500/20",
            iconColor: "text-violet-400",
            trend: "neutral",
            sub: "Last 24h"
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="metric-card glass-card p-4 rounded-xl relative group"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                            <card.icon size={18} className={card.iconColor} />
                        </div>
                        <TrendIndicator trend={card.trend} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{card.value}</h3>
                    <p className="text-secondary text-xs font-medium">{card.label}</p>
                    <p className="text-secondary/50 text-[10px] mt-1">{card.sub}</p>
                </motion.div>
            ))}
        </div>
    );
}

function TrendIndicator({ trend }) {
    if (trend === 'up') {
        return (
            <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp size={14} />
            </div>
        );
    }
    if (trend === 'down') {
        return (
            <div className="flex items-center gap-1 text-amber-400">
                <TrendingDown size={14} />
            </div>
        );
    }
    return null;
}
