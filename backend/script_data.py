
# Realistic script data for the simulation
# Scenario: "The Memory Leak Saga"
# QA detects a leak -> Planner investigates -> Executor fixes (flawed) -> QA Rejects -> Huddle -> Fix.

SCRIPT = [
    # --- PHASE 1: CODE REVIEW START ---
    {"src": "Planner", "dst": "Executor", "thought": "Review PR #892: 'Feature: User Roles'. Check for security vulnerabilities.", "json_equiv": {"type": "review_request", "pr": 892, "focus": "security"}, "delay": 2},
    {"src": "Executor", "dst": "Backend", "thought": "Fetching diff for PR #892...", "json_equiv": {"type": "git_fetch", "ref": "refs/pull/892/head"}, "delay": 1},
    {"src": "Backend", "dst": "Executor", "thought": "Diff retrieved. +150 lines, -20 lines.", "json_equiv": {"type": "git_response", "changes": 170}, "delay": 2},

    # --- PHASE 2: STATIC ANALYSIS ---
    {"src": "Executor", "dst": "QA", "thought": "Running static analysis checks on the new role validation logic.", "json_equiv": {"type": "lint", "target": "auth/roles.ts"}, "delay": 2},
    {"src": "QA", "dst": "Executor", "thought": "Green. No lint errors found. Style is compliant.", "json_equiv": {"type": "lint_result", "status": "passed"}, "delay": 1},

    # FALLBACK: A common, realistic fallback (missing specific context)
    {
        "src": "Executor", "dst": "Planner", 
        "thought": "I need clarification on the 'SuperAdmin' permission set. Is it allowed to bypass 2FA?",
        "json_equiv": {"type": "inquiry", "topic": "permissions", "question": "2fa_bypass"},
        "slip_type": "fallback",
        "proposed_anchor": {"mnemonic": "CHECK-POLICY-2FA", "definition": "Verify compliance with the Multi-Factor Authentication security policy for high-privilege accounts."},
        "delay": 4
    },
    
    {"src": "Planner", "dst": "Executor", "thought": "No. SuperAdmin must enforce 2FA. Re-check the verification middleware.", "json_equiv": {"type": "policy_ruling", "allow_bypass": False}, "delay": 2},

    # --- PHASE 3: IMPLEMENTATION (Executor) ---
    {"src": "Executor", "dst": "Backend", "thought": "The middleware allows bypass if 'debug_mode' is true. This is unsafe for production.", "json_equiv": {"type": "vuln_report", "severity": "high", "cwe": "CWE-489"}, "delay": 3},
    {"src": "Backend", "dst": "Executor", "thought": "Confirmed. Debug flag presence detected in prod config.", "json_equiv": {"type": "config_audit", "flag_found": True}, "delay": 1},
    
    # --- PHASE 4: REFACTORING ---
    {"src": "Executor", "dst": "Planner", "thought": "Refactoring to strip debug conditionals from the build output.", "json_equiv": {"type": "refactor_plan", "approach": "build_time_strip"}, "delay": 2},
    {"src": "Planner", "dst": "Executor", "thought": "Approved. Proceed with the build configuration change.", "json_equiv": {"type": "approve_plan"}, "delay": 1},
    {"src": "Executor", "dst": "Backend", "thought": "Updating webpack config to remove dead code...", "json_equiv": {"type": "git_commit", "msg": "fix: strip debug code"}, "delay": 3},

    # --- PHASE 5: VERIFICATION ---
    {"src": "QA", "dst": "Executor", "thought": "Running regression suite on Authentication module.", "json_equiv": {"type": "test_run", "suite": "auth"}, "delay": 2},
    {"src": "Backend", "dst": "QA", "thought": "All tests passed. Coverage: 94%.", "json_equiv": {"type": "test_result", "passed": 45, "failed": 0}, "delay": 2},
    {"src": "Planner", "dst": "All", "thought": "PR #892 is secure. Merging to main.", "json_equiv": {"type": "merge", "pr": 892}, "delay": 2},
    
    # Loop back
    {"src": "Frontend", "dst": "Planner", "thought": "Dashboard updated. New roles are visible.", "json_equiv": {"type": "ui_update", "component": "UserTable"}, "delay": 3}
]
