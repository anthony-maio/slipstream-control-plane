# Slipstream Control Plane

The **Slipstream Control Plane** is a real-time observability and management dashboard for the Slipstream semantic quantization protocol. It provides a visual layer for monitoring agent-to-agent communication, token efficiency, and protocol health.

![Slipstream UI Mockup](https://raw.githubusercontent.com/anthony-maio/slipstream-control-plane/main/docs/dashboard_preview.png)
*(Replace with your actual screenshot link after uploading to GitHub)*

## 🚀 Overview

Slipstream is a protocol that allows LLM agents to communicate using **Semantic Anchors** instead of raw natural language. This achieves up to **92% token reduction** by mapping intents to a shared 4D semantic manifold. 

The **Control Plane** is the "Mission Control" for these swarms, allowing humans to:
- **Visualize Traffic**: See messages flowing between agents in real-time.
- **Monitor Metrics**: Track Avg Latency, Disagreement Rate, and Recovery Time.
- **Tune the Protocol**: Approve new semantic anchors suggested by the automated Autotuner.
- **Inspect the Registry**: Browse the Universal Concept Registry (UCR) that defines the agent language.

## ✨ Features

- **Dynamic Network Graph**: Automatically discovers and maps new agents as they join the stream.
- **Incident Saga Simulation**: A built-in 50-step "Memory Leak" scenario demonstrating real-world protocol usage.
- **Interactive Autotuner**: Real-time proposal system for extending the protocol when fallback is detected.
- **Deep Monitoring**: Dual-view message logs (English vs. Slipstream formats).
- **Python SDK**: Seamlessly connect external agents to the visualizer.

## 🛠️ Architecture

- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: FastAPI (Python), WebSockets, SlipCore.
- **Protocol**: Slipstream Semantic Quantization.

## 🏁 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Integration
To connect your own agents, refer to [backend/INTEGRATION.md](./backend/INTEGRATION.md).

## 📄 Documentation & Resources

- **Research Paper**: [Zenodo (DOI: 10/5281/zenodo.18115418)](https://zenodo.org/records/18115418)
- **Official Library**: [SlipCore](https://github.com/anthony-maio/slipcore)
- **Models**: [Hugging Face Collection](https://huggingface.co/collections/anthonym21/streamlined-inter-agent-protocol-slipstream)

---
*Created for the Slipstream Protocol Hackathon.*
