import asyncio
from slipstream_client import SlipstreamClient

async def main():
    print("=== Slipstream Manual Agent CLI ===")
    
    # Configuration
    my_name = input("Enter your Agent Name (default: Operator): ").strip() or "Operator"
    target = input("Enter Target Agent (default: Executor): ").strip() or "Executor"
    
    client = SlipstreamClient(my_name)
    
    try:
        await client.connect()
        
        print(f"\nConnected as '{my_name}'. Sending to '{target}'.")
        print("Type your message below. Type 'exit' to quit.\n")
        
        while True:
            thought = await asyncio.to_thread(input, f"[{my_name}] > ")
            
            if thought.lower() in ["exit", "quit"]:
                break
            
            if not thought.strip():
                continue
                
            # Send (defaults to Slipstream mode)
            await client.send(target, thought)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Disconnected.")

if __name__ == "__main__":
    asyncio.run(main())
