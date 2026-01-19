import React from 'react';
import { BookOpen, Map, LayoutDashboard, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils.js';

export function Resources({ onNavigate }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Welcome to Slipstream</h2>
                    <p className="text-lg text-indigo-200 max-w-2xl mb-8 leading-relaxed">
                        A semantic quantization protocol for multi-agent systems. Slipstream uses shared conceptual anchors (UCR) to compress verbose JSON communication into dense, efficient tokens, achieving up to 90% bandwidth reduction.
                    </p>

                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center gap-2 group"
                    >
                        See it in Action
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="mt-4 flex gap-4 text-sm text-indigo-300/80">
                        <span className="flex items-center gap-1">✨ GPT-5 Ready</span>
                        <span className="flex items-center gap-1">🔒 Enterprise Security</span>
                        <span className="flex items-center gap-1">🚀 &lt; 100ms Latency</span>
                    </div>
                </div>
            </div>

            {/* Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Registry Guide */}
                <div className="p-6 bg-card border border-border rounded-2xl hover:bg-card/80 transition-colors group cursor-pointer" onClick={() => onNavigate('registry')}>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Map className="text-emerald-400" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        Universal Concept Registry
                        <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400" />
                    </h3>
                    <p className="text-secondary leading-relaxed">
                        The <strong>Registry</strong> contains the global dictionary of compressed "anchors".
                        Each anchor maps a complex semantic concept (like "Authentication Protocol") to a single token, visible and synchronized across the entire swarm.
                    </p>
                </div>

                {/* Dashboard Guide */}
                <div className="p-6 bg-card border border-border rounded-2xl hover:bg-card/80 transition-colors group cursor-pointer" onClick={() => onNavigate('dashboard')}>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                        Live Control Plane
                        <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                    </h3>
                    <p className="text-secondary leading-relaxed">
                        The <strong>Dashboard</strong> visualizes real-time agent traffic. Watch as the <strong>Autotuner</strong> detects repetitive patterns and proposes new anchors, dynamically optimizing the network before your eyes.
                    </p>
                </div>

            </div>

            {/* External Link */}
            <a
                href="https://raw.githubusercontent.com/anthony-maio/slipcore/refs/heads/master/spec/slip-spec.md"
                target="_blank"
                rel="noreferrer"
                className="block p-4 mt-8 bg-black/20 border border-white/5 rounded-xl text-center text-sm text-secondary hover:text-white hover:bg-black/40 transition-colors"
            >
                Read the Protocol Specification <ExternalLink size={12} className="inline ml-1 mb-0.5" />
            </a>
        </div>
    );
}
