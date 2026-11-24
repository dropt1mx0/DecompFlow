import os from "node:os";
import path from "node:path";

// ANSI Color codes
export const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  // Brand Palette & Glow Gradients
  orange: "\x1b[38;2;249;115;22m",       // #f97316 - DecompFlow Official Orange
  orange214: "\x1b[38;5;214m",           // Neon amber-orange glow
  orangeSoft: "\x1b[38;5;208m",          // Mid-gradient orange
  orangeBody: "\x1b[38;5;202m",          // Deep torso/legs orange
  orangeGlow: "\x1b[38;2;255;154;77m",   // #ff9a4d - Glow accent
  yellow: "\x1b[38;2;250;204;21m",       // #facc15 - Standard yellow
  yellowStar: "\x1b[38;5;229m",          // #fef08a - Wand star sparkle
  yellowSpark: "\x1b[38;5;220m",         // #facc15 - Spark gold
  wand: "\x1b[38;5;215m",                // Wand rod
  // Standard terminal colors
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  greenBright: "\x1b[92m",
  white: "\x1b[97m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
};

export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Returns pixel-accurate mascot ASCII art lines (Mage Robot with wand and ears),
 * scaled compactly (~12 chars wide, 13 rows high).
 */
export function getMascotLines(): string[] {
  const { orange, orange214, orangeSoft, orangeBody, yellowStar, yellowSpark, wand, reset } = ANSI;

  return [
    `          ${yellowStar}★${reset}`,
    `  ${orange214}▄  ▄${reset}   ${yellowSpark}✦${yellowStar}*${yellowSpark}✦${reset}`,
    `  ${orange214}█  █${reset}    ${wand}│${reset}`,
    ` ${orange}▄████▄${reset}   ${wand}│${reset}`,
    `${orange}████████${reset}  ${wand}│${reset}`,
    `${orange}█  ██  █${reset}  ${wand}│${reset}`,
    `${orange}████████${reset} ${yellowSpark}─┴─${reset}`,
    `${orangeSoft}██ ▀▀ ██${reset}`,
    ` ${orangeBody}██████${reset}`,
    `  ${orangeBody}████${reset}`,
    `  ${orangeBody}█  █${reset}`,
    `  ${orangeBody}█  █${reset}`,
    `  ${orangeBody}█  █${reset}`,
    `  ${orangeBody}█  █${reset}`,
    ` ${orangeBody}▀▀  ▀▀${reset}`,
  ];
}

/**
 * Formats model identifiers into human-readable brand labels.
 */
export function formatModelDisplayName(model?: string, provider?: string): string {
  if (!model) return "DeepSeek-Reasoner (R1)";

  const lower = model.toLowerCase();
  if (lower.includes("deepseek-reasoner") || lower.includes("r1")) return "DeepSeek-Reasoner (R1)";
  if (lower.includes("deepseek-chat") || lower.includes("deepseek-v3")) return "DeepSeek-V3 (Chat)";
  if (lower.includes("qwen2.5-coder") && lower.includes("72b")) return "Qwen 2.5 Coder (72B)";
  if (lower.includes("qwen2.5-coder")) return "Qwen 2.5 Coder (32B)";
  if (lower.includes("qwen-max")) return "Qwen Max (Cloud)";
  if (lower.includes("nemotron")) return "NVIDIA Nemotron 4 (34B)";
  if (lower.includes("llama-3.3")) return "Meta Llama 3.3 (70B)";
  if (lower.includes("gpt-4o-mini")) return "OpenAI GPT-4o Mini";
  if (lower.includes("gpt-4o")) return "OpenAI GPT-4o";

  if (provider === "ollama") return `Ollama (${model})`;
  if (provider === "lmstudio") return `LM Studio (${model})`;

  return model;
}

export interface CliBannerOptions {
  target?: string;
  workspace?: string;
  model?: string;
  provider?: string;
  profile?: string;
  backend?: string;
  version?: string;
}

/**
 * Prints the side-by-side Mascot & Status Header banner.
 */
