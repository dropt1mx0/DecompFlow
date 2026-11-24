#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import {
  buildDecompFlowGraph,
  defaultMcpManager,
  McpClientManager,
  detectTargetType,
  EngineProfile,
  PreferredNativeBackend,
  resolveLlmConfig,
} from "@decompflow/core";
import {
  printCliBanner,
  printStatusBar,
  formatModelDisplayName,
  ANSI,
} from "./banner.js";
import { startInteractiveSession } from "./interactive.js";

const program = new Command();

program
  .name("decompflow")
  .description("Autonomous AI Reverse Engineering & Software Architecture Analysis Agent powered by LangGraph, REA, and MCP")
  .version("0.2.0");

// Interactive TUI Command
program
  .command("interactive", { isDefault: false })
  .alias("i")
  .description("Launch interactive DecompFlow TUI terminal session")
  .action(async () => {
    await startInteractiveSession();
  });

program
  .command("analyze <target>")
  .description("Analyze software architecture, decompile binaries, inspect Electron/ASAR apps, or reconstruct features")
  .option("-m, --mode <mode>", "Target mode: binary | web | source (auto-detected if omitted)")
  .option("-s, --skill <skillName>", "Analysis skill to apply (e.g. binary-architecture, feature-reconstruct, security-audit, repo-onboarding)", "binary-architecture")
  .option("-p, --prompt <prompt>", "Specific user query, feature description, or instruction to reverse engineer")
  .option("-o, --out [reportPath]", "Output file path to save the generated Markdown report (default: ./reports/decompflow_report.md)")
  .option("-c, --config <configPath>", "Path to custom mcp-servers.json configuration")
  .option("--profile <profile>", "Engine execution profile: auto | fast-triage | deep-decompile", "auto")
  .option("--backend <backend>", "Preferred native decompiler backend: ghidra | radare2 | ida | binja", "ghidra")
  .action(async (target: string, options: {
    mode?: "binary" | "web" | "source";
    skill: string;
    prompt?: string;
    out?: string | boolean;
    config?: string;
    profile: string;
    backend: string;
  }) => {
    const llmConfig = resolveLlmConfig();
    let mcpManager = defaultMcpManager;
    if (options.config) {
      mcpManager = new McpClientManager(options.config);
    }

    const detected = detectTargetType(target);
    const mode = options.mode || (detected === "electron_bundle" ? "source" : detected === "mobile" ? "binary" : detected);

    const outPath = options.out
      ? typeof options.out === "string"
        ? options.out
        : "./reports/decompflow_report.md"
      : undefined;

    const engineProfile = (options.profile as EngineProfile) || "auto";
    const preferredBackend = (options.backend as PreferredNativeBackend) || "ghidra";

    // Print Mascot Banner with target & engine details
    printCliBanner({
      target,
      workspace: process.cwd(),
      model: llmConfig.model,
      provider: llmConfig.provider,
      profile: engineProfile,
      backend: preferredBackend,
      version: "0.2.0",
    });

    console.log(`[DecompFlow] Target:        ${target}`);
    console.log(`[DecompFlow] Detected Type: ${detected}`);
    console.log(`[DecompFlow] Mode:          ${mode}`);
    console.log(`[DecompFlow] Skill:         ${options.skill}`);
    console.log(`[DecompFlow] Profile:       ${engineProfile}`);
    console.log(`[DecompFlow] Native Backend:${preferredBackend}`);
    if (options.prompt) {
      console.log(`[DecompFlow] Query/Feature: ${options.prompt}`);
    }
    if (outPath) {
      console.log(`[DecompFlow] Report Dest:   ${path.resolve(outPath)}`);
    }
    console.log("---------------------------------------------------------------");

    try {
      const graph = buildDecompFlowGraph();
      const result = await graph.invoke({
        target,
        mode,
        activeSkill: options.skill,
        userPrompt: options.prompt,
        outPath,
        iteration: 0,
        maxIterations: 3,
        pendingQueries: [],
        symbolSnippets: {},
        engineProfile,
        preferredNativeBackend: preferredBackend,
        detectedCapabilities: [],
      });

      console.log("\n=================== [ ANALYSIS COMPLETE ] ====================\n");
      console.log(result.finalReport);
      console.log("===============================================================\n");

      await mcpManager.closeAll();
      process.exit(0);
    } catch (error) {
      console.error("\n[DecompFlow] [FATAL] Execution failed:", error);
      await mcpManager.closeAll();
      process.exit(1);
    }
  });

program
  .command("triage <target>")
  .description("Fast binary triage via Mandiant Capa & Radare2 (<1s, zero JVM overhead)")
  .option("-o, --out [reportPath]", "Output file path to save report")
  .action(async (target: string, options: { out?: string | boolean }) => {
    const llmConfig = resolveLlmConfig();
    printCliBanner({
      target,
      model: llmConfig.model,
      provider: llmConfig.provider,
      profile: "fast-triage",
      backend: "radare2",
      version: "0.2.0",
    });

    const outPath = options.out
      ? typeof options.out === "string"
        ? options.out
        : "./reports/decompflow_triage.md"
      : undefined;

    try {
      const graph = buildDecompFlowGraph();
      const result = await graph.invoke({
        target,
        mode: "binary",
        activeSkill: "binary-architecture",
        outPath,
        iteration: 0,
        maxIterations: 1,
        pendingQueries: [],
        symbolSnippets: {},
        engineProfile: "fast-triage",
        preferredNativeBackend: "radare2",
        detectedCapabilities: [],
      });

      console.log("\n=================== [ TRIAGE COMPLETE ] ====================\n");
      console.log(result.finalReport);
      console.log("============================================================\n");
      await defaultMcpManager.closeAll();
      process.exit(0);
    } catch (error) {
      console.error("\n[DecompFlow] [FATAL] Triage failed:", error);
      await defaultMcpManager.closeAll();
      process.exit(1);
    }
  });

// Handle launch without arguments -> start interactive TUI session
const args = process.argv.slice(2);
if (args.length === 0) {
  startInteractiveSession();
} else if (
  args.length === 1 &&
  !args[0].startsWith("-") &&
  !["analyze", "triage", "interactive", "i", "help"].includes(args[0])
) {
  // If user ran `decompflow <file>` directly
  const directPath = path.resolve(args[0]);
  if (fs.existsSync(directPath)) {
    process.argv = [process.argv[0], process.argv[1], "analyze", directPath];
    program.parse(process.argv);
  } else {
    program.parse(process.argv);
  }
} else {
  program.parse(process.argv);
}
