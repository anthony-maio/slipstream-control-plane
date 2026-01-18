# Slipstream Integration Guide

This guide explains how to connect your own agents (Python scripts, swarms, etc.) to the Slipstream Control Plane.

## Prerequisites
- Python 3.10+
- `pip install websockets slipcore`

## Using the SDK (`slipstream_client.py`)

The `SlipstreamClient` class handles the WebSocket connection and protocol formatting.

```python
import asyncio
from slipstream_client import SlipstreamClient

async def run_agent():
    # 1. Initialize
    client = SlipstreamClient(agent_name="MyCustomAgent")
    
    # 2. Connect
    await client.connect()
    
    # 3. Send a message
    # The client automatically tries to find a Slipstream anchor.
    await client.send(
        dst="Planner", 
        thought="The database is experiencing high latency."
    )
    
    # Keep alive
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(run_agent())
```

## Manual Testing
Run the CLI tool to manually inject traffic:

```bash
python manual_agent.py
```
1. Enter your name (e.g., `Human`).
2. Enter target (e.g., `Planner`).
3. Type messages. Watch them appear on the dashboard!
