from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
import logging
import asyncio
import random
from slipcore import slip, decode, think_quantize_transmit, get_default_ucr
from script_data import SCRIPT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("slipstream-control-plane")

app = FastAPI(title="Slipstream Control Plane")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Store for "Dual View" - mapping message IDs to both formats
        self.message_history: List[Dict[str, Any]] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New client connected")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("Client disconnected")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a message to all connected clients."""
        self.message_history.append(message)
        # Keep history manageable
        if len(self.message_history) > 100:
            self.message_history.pop(0)

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"status": "Slipstream Control Plane Active", "version": "1.0.0"}

@app.get("/anchors")
async def get_anchors():
    """Returns the full Universal Concept Registry (UCR)."""
    ucr = get_default_ucr()
    # Serialize UCR anchors to a list of dicts
    return [
        {"mnemonic": m, "definition": a.definition} 
        for m, a in ucr.anchors.items()
    ]

@app.websocket("/ws/hub")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial history
        await websocket.send_json({
            "type": "history_sync",
            "messages": manager.message_history
        })
        
        while True:
            data = await websocket.receive_text()
            # In a real scenario, agents would send messages here.
            # For the control plane, we might receive control commands or
            # relay messages from one agent to another.
            
            # For now, just echo/broadcast what we receive
            try:
                parsed = json.loads(data)
                await manager.broadcast(parsed)
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- Simulation Logic ---

async def generate_traffic():
    """Background task to generate synthetic traffic from the script."""
    
    script_index = 0
    
    while True:
        scenario = SCRIPT[script_index]
        
        # 1. Quantize (or simulate fallback)
        if scenario.get("slip_type") == "fallback":
            # Simulator: Fallback means we couldn't find an anchor, so we sent raw text
            # We simulate this by sending a "Heavy" message (no compression)
            slip_wire = f"[FALLBACK] {scenario['thought']}" 
            anchor_name = "NONE"
            slip_tokens = len(scenario['thought'].split()) # No reduction
        else:
            # Standard Slipstream compression
            slip_wire = think_quantize_transmit(
                scenario["thought"], 
                src=scenario["src"], 
                dst=scenario["dst"]
            )
            decoded = decode(slip_wire)
            anchor_name = decoded.anchor.mnemonic
            slip_tokens = len(slip_wire.split())

        # 2. Calculate Savings
        json_str = json.dumps(scenario["json_equiv"])
        json_tokens = len(json_str) / 4
        
        message_data = {
            "type": "traffic",
            "id": str(random.randint(10000, 99999)),
            "timestamp": "Now",
            "src": scenario["src"],
            "dst": scenario["dst"],
            "thought": scenario["thought"],
            "slip_wire": slip_wire,
            "anchor": anchor_name,
            "json_equiv": json_str,
            "metrics": {
                "json_tokens": float(f"{json_tokens:.1f}"),
                "slip_tokens": slip_tokens,
                "savings_pct": float(f"{(1 - slip_tokens/json_tokens)*100:.1f}") if slip_tokens < json_tokens else 0.0
            },
            "advanced": {
                "latency_ms": random.randint(150, 800) if scenario.get("slip_type") == "fallback" else random.randint(20, 150),
                "status": random.choices(["success", "disagreement", "recovery"], weights=[0.9, 0.05, 0.05])[0],
                "recovery_time_ms": random.randint(1000, 5000)
            }
        }
        
        await manager.broadcast(message_data)
        
        # 3. Autotuner: If fallback, propose a new anchor
        if scenario.get("slip_type") == "fallback" and "proposed_anchor" in scenario:
            await asyncio.sleep(0.5) # Slight delay for dramatic effect
            proposal = {
                "type": "proposal",
                "id": str(random.randint(10000, 99999)),
                "trigger_msg_id": message_data["id"],
                "mnemonic": scenario["proposed_anchor"]["mnemonic"],
                "definition": scenario["proposed_anchor"]["definition"]
            }
            await manager.broadcast(proposal)

        # Loop script
        script_index = (script_index + 1) % len(SCRIPT)
        
        # Wait for the next step
        await asyncio.sleep(scenario.get("delay", 3))

@app.on_event("startup")
async def startup_event():
    # Start the simulation in the background
    asyncio.create_task(generate_traffic())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
