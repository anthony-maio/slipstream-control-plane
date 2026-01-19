import React from 'react';
import { BookOpen, Github, Database, FileText, Globe, Box, Cpu, Layers } from 'lucide-react';
import { cn } from '../lib/utils.js';

export function Resources() {
    const resources = [
        {
            title: "Research Paper",
            description: "Read the formal definition of the Slipstream Protocol and the mathematics behind the Semantic Manifold.",
            icon: FileText,
            color: "text-red-400",
            link: "https://zenodo.org/records/18115418",
            meta: "DOI: 10/5281/zenodo.18115418"
        },
        {
            title: "SlipCore Library",
            description: "The official open-source Python implementation. Drop-in compatible with standard LLM agent frameworks.",
            icon: Github,
            color: "text-white",
            link: "https://www.github.com/anthony-maio/slipcore",
            meta: "GitHub"
        },
        {
            title: "Hugging Face Collection",
            description: "Access all finetuned models (GGUF, 4-bit, 8-bit) optimized for Slipstream communication.",
            icon: Box,
            color: "text-yellow-400",
            link: "https://huggingface.co/collections/anthonym21/streamlined-inter-agent-protocol-slipstream",
            meta: "Models"
        },
        {
            title: "Governance Demo",
            description: "Interactive OpenEnv demo showcasing Slipstream RLHF (GRPO) for safe agent coordination.",
            icon: Globe,
            color: "text-blue-400",
            link: "https://huggingface.co/spaces/anthonym21/slipstream-governance-openenv",
            meta: "Live Demo"
        },
        {
            title: "Training Dataset",
            description: "The 'Think-Quantize-Transmit' dataset used to train the Z1-9B models.",
            icon: Database,
            color: "text-cyan-400",
            link: "https://huggingface.co/datasets/anthonym21/slipstream-tqt",
            meta: "Hugging Face"
        },
        {
            title: "Kaggle Dataset",
            description: "Alternative mirror of the training data and benchmarks.",
            icon: Database,
            color: "text-sky-400",
            link: "https://www.kaggle.com/datasets/anthonymaio/slipstream-think-quantize-transmit-dataset",
            meta: "Kaggle"
        },
        {
            title: "Blog Post",
            description: "Deep dive into the architecture and motivation behind Slipstream.",
            icon: BookOpen,
            color: "text-green-400",
            link: "https://huggingface.co/blog/anthonym21/slipstream-for-agent-communication",
            meta: "Article"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">

            {/* Intro Section */}
            <div className="bg-card/30 border border-border rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Layers size={200} />
                </div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Cpu className="text-primary" />
                    What is Slipstream?
                </h2>
                <div className="space-y-4 text-secondary leading-relaxed max-w-3xl">
                    <p>
                        <strong className="text-foreground">Slipstream</strong> is a semantic quantization protocol designed to solve the bandwidth bottleneck in multi-agent systems.
                    </p>
                    <p>
                        Instead of exchanging verbose natural language (English), agents trained on the
                        <span className="text-indigo-400 font-mono text-xs mx-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">Think-Quantize-Transmit</span>
                        paradigm map their intents to a shared high-dimensional manifold (The UCR).
                        They transmit concise "Anchors"—atomic tokens that represent complex thoughts—reducing token usage by up to <strong>92%</strong> while maintaining semantic fidelity.
                    </p>
                    <p>
                        This Control Plane allows you to observe this "telepathy" in real-time, monitor expected vs. actual behavior (Disagreement Rate), and intervene when the protocol drifts.
                    </p>
                </div>
            </div>

            {/* Links Grid */}
            <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Globe className="text-indigo-400" size={20} />
                    Resources & Downloads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((item, i) => (
                        <a
                            key={i}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-card border border-border rounded-xl p-5 hover:bg-card/80 hover:border-primary/50 transition-all duration-300 group flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={cn("p-2 rounded-lg bg-background border border-border group-hover:scale-110 transition-transform duration-300", item.color)}>
                                    <item.icon size={20} />
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-secondary border border-border px-2 py-1 rounded-full">
                                    {item.meta}
                                </span>
                            </div>
                            <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-sm text-secondary leading-normal flex-grow">
                                {item.description}
                            </p>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
