# Skill: Architectural Security & Quality Audit

## Goal
Analyze application architecture, endpoint interactions, and decompiled code to identify defensive architecture flaws, memory safety issues, and insecure design patterns.

## Rules
1. Inspect input validation boundaries at interface entrypoints and network handlers.
2. Check for unsafe memory functions (`strcpy`, `sprintf`, unconstrained buffers) in binary mode or unchecked DOM injections / CORS misconfigurations in web mode.
3. Evaluate cryptographic implementations and credential storage patterns against industry best practices (e.g. OWASP ASVS).
4. Provide structured remediations and defensive architecture recommendations without generating functional exploit payloads.
