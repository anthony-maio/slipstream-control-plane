import asyncio
import json
import random
import websockets
import logging
from typing import Optional, Dict, Any, Callable
from slipcore import think_quantize_transmit, decode

# Configure logger
logger = logging.getLogger("SlipstreamClient")
logging.basicConfig(level=logging.INFO)

class SlipstreamClient:
    def __init__(self, agent_name: str, hub_url: str = "ws://localhost:8000/ws/hub"):
        self.agent_name = agent_name
        self.hub_url = hub_url
        self.websocket = None
        self._on_message_callback = None

    async def connect(self):
        """Establishes connection to the Control Plane."""
        logger.info(f"Connecting to {self.hub_url} as {self.agent_name}...")
        try:
            self.websocket = await websockets.connect(self.hub_url)
            logger.info("Connected!")
            
            # Start listening in background
            asyncio.create_task(self._listen_loop())
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            raise

    async def _listen_loop(self):
        try:
            async for message in self.websocket:
                data = json.loads(message)
                if self._on_message_callback:
                    self._on_message_callback(data)
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Connection closed.")

    def on_message(self, callback: Callable[[Dict], None]):
        """Register a callback for incoming messages."""
        self._on_message_callback = callback

    async def send(self, dst: str, thought: str, mode: str = "slipstream"):
        """
        Sends a message to another agent.
        
        Args:
            dst: Destination agent name.
            thought: The full natural language thought/instruction.
            mode: 'slipstream' (quantized) or 'json' (fallback/verbose).
        """
        if not self.websocket:
            raise RuntimeError("Not connected. Call await connect() first.")

        # 1. Quantize (Simulated logic similar to main.py generator)
        if mode == "slipstream":
            try:
                slip_wire = think_quantize_transmit(thought, src=self.agent_name, dst=dst)
                decoded = decode(slip_wire)
                anchor_name = decoded.anchor.mnemonic
                slip_tokens = len(slip_wire.split())
            except Exception:
                # Fallback if quantization fails (e.g., no matching anchor)
                mode = "fallback"
        
        if mode != "slipstream":
            # Fallback/JSON mode
            slip_wire = f"[FALLBACK] {thought}"
            anchor_name = "NONE"
            slip_tokens = len(thought.split())

        # 2. Calculate Metrics
        # Create a dummy JSON equiv for comparison
        json_equiv = {
            "from": self.agent_name, 
            "to": dst, 
            "content": thought, 
            "timestamp": "now"
        }
        json_str = json.dumps(json_equiv)
        json_tokens = len(json_str) / 4 # Rough approx
        
        # 3. Construct Payload
        payload = {
            "type": "traffic",
            "id": str(random.randint(100000, 999999)),
            "timestamp": "Now",
            "src": self.agent_name,
            "dst": dst,
            "thought": thought,
            "slip_wire": slip_wire,
            "anchor": anchor_name,
            "json_equiv": json_str,
            "metrics": {
                "json_tokens": float(f"{json_tokens:.1f}"),
                "slip_tokens": slip_tokens,
                "savings_pct": float(f"{(1 - slip_tokens/json_tokens)*100:.1f}") if slip_tokens < json_tokens else 0.0
            },
            "advanced": {
                "latency_ms": random.randint(20, 150) if mode == "slipstream" else random.randint(200, 800),
                "status": "success",
                "recovery_time_ms": 0
            }
        }

        # 4. Transmit
        await self.websocket.send(json.dumps(payload))
        logger.info(f"Sent: {anchor_name} -> {dst}")
