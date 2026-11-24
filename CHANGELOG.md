# Changelog

All notable changes to the **DecompFlow** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-11-24

### 🤖 CLI & TUI Interface
- **Retro 8-Bit Mascot Banner:** Added glowing ASCII pixel mascot (warm ANSI `#f97316` / `#facc15` palette) with star-wand wand and horns.
- **Greeting & System Status Header:** Live system diagnostics showing host/user, active OS platform (`Linux x64`, `Darwin`, `Windows`), active LLM model (`DeepSeek-Reasoner R1`, `Qwen 2.5 Coder`), workspace directory, and decompilation engine status.
- **Interactive TUI Prompt:** Minimalist prompt (`decompflow$ ` / `> `) with hotkey shortcuts (`? for shortcuts`) and real-time model provider readiness indicator.

### 🧠 Orchestration & AI Engines
- **Multi-Model Provider Hub:** Unified support for DeepSeek (V3 & Reasoner R1), Qwen 2.5 Coder, LLaMA 3.3, Anthropic Claude, OpenAI, and NVIDIA NIM endpoints.
- **Tiered Engine Orchestrator:** Implemented multi-tier binary analysis:
  - *Tier 1 (Fast Triage):* Strings, symbols, imports, and Mandiant Capa capability matching.
  - *Tier 2 (Deep Decompile):* Headless Ghidra and Radare2 function recovery and decompilation.
  - *Tier 3 (Synthesis):* LLM-driven architecture reconstruction, struct naming, and vulnerability detection.
- **MCP Bridge Upgrades:** Upgraded Ghidra, Radare2, Mandiant Capa, and JADX bridges to v0.2.0 with enhanced JSON-RPC streaming and tool execution.

### 🖥️ Desktop Studio UI
- **Crisp Vector Graph Visualizer:** 
  - Eliminated blur filters on node zoom and pan via dynamic viewport counter-scaling.
  - Optimized React Flow canvas layout to eliminate node overlap and clutter.
  - Applied razor-sharp `non-scaling-stroke` vector lines for call graphs.
- **Window Management & Linux Integration:**
  - Multi-OS window controls, frameless titlebar with drag regions.
  - GNOME Dock WM_CLASS matching, launcher wrapper script, and trusted `.desktop` shortcut generator.
- **Bilingual Localization (i18n):** Full English and Russian support with domain-accurate reverse-engineering terminology.
- **Interactive Documentation Modal:** Integrated in-app documentation browser and guide launcher.
- **Legal Compliance:** Mandatory Legal Disclaimer & Ethical Research Terms Gate.

### 🌐 Documentation & SEO
- **Official GitHub Pages Site:** Standalone product landing page at `https://dropt1mx0.github.io/DecompFlow/`.
- **Search Engine Optimization:** Open Graph tags, Twitter Cards, Schema.org `SoftwareApplication` JSON-LD metadata, `sitemap.xml`, and `robots.txt` for Google and Bing indexing.

---

## [0.1.0] - 2026-11-24

### 🚀 Initial Release
- Multi-OS release pipeline (Linux `.AppImage` & `.deb`, Windows `.exe` NSIS/portable, macOS `.dmg` & `.zip`).
- Core LangGraph-powered orchestration agent.
- Headless Ghidra decompilation bridge.
- Radare2 and Capa rule-based triage.
- Electron desktop UI with chat stream and interactive call graph.
- Initial CLI tool (`decompflow`, `dfw`, `decomp`).
