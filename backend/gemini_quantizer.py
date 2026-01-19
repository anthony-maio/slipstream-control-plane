"""
Gemini-powered Semantic Quantization for Slipstream Protocol

Uses Google's Gemini API to intelligently compress verbose agent messages
into semantic anchors with compact wire formats.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("slipstream-gemini")

# Gemini client - initialized lazily
_gemini_model = None

def get_gemini_model():
    """Lazily initialize and return the Gemini model."""
    global _gemini_model
    if _gemini_model is None:
        try:
            import google.generativeai as genai

            api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                logger.warning("No GEMINI_API_KEY found - Gemini quantization disabled")
                return None

            genai.configure(api_key=api_key)
            _gemini_model = genai.GenerativeModel(
                model_name="gemini-3.0-flash",
                generation_config={
                    "temperature": 0.1,  # Low temp for consistent, deterministic outputs
                    "top_p": 0.95,
                    "max_output_tokens": 512,
                }
            )
            logger.info("Gemini model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            return None
    return _gemini_model


# The semantic anchor registry - these are the "compression targets"
ANCHOR_REGISTRY = [
    # Observations
    {"mnemonic": "ObserveState", "definition": "Report current system or environment state", "category": "observe"},
    {"mnemonic": "ObserveChange", "definition": "Report a detected change", "category": "observe"},
    {"mnemonic": "ObserveError", "definition": "Report an observed error condition", "category": "observe"},
    # Information
    {"mnemonic": "InformResult", "definition": "Share a computed or derived result", "category": "inform"},
    {"mnemonic": "InformStatus", "definition": "Provide status update", "category": "inform"},
    {"mnemonic": "InformComplete", "definition": "Report task completion", "category": "inform"},
    {"mnemonic": "InformBlocked", "definition": "Report being blocked on something", "category": "inform"},
    {"mnemonic": "InformProgress", "definition": "Share progress update", "category": "inform"},
    # Questions
    {"mnemonic": "AskClarify", "definition": "Request clarification on requirements", "category": "ask"},
    {"mnemonic": "AskStatus", "definition": "Query current status", "category": "ask"},
    {"mnemonic": "AskPermission", "definition": "Request permission to proceed", "category": "ask"},
    {"mnemonic": "AskResource", "definition": "Query resource availability", "category": "ask"},
    # Requests
    {"mnemonic": "RequestTask", "definition": "Request execution of a task", "category": "request"},
    {"mnemonic": "RequestReview", "definition": "Request review of work", "category": "request"},
    {"mnemonic": "RequestHelp", "definition": "Request assistance", "category": "request"},
    {"mnemonic": "RequestData", "definition": "Request data or information retrieval", "category": "request"},
    # Proposals
    {"mnemonic": "ProposePlan", "definition": "Propose a plan for consideration", "category": "propose"},
    {"mnemonic": "ProposeChange", "definition": "Propose a modification", "category": "propose"},
    {"mnemonic": "ProposeFix", "definition": "Propose a fix or solution", "category": "propose"},
    # Commitments
    {"mnemonic": "CommitTask", "definition": "Commit to performing a task", "category": "commit"},
    {"mnemonic": "CommitPlan", "definition": "Commit to executing a plan", "category": "commit"},
    # Evaluations
    {"mnemonic": "EvalApprove", "definition": "Evaluation: approved/positive", "category": "eval"},
    {"mnemonic": "EvalReject", "definition": "Evaluation: rejected/negative", "category": "eval"},
    {"mnemonic": "EvalPass", "definition": "Evaluation: tests/checks passed", "category": "eval"},
    {"mnemonic": "EvalFail", "definition": "Evaluation: tests/checks failed", "category": "eval"},
    # Actions
    {"mnemonic": "ActionExecute", "definition": "Execute a command or operation", "category": "action"},
    {"mnemonic": "ActionFetch", "definition": "Fetch or retrieve data", "category": "action"},
    {"mnemonic": "ActionUpdate", "definition": "Update or modify something", "category": "action"},
    {"mnemonic": "ActionMerge", "definition": "Merge changes or branches", "category": "action"},
    # Meta
    {"mnemonic": "MetaAck", "definition": "Acknowledge receipt", "category": "meta"},
    {"mnemonic": "MetaSync", "definition": "Synchronization message", "category": "meta"},
]


def build_quantization_prompt(message: str, src: str, dst: str, anchors: List[Dict]) -> str:
    """Build the prompt for Gemini to perform semantic quantization."""

    anchor_list = "\n".join([
        f"  - {a['mnemonic']}: {a['definition']}"
        for a in anchors
    ])

    return f"""You are a semantic compression engine for multi-agent communication. Your task is to analyze a verbose message and compress it into a structured format using semantic anchors.

