# Slipstream Frontend

This is the React-based dashboard for the Slipstream Control Plane.

## 🚀 Key Technologies
- **Vite**: Ultra-fast frontend tooling.
- **Tailwind CSS**: Modern styling and utility-first design.
- **Framer Motion**: Fluid UI animations and the Network Graph's particle physics.
- **Lucide Icons**: Consistent, beautiful iconography.
- **WebSockets**: Real-time traffic bridging to the Control Plane Hub.

## ⚙️ Feature Components
- `NetworkGraph.jsx`: Dynamic SVG-based mesh visualization.
- `Metrics.jsx`: Aggregate KPI dashboard (Token Savings, Latency, etc.).
- `Registry.jsx`: Interactive table for the Universal Concept Registry.
- `Autotuner.jsx`: Proposal and approval system for semantic anchors.

## 🛠️ Development
```bash
npm install
npm run dev
```

## 🌐 Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE` | Backend REST API URL | `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket Hub URL | `ws://localhost:8000/ws/hub` |
