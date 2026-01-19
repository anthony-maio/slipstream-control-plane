from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
import logging
import asyncio
import random
import os

# Try to import slipcore as fallback, but prefer Gemini
try:
    from slipcore import slip, decode, think_quantize_transmit, get_default_ucr
    SLIPCORE_AVAILABLE = True
except ImportError:
    SLIPCORE_AVAILABLE = False
    logger_init = logging.getLogger("slipstream-control-plane")
    logger_init.warning("slipcore not available - using Gemini-only mode")

from script_data import SCRIPT
from gemini_quantizer import quantize_with_gemini, suggest_new_anchor, ANCHOR_REGISTRY

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("slipstream-control-plane")

# State for Simulation Interactivity
APPROVED_ANCHORS = set()
DISMISSED_ANCHORS = set()  # Anchors the user has explicitly dismissed

# Real UCR anchors from slipcore (fallback if slipcore fails to load on Railway)
FALLBACK_ANCHORS = [
    # Observations
    {"mnemonic": "ObserveState", "definition": "Report current system or environment state"},
    {"mnemonic": "ObserveChange", "definition": "Report a detected change"},
    {"mnemonic": "ObserveError", "definition": "Report an observed error condition"},
    # Information
    {"mnemonic": "InformResult", "definition": "Share a computed or derived result"},
    {"mnemonic": "InformStatus", "definition": "Provide status update"},
    {"mnemonic": "InformComplete", "definition": "Report task completion"},
    {"mnemonic": "InformBlocked", "definition": "Report being blocked on something"},
    {"mnemonic": "InformProgress", "definition": "Share progress update"},
    # Questions
    {"mnemonic": "AskClarify", "definition": "Request clarification on requirements"},
    {"mnemonic": "AskStatus", "definition": "Query current status"},
    {"mnemonic": "AskPermission", "definition": "Request permission to proceed"},
    {"mnemonic": "AskResource", "definition": "Query resource availability"},
    # Requests
    {"mnemonic": "RequestTask", "definition": "Request execution of a task"},
    {"mnemonic": "RequestPlan", "definition": "Request creation of a plan"},
    {"mnemonic": "RequestReview", "definition": "Request review of work"},
    {"mnemonic": "RequestHelp", "definition": "Request assistance"},
    {"mnemonic": "RequestCancel", "definition": "Request cancellation"},
    {"mnemonic": "RequestPriority", "definition": "Request priority change"},
    {"mnemonic": "RequestResource", "definition": "Request allocation of resource"},
    # Proposals
    {"mnemonic": "ProposePlan", "definition": "Propose a plan for consideration"},
    {"mnemonic": "ProposeChange", "definition": "Propose a modification"},
    {"mnemonic": "ProposeAlternative", "definition": "Propose an alternative approach"},
    {"mnemonic": "ProposeRollback", "definition": "Propose reverting changes"},
    # Commitments
    {"mnemonic": "CommitTask", "definition": "Commit to performing a task"},
    {"mnemonic": "CommitDeadline", "definition": "Commit to a deadline"},
    {"mnemonic": "CommitResource", "definition": "Commit resources"},
    # Evaluations
    {"mnemonic": "EvalApprove", "definition": "Evaluation: approved/positive"},
    {"mnemonic": "EvalReject", "definition": "Evaluation: rejected/negative"},
    {"mnemonic": "EvalNeedsWork", "definition": "Evaluation: needs revision"},
    {"mnemonic": "EvalComplete", "definition": "Evaluation: work is complete"},
    {"mnemonic": "EvalBlocked", "definition": "Evaluation: blocked by issue"},
    # Meta/Control
    {"mnemonic": "MetaAck", "definition": "Acknowledge receipt"},
    {"mnemonic": "MetaSync", "definition": "Synchronization ping"},
    {"mnemonic": "MetaHandoff", "definition": "Hand off responsibility"},
    {"mnemonic": "MetaEscalate", "definition": "Escalate to higher authority"},
    {"mnemonic": "MetaAbort", "definition": "Abort current operation"},
    # Accept/Reject
    {"mnemonic": "Accept", "definition": "Accept a proposal or request"},
    {"mnemonic": "Reject", "definition": "Reject a proposal or request"},
    {"mnemonic": "AcceptWithCondition", "definition": "Conditional acceptance"},
    {"mnemonic": "Defer", "definition": "Defer decision"},
    # Errors
    {"mnemonic": "ErrorGeneric", "definition": "Generic error occurred"},
    {"mnemonic": "ErrorTimeout", "definition": "Operation timed out"},
    {"mnemonic": "ErrorResource", "definition": "Resource unavailable"},
    {"mnemonic": "ErrorPermission", "definition": "Permission denied"},
    {"mnemonic": "ErrorValidation", "definition": "Validation failed"},
    # Fallback
    {"mnemonic": "Fallback", "definition": "Unquantizable - see payload for natural language"},
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
    """Background task to generate synthetic traffic from the script.

    Uses Gemini API for intelligent semantic quantization when available.
    Falls back to slipcore or hardcoded anchors otherwise.
    """

    script_index = 0
    use_gemini = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if use_gemini:
        logger.info("Gemini API key found - using AI-powered semantic quantization")
    else:
        logger.warning("No Gemini API key - using fallback quantization")

    while True:
        scenario = SCRIPT[script_index].copy()  # Copy to avoid mutating original
        thought = scenario["thought"]
        src = scenario["src"]
        dst = scenario["dst"]

        # Default values
        anchor_name = "Fallback"
        slip_wire = thought
        slip_tokens = len(thought.split())
        gemini_reasoning = None

        # Check if this is a pre-marked fallback scenario
        is_fallback = scenario.get("slip_type") == "fallback"

        # INTERACTIVITY: If this "fallback" anchor has been approved by the user,
        # flip it to a SUCCESS scenario dynamically!
        proposed = scenario.get("proposed_anchor")
        if is_fallback and proposed and proposed["mnemonic"] in APPROVED_ANCHORS:
            is_fallback = False
            anchor_name = proposed["mnemonic"]
            slip_wire = f"{anchor_name}(approved:true)"
            slip_tokens = 2
            gemini_reasoning = f"User-approved anchor for this pattern"

        # Try Gemini quantization for non-fallback scenarios
        elif use_gemini and not is_fallback:
            try:
                result = await quantize_with_gemini(thought, src, dst)
                if result:
                    anchor_name = result.get("anchor", "Fallback")
                    slip_wire = result.get("wire", thought)
                    slip_tokens = result.get("compressed_tokens", len(thought.split()))
                    gemini_reasoning = result.get("reasoning", "")
                    logger.info(f"Gemini: {thought[:40]}... -> {anchor_name}")
                else:
                    # Gemini returned None, use fallback
                    is_fallback = True
            except Exception as e:
                logger.error(f"Gemini quantization error: {e}")
                is_fallback = True

        # Fallback: use slipcore if available, otherwise mark as unquantized
        if is_fallback or (not use_gemini and not is_fallback):
            if SLIPCORE_AVAILABLE and not is_fallback:
                try:
                    slip_wire = think_quantize_transmit(thought, src=src, dst=dst)
                    decoded = decode(slip_wire)
                    anchor_name = decoded.anchor.mnemonic
                    slip_tokens = len(slip_wire.split())
                except Exception as e:
                    logger.error(f"Slipcore error: {e}")
                    is_fallback = True

            if is_fallback:
                slip_wire = f"[FALLBACK] {thought}"
                anchor_name = "NONE"
                slip_tokens = len(thought.split())

        # Determine Status based on narrative keywords
        thought_lower = thought.lower()
        if "critical" in thought_lower or "reject" in thought_lower or "fail" in thought_lower:
            status = "disagreement"
        elif "recovery" in thought_lower or "rollback" in thought_lower or "refactoring" in thought_lower:
            status = "recovery"
        else:
            status = "success"

        # Calculate Savings
        json_str = json.dumps(scenario["json_equiv"])
        # More realistic token estimation
        json_tokens = len(json_str.split()) + len(json_str) // 4

        message_data = {
            "type": "traffic",
            "id": str(random.randint(10000, 99999)),
            "timestamp": "Now",
            "src": src,
            "dst": dst,
            "thought": thought,
            "slip_wire": slip_wire,
            "anchor": anchor_name,
            "json_equiv": json_str,
            "gemini_reasoning": gemini_reasoning,  # NEW: Show why this anchor was chosen
            "metrics": {
                "json_tokens": float(f"{json_tokens:.1f}"),
                "slip_tokens": slip_tokens,
                "savings_pct": float(f"{(1 - slip_tokens/max(json_tokens, 1))*100:.1f}") if slip_tokens < json_tokens else 0.0
            },
            "advanced": {
                "latency_ms": random.randint(150, 800) if is_fallback else random.randint(20, 150),
                "status": status,
                "recovery_time_ms": random.randint(1000, 5000) if status == "recovery" else 0
            }
        }

        await manager.broadcast(message_data)

        # Autotuner: For fallback scenarios, use Gemini to suggest a new anchor
        if is_fallback and use_gemini:
            # Only propose if not already approved or dismissed
            existing_proposed = scenario.get("proposed_anchor", {}).get("mnemonic")
            if not existing_proposed or (existing_proposed not in APPROVED_ANCHORS and existing_proposed not in DISMISSED_ANCHORS):
                await asyncio.sleep(0.5)

                # Use Gemini to suggest a new anchor
                try:
                    suggestion = await suggest_new_anchor(thought, ANCHOR_REGISTRY)
                    if suggestion:
                        proposal = {
                            "type": "proposal",
                            "id": str(random.randint(10000, 99999)),
                            "trigger_msg_id": message_data["id"],
                            "mnemonic": suggestion.get("mnemonic", "NEW-ANCHOR"),
                            "definition": suggestion.get("definition", "AI-suggested anchor"),
                            "category": suggestion.get("category", "unknown"),
                            "ai_generated": True
                        }
                        await manager.broadcast(proposal)
                except Exception as e:
                    logger.error(f"Gemini anchor suggestion error: {e}")

        # Also handle hardcoded proposed anchors for backwards compatibility
        elif is_fallback and proposed:
            mnemonic = proposed["mnemonic"]
            if mnemonic not in APPROVED_ANCHORS and mnemonic not in DISMISSED_ANCHORS:
                await asyncio.sleep(0.5)
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