## Available Semantic Anchors:
{anchor_list}

## Input Message:
- From: {src}
- To: {dst}
- Message: "{message}"

## Your Task:
1. Analyze the intent and key information in the message
2. Select the SINGLE most appropriate anchor from the list above
3. Extract only the essential parameters needed to reconstruct the meaning
4. Generate a compact wire format

## Output Format (respond with ONLY this JSON, no markdown):
{{
  "anchor": "<selected_mnemonic>",
  "reasoning": "<1 sentence explaining why this anchor fits>",
  "params": {{<key-value pairs of essential extracted data>}},
  "wire": "<anchor>(<compact_params>)"
}}

## Example:
Input: "Running regression suite on Authentication module"
Output:
{{
  "anchor": "RequestTask",
  "reasoning": "The message is requesting execution of a test suite, which is a task request",
  "params": {{"task": "regression_test", "target": "auth"}},
  "wire": "RequestTask(test:regression,target:auth)"
}}

Now analyze and compress the input message:"""


async def quantize_with_gemini(
    message: str,
    src: str,
    dst: str,
    custom_anchors: Optional[List[Dict]] = None
) -> Optional[Dict[str, Any]]:
    """
    Use Gemini to semantically quantize a message.

    Returns:
        Dict with keys: anchor, reasoning, params, wire, tokens_saved
        Or None if Gemini is unavailable
    """
    model = get_gemini_model()
    if model is None:
        return None

    anchors = custom_anchors or ANCHOR_REGISTRY
    prompt = build_quantization_prompt(message, src, dst, anchors)

    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        # Clean up response - remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        result = json.loads(text)

        # Calculate token savings estimate
        original_tokens = len(message.split())
        wire_tokens = len(result.get("wire", "").split())

        result["original_tokens"] = original_tokens
        result["compressed_tokens"] = wire_tokens
        result["savings_pct"] = round((1 - wire_tokens / max(original_tokens, 1)) * 100, 1)

        logger.info(f"Gemini quantized: '{message[:50]}...' -> {result['anchor']} ({result['savings_pct']}% reduction)")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Gemini returned invalid JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemini quantization failed: {e}")
        return None


async def suggest_new_anchor(
    message: str,
    existing_anchors: List[Dict]
) -> Optional[Dict[str, Any]]:
    """
    Use Gemini to suggest a new anchor when existing ones don't fit well.
    This powers the "Autotuner" feature.
    """
    model = get_gemini_model()
    if model is None:
        return None

    anchor_list = "\n".join([f"  - {a['mnemonic']}: {a['definition']}" for a in existing_anchors])

    prompt = f"""You are designing semantic anchors for a multi-agent communication protocol.

## Existing Anchors:
{anchor_list}

## Message that doesn't fit well:
"{message}"

## Task:
Propose a NEW semantic anchor that would better capture this message's intent.
The anchor should be:
- General enough to apply to similar messages
- Specific enough to be meaningful
- Follow the naming convention (CamelCase, verb-noun style)

## Output Format (respond with ONLY this JSON, no markdown):
{{
  "mnemonic": "<NEW_ANCHOR_NAME>",
  "definition": "<clear 1-sentence definition>",
  "category": "<observe|inform|ask|request|propose|commit|eval|action|meta>",
  "example_messages": ["<example 1>", "<example 2>"]
}}"""

    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        return json.loads(text)

    except Exception as e:
        logger.error(f"Gemini anchor suggestion failed: {e}")
        return None


# Synchronous wrapper for non-async contexts
def quantize_sync(message: str, src: str, dst: str) -> Optional[Dict[str, Any]]:
    """Synchronous version of quantize_with_gemini for compatibility."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're in an async context, can't use run_until_complete
            return None
        return loop.run_until_complete(quantize_with_gemini(message, src, dst))
    except RuntimeError:
        # No event loop, create one
        return asyncio.run(quantize_with_gemini(message, src, dst))
