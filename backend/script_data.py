
# Realistic script data for the simulation
# Scenario: "The Memory Leak Saga"
# QA detects a leak -> Planner investigates -> Executor fixes (flawed) -> QA Rejects -> Huddle -> Fix.

SCRIPT = [
    # --- PHASE 1: DETECTION (QA & Planner) ---
    {"src": "QA", "dst": "Planner", "thought": "Alert: Production heap usage spiked to 92% after the last deployment.", "json_equiv": {"type": "alert", "metric": "heap", "val": "92%"}, "delay": 2},
    {"src": "Planner", "dst": "QA", "thought": "Acknowledged. Isolate the affected service.", "json_equiv": {"type": "ack", "action": "isolate"}, "delay": 1},
    {"src": "QA", "dst": "Planner", "thought": "Service 'TradeMatcher' isolated. Traffic rerouted.", "json_equiv": {"type": "inform", "status": "isolated"}, "delay": 2},
    
    # --- PHASE 2: INVESTIGATION (Planner & Executor) ---
    {"src": "Planner", "dst": "Executor", "thought": "Investigate 'TradeMatcher' logs for memory leaks.", "json_equiv": {"type": "task", "target": "TradeMatcher", "goal": "find_leak"}, "delay": 2},
    {"src": "Executor", "dst": "Backend", "thought": "Fetching last hour of logs for TradeMatcher.", "json_equiv": {"type": "query", "source": "logs", "duration": "1h"}, "delay": 1},
    {"src": "Backend", "dst": "Executor", "thought": "Logs retrieved. 450MB of data ready.", "json_equiv": {"type": "response", "size": "450MB"}, "delay": 2},
    
    # FALLBACK: "Flame Graph" is a new concept for the swarm
    {
        "src": "Executor", "dst": "Planner", 
        "thought": "Logs are inconclusive. I need to generate a Flame Graph to visualize the stack trace depth.",
        "json_equiv": {"type": "request", "tool": "flame_graph", "reason": "stack_depth"},
        "slip_type": "fallback",
        "proposed_anchor": {"mnemonic": "GEN-FLAME-GRAPH", "definition": "Generate a visualization of the stack trace to identify resource consumption hotspots."},
        "delay": 3
    },
    
    {"src": "Planner", "dst": "Executor", "thought": "Approved. Generate Flame Graph.", "json_equiv": {"type": "approve", "action": "flame_graph"}, "delay": 1},
    
    # --- PHASE 3: THE BAD FIX (Executor & Backend) ---
    {"src": "Executor", "dst": "Backend", "thought": "Found it. The 'OrderHistory' cache is not clearing. Implementing a TTL eviction policy.", "json_equiv": {"type": "plan", "fix": "TTL_eviction", "target": "OrderHistory"}, "delay": 5},
    {"src": "Backend", "dst": "Executor", "thought": "Applying TTL patch...", "json_equiv": {"type": "status", "action": "patching"}, "delay": 1},
    {"src": "Executor", "dst": "QA", "thought": "Patch applied. Please verify.", "json_equiv": {"type": "request_qa", "build": "v2.4.1-patch"}, "delay": 2},
    
    # --- PHASE 4: DISAGREEMENT / CRISIS (QA rejects) ---
    {"src": "QA", "dst": "Executor", "thought": "CRITICAL: The patch caused a regression. Order matching latency increased by 400ms.", "json_equiv": {"type": "reject", "reason": "latency_regression", "delta": "+400ms"}, "slip_type": "fallback", "delay": 1},
    
    # Disagreement loop (Simulated "Huddle")
    {"src": "Planner", "dst": "Executor", "thought": "Rollback immediately!", "json_equiv": {"type": "command", "action": "rollback"}, "delay": 0.5},
    {"src": "Executor", "dst": "Backend", "thought": "Rolling back to v2.4.0...", "json_equiv": {"type": "exec", "cmd": "rollback"}, "delay": 0.5},
    {"src": "Backend", "dst": "Executor", "thought": "Rollback complete.", "json_equiv": {"type": "status", "val": "done"}, "delay": 0.5},
    
    {"src": "Planner", "dst": "Executor", "thought": "The TTL check is too expensive on the hot path. Move it to a background worker.", "json_equiv": {"type": "correction", "strategy": "async_worker"}, "delay": 2},
    {"src": "Executor", "dst": "Planner", "thought": "Agreed. Calculating thread pool requirements for async worker.", "json_equiv": {"type": "calc", "target": "thread_pool"}, "delay": 1},
    
    # --- PHASE 5: THE GOOD FIX ---
    {"src": "Executor", "dst": "Backend", "thought": "Refactoring: Extracted cache cleanup to 'CleanupWorker' class.", "json_equiv": {"type": "refactor", "file": "cleanup.worker.ts"}, "delay": 3},
    {"src": "Backend", "dst": "Executor", "thought": "Unit tests passed. Deploying to Staging.", "json_equiv": {"type": "deploy", "env": "staging"}, "delay": 2},
    {"src": "Executor", "dst": "QA", "thought": "New fix deployed (Async Worker). Verify.", "json_equiv": {"type": "request_qa", "build": "v2.4.2-patch"}, "delay": 1},
    
    {"src": "QA", "dst": "Executor", "thought": "Verifying... Heap usage stable. Latency normal.", "json_equiv": {"type": "test_results", "status": "pass"}, "delay": 2},
    {"src": "Planner", "dst": "All", "thought": "Great job. Promoting to Production.", "json_equiv": {"type": "promote", "env": "prod"}, "delay": 2},
    
    # --- PHASE 6: POST-MORTEM (Chatter) ---
    {"src": "Frontend", "dst": "Planner", "thought": "Do we need to update the status page?", "json_equiv": {"type": "query", "topic": "status_page"}, "delay": 2},
    {"src": "Planner", "dst": "Frontend", "thought": "Yes, update incident #404 to 'Resolved'.", "json_equiv": {"type": "cmd", "action": "update_incident"}, "delay": 1},
    {"src": "Backend", "dst": "Planner", "thought": "Sending telemetry for the incident period.", "json_equiv": {"type": "stats", "data": "telemetry"}, "delay": 2},
    
    # Loop back to normal chatter
    {"src": "Planner", "dst": "Executor", "thought": "Let's resume the roadmap tasks.", "json_equiv": {"type": "resume"}, "delay": 3}
]