export function printCliBanner(options: CliBannerOptions = {}): void {
  const { bold, dim, orange, orange214, cyan, green, white, gray, reset } = ANSI;

  const version = options.version || "0.2.0";
  const modelDisplay = formatModelDisplayName(options.model, options.provider);
  const workspacePath = options.workspace || process.cwd();
  const targetLabel = options.target
    ? path.resolve(options.target)
    : workspacePath;

  const engineProfile = options.profile || "auto";
  const backend = options.backend || "ghidra";

  const mascot = getMascotLines();
  const mascotWidth = Math.max(...mascot.map((line) => visibleLength(line)));

  const headerLines = [
    `${bold}${orange}DecompFlow CLI${reset} ${bold}${white}v${version}${reset} ${dim}· Autonomous AI Reverse Engineering${reset}`,
    `${cyan}dropt1m${gray}@${cyan}DecompFlow-Studio${reset} ${dim}──${reset} ${gray}[${os.type()} ${os.arch()}]${reset}`,
    `${gray}Model:     ${reset}${bold}${white}${modelDisplay}${reset} ${green}• ready${reset}`,
    `${gray}Workspace: ${reset}${white}${targetLabel}${reset}`,
    `${gray}Engines:   ${reset}${orange214}Tiered Orchestrator${reset} ${dim}(Capa · R2 · Ghidra · REA)${reset}`,
    `${gray}Profile:   ${reset}${white}${engineProfile}${reset} ${dim}(Tier 1 Fast Triage / Tier 2 Deep Decompile)${reset}`,
    `${gray}Backend:   ${reset}${white}${backend}${reset} ${dim}(Native Bridge)${reset}`,
    `${gray}Status:    ${reset}${green}●${reset} ${white}Local & Cloud Providers Active${reset}`,
    `${dim}─────────────────────────────────────────────────────────────${reset}`,
    `${dim}Interactive TUI: Type ${reset}${bold}${orange}?${reset}${dim} or ${reset}${bold}${orange}help${reset}${dim} for shortcuts & palette${reset}`,
    `${dim}Quickstart: ${reset}${white}analyze <path>${reset} ${dim}|${reset} ${white}triage <path>${reset} ${dim}|${reset} ${white}model <name>${reset}`,
    `${dim}Local AI:   ${reset}${white}100% offline ready (Ollama / LM Studio / R2)${reset}`,
    `${dim}Security:   ${reset}${white}Authorized Research Only · Zero Cloud Telemetry${reset}`,
    `${dim}Repository: ${reset}${cyan}https://github.com/dropt1mx0/DecompFlow${reset}`,
    `${dim}Authors:    ${reset}${white}dropt1m (@dropt1mx0)${reset}`,
  ];

  console.log("");
  const totalRows = Math.max(mascot.length, headerLines.length);
  for (let i = 0; i < totalRows; i++) {
    const m = mascot[i] || "";
    const padding = " ".repeat(Math.max(0, mascotWidth - visibleLength(m) + 3));
    const h = headerLines[i] || "";
    console.log(`${m}${padding}│  ${h}`);
  }
  console.log("");
}

/**
 * Prints the persistent utility bottom status bar.
 */
export function printStatusBar(options: { model?: string; provider?: string; isReady?: boolean } = {}): void {
  const { bold, dim, orange, green, white, gray, reset } = ANSI;
  const modelDisplay = formatModelDisplayName(options.model, options.provider);
  const statusBullet = options.isReady === false ? `${ANSI.red}○ connecting${reset}` : `${green}● ready${reset}`;

  console.log(
    `${dim}[${reset} ${bold}${orange}? for shortcuts${reset} ${dim}]${reset}   ${white}${modelDisplay}${reset} ${statusBullet}   ${gray}Tier 1/2 Orchestrator Active${reset}`
  );
  console.log("");
}

/**
 * Prints a clean help and shortcuts box.
 */
export function printShortcutsHelp(): void {
  const { bold, dim, orange, cyan, white, reset } = ANSI;

  console.log(`
${bold}${orange}DecompFlow Interactive Command Palette & Hotkeys${reset}
${dim}────────────────────────────────────────────────────────────────────────${reset}
  ${bold}${orange}analyze <path>${reset} [options]   Run complete AI analysis on binary, APK, ASAR, or source
  ${bold}${orange}triage <path>${reset}              Quick capability scan via Mandiant Capa & R2 (<1s)
  ${bold}${orange}model <name>${reset}               Switch active model (e.g. ${cyan}deepseek-reasoner${reset}, ${cyan}qwen-max${reset})
  ${bold}${orange}profile <mode>${reset}             Set engine profile: ${white}auto${reset} | ${white}fast-triage${reset} | ${white}deep-decompile${reset}
  ${bold}${orange}backend <name>${reset}             Set native decompiler: ${white}ghidra${reset} | ${white}radare2${reset} | ${white}ida${reset} | ${white}binja${reset}
  ${bold}${orange}status${reset}                     Display current MCP servers, LLM endpoints, and tools
  ${bold}${orange}clear${reset}                      Clear terminal screen and reprint mascot banner
  ${bold}${orange}exit${reset} / ${bold}${orange}quit${reset}               Exit DecompFlow CLI (${dim}Ctrl+C${reset} / ${dim}Ctrl+D${reset})

  ${dim}💡 Pro-tip: You can enter any direct file path (e.g. /bin/ls) or query to start!${reset}
${dim}────────────────────────────────────────────────────────────────────────${reset}
`);
}
