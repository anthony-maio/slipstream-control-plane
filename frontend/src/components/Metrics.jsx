import { TrendingDown, Zap, DollarSign, Clock, AlertTriangle, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

export function Metrics({ stats }) {
    const cards = [
        {
            label: "Avg Token Reduction",
            value: `${stats.avgSavings.toFixed(1)}%`,
            icon: TrendingDown,
            color: "text-green-400",
            sub: "vs JSON payload"
        },
        {
            label: "Total Tokens Saved",
            value: stats.totalSavedTokens.toLocaleString(),
            icon: Zap,
            color: "text-amber-400",
            sub: "cumulative"
        },
        {
            label: "Est. Cost Savings",
            value: `$${(stats.totalSavedTokens * 0.000005).toFixed(4)}`, // $5/1M assumption
            icon: DollarSign,
            color: "text-blue-400",
            sub: "@ GPT-4o pricing"
        },
        // Advanced Metrics
        {
            label: "Avg Latency",
            value: `${stats.avgLatency.toFixed(0)} ms`,
            icon: Clock,
            color: "text-violet-400",
            sub: "network time"
        },
        {
            label: "Disagreement Rate",
            value: `${stats.disagreementRate.toFixed(1)}%`,
            icon: AlertTriangle,
            color: "text-red-400",
            sub: "consensus failures"
        },
        {
            label: "Avg Recovery Time",
            value: `${(stats.avgRecoveryTime / 1000).toFixed(1)}s`,
            icon: Wrench,
            color: "text-orange-400",
            sub: "self-correction speed"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card border border-border p-6 rounded-2xl shadow-lg hover:shadow-primary/5 transition-shadow"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-secondary text-sm font-medium">{card.label}</p>
                            <h3 className="text-3xl font-bold text-foreground mt-1">{card.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-background/50 ${card.color}`}>
                            <card.icon size={24} />
                        </div>
                    </div>
                    <div className="text-xs text-secondary/60 font-mono">
                        {card.sub}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
