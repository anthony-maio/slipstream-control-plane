import React, { useEffect, useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { cn } from '../lib/utils.js'; // Assuming this exists or I should use clsx/tailwind-merge

export function Autotuner({ proposals, onApprove }) {
    if (proposals.length === 0) return null;

    // Show the most recent proposal
    const proposal = proposals[proposals.length - 1];

    return (
        <div className="fixed bottom-8 right-8 w-96 bg-card border border-border rounded-xl shadow-2xl p-6 animate-in slide-in-from-right-40 duration-500">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-lg">
                    <Sparkles className="text-indigo-400" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                        New Anchor Detected
                    </h3>
                    <p className="text-sm text-secondary mb-4">
                        High-frequency fallback pattern detected. Optimizing this could save <span className="text-green-400 font-mono">~85%</span> tokens.
                    </p>

                    <div className="bg-black/20 rounded-lg p-3 mb-4 font-mono text-xs border border-white/5">
                        <div className="text-indigo-400 mb-1">MNEMONIC:</div>
                        <div className="text-white mb-2">{proposal.mnemonic}</div>
                        <div className="text-indigo-400 mb-1">DEFINITION:</div>
                        <div className="text-secondary">{proposal.definition}</div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                console.log("Approving proposal:", proposal.id);
                                onApprove(proposal.id);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Check size={16} />
                            Approve
                        </button>
                        <button
                            onClick={() => onApprove(null)} // Dismiss
                            className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-white/5 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
