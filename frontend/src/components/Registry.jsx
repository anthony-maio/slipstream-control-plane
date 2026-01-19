import React, { useEffect, useState } from 'react';
import { Search, Database } from 'lucide-react';
import { cn } from '../lib/utils';

export function Registry() {
    const [anchors, setAnchors] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        fetch(`${apiBase}/anchors`)
            .then(res => res.json())
            .then(data => {
                setAnchors(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch anchors:", err);
                setLoading(false);
            });
    }, []);

    const filtered = anchors.filter(a =>
        a.mnemonic.toLowerCase().includes(search.toLowerCase()) ||
        a.definition.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="text-indigo-400" />
                        Anchor Registry
                    </h2>
                    <p className="text-secondary">Global semantic anchors synchronized across the swarm.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Search anchors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-secondary animate-pulse">Loading UCR...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((anchor) => (
                        <div key={anchor.mnemonic} className="p-4 bg-card/50 border border-border rounded-xl hover:bg-card/80 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <code className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded text-sm">
                                    {anchor.mnemonic}
                                </code>
                                <div className="text-[10px] text-secondary border border-border px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    GLOBAL
                                </div>
                            </div>
                            <p className="text-sm text-secondary/80 leading-relaxed">
                                {anchor.definition}
                            </p>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-secondary">
                            No anchors found matching "{search}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
