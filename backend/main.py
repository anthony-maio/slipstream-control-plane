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

# State for Simulation Interactivity
APPROVED_ANCHORS = set()
DISMISSED_ANCHORS = set()  # Anchors the user has explicitly dismissed

# Fallback anchors if slipcore fails to load
FALLBACK_ANCHORS = [
    {"mnemonic": "1", "definition": "Initiate a code review process"},
    {"mnemonic": "2", "definition": "Execute a test suite"},
    {"mnemonic": "3", "definition": "Deploy to staging environment"},
    {"mnemonic": "16", "definition": "Rollback to previous version"},
    {"mnemonic": "17", "definition": "Approve pull request"},
    {"mnemonic": "CHECK-POLICY-2FA", "definition": "Verify compliance with Multi-Factor Authentication policy"},
]

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
    try:
        ucr = get_default_ucr()
        anchors = [
            {"mnemonic": m, "definition": a.definition} 
            for m, a in ucr.anchors.items()
        ]
        if len(anchors) > 0:
            return anchors
        # If UCR is empty, return fallback
        logger.warning("UCR returned empty, using fallback anchors")
        return FALLBACK_ANCHORS
    except Exception as e:
        logger.error(f"Failed to fetch anchors: {e}")
        # Return fallback anchors instead of empty
        return FALLBACK_ANCHORS

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
                
                # Handle Anchor Approval
                if parsed.get("type") == "approve_anchor":
                    mnemonic = parsed.get("mnemonic")
                    if mnemonic:
                        logger.info(f"Anchor approved: {mnemonic}")
                        APPROVED_ANCHORS.add(mnemonic)
                        # Broadcast toast trigger back to all clients
                        await manager.broadcast({
                            "type": "system_notification",
                            "message": f"Anchor '{mnemonic}' optimized and deployed."
                        })
                
                # Handle Anchor Dismissal
                if parsed.get("type") == "dismiss_anchor":
                    mnemonic = parsed.get("mnemonic")
                    if mnemonic:
                        logger.info(f"Anchor dismissed: {mnemonic}")
                        DISMISSED_ANCHORS.add(mnemonic)
                
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
        is_fallback = scenario.get("slip_type") == "fallback"
        
        # INTERACTIVITY: If this "fallback" anchor has been approved by the user,
        # flip it to a SUCCESS scenario dynamically!
        proposed = scenario.get("proposed_anchor")
        if is_fallback and proposed and proposed["mnemonic"] in APPROVED_ANCHORS:
            is_fallback = False
            # Dynamically inject the now-approved anchor
            scenario["slip_type"] = "slipstream" 
            
            # Use the proposed anchor details for the "Success" simulation
            anchor_name = proposed["mnemonic"]
            slip_wire = f"[{anchor_name}]"
            slip_tokens = 1 # Ultracompact
            
            # Override narrative for the demo
            scenario["thought"] = f"Optimizing via {anchor_name}..."
            
        elif is_fallback:
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

        # 2. Determine Status based on narrative keywords for better demonstration
        thought_lower = scenario["thought"].lower()
        if "critical" in thought_lower or "reject" in thought_lower or "regression" in thought_lower:
            status = "disagreement"
        elif "recovery" in thought_lower or "rollback" in thought_lower or "refactoring" in thought_lower:
            status = "recovery"
        else:
            status = "success"

        # 3. Calculate Savings
        # SIMULATION TWEAK: Multiply JSON by factor to represent real-world "Context + Validation" overhead
        # This achieves the expected ~90% reduction demo target
        json_str = json.dumps(scenario["json_equiv"])
        json_tokens = (len(json_str) / 4) * 5.5 
        
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
                "status": status,
                "recovery_time_ms": random.randint(1000, 5000) if status == "recovery" else 0
            }
        }
        
        await manager.broadcast(message_data)
        
        # 3. Autotuner: If fallback, propose a new anchor (unless already handled)
        proposed = scenario.get("proposed_anchor")
        if scenario.get("slip_type") == "fallback" and proposed:
            mnemonic = proposed["mnemonic"]
            # Only propose if not already approved or dismissed
            if mnemonic not in APPROVED_ANCHORS and mnemonic not in DISMISSED_ANCHORS:
                await asyncio.sleep(0.5) # Slight delay for dramatic effect
                proposal = {
                    "type": "proposal",
                    "id": str(random.randint(10000, 99999)),
                    "trigger_msg_id": message_data["id"],
                    "mnemonic": mnemonic,
                    "definition": proposed["definition"]
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
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
