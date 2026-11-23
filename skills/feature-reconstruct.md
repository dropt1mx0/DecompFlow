# Skill: Feature Reverse Engineering & Clean-Room Reconstruction

## Goal
Locate a specific target feature or subsystem inside an application (Electron/ASAR, JavaScript bundle, or native binary), collect an authenticated chain of evidence (exact files, line offsets, memory addresses, IPC channels, and API calls), and generate a clean-room, production-ready implementation of that feature in TypeScript or Python.

## Workflow

### 1. Feature Hypothesis & Symbol Discovery
- Formulate a clear seed for the requested feature (e.g., "clipboard synchronization", "encrypted token storage", "IPC telemetry handler", "search indexing").
- In Electron/JS bundles: search for IPC invocations (`ipcRenderer.invoke`, `ipcRenderer.send`, `ipcMain.handle`), exported module shapes, and DOM events.
- In native binaries: search for string literals, xrefs, and imported dynamic symbols related to the feature.

### 2. Evidence Collection
- For every claim and code path identified, record a verified Evidence item:
  - **Source:** The exact archive, bundle path, or binary library (e.g., `resources/app.asar/dist/main/clipboard.js`).
  - **Location:** The specific function signature, memory address (`0x004010a0`), or IPC channel name (`app:clipboard-sync`).
  - **Snippet:** The decompiled code snippet, AST node, or string constant proving the logic.
  - **Confidence:** `VERIFIED` (directly observed in control flow), `HIGH` (strong xref/callsite correlation), or `MEDIUM` (heuristic inference).

### 3. Data Flow & Boundary Isolation
- Map the complete lifecycle:
  1. Input validation & serialization.
  2. Core algorithm execution / cryptographic transforms / data persistence.
  3. Response dispatch or state mutation.
- Strip away proprietary telemetry, obfuscated variable names, and environment-specific artifacts.

### 4. Clean-Room Implementation
- Produce a self-contained, typed, and documented implementation:
  - If TypeScript: include strict interfaces, error types, and async handling.
  - If Python: include type annotations, dataclasses, and standard library primitives.
- Ensure the reconstructed code is ready to copy-paste and integrate directly into new projects.

### 5. Architectural Verification
- Output a Mermaid sequence or flowchart diagram showing how the reconstructed feature interacts with system components.
- Document any identified edge cases, buffer limitations, or protocol nuances.
