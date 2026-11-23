# Skill: Binary Architecture Reconstruction

## Goal
Analyze decompiled C pseudo-code from Ghidra MCP to reconstruct high-level program architecture, data structures, and control flow.

## Rules
1. Start by listing entry points and exported functions (`list_functions`).
2. Trace cross-references (`get_xrefs`) for critical string literals (URLs, file paths, error messages).
3. Suggest meaningful names for unnamed functions (`sub_*`) based on their side effects and API calls.
4. Output a clean architectural breakdown with a Mermaid sequence/flow diagram.
