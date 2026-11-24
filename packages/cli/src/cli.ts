#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import {
  buildDecompFlowGraph,
  defaultMcpManager,
  McpClientManager,
  detectTargetType,
  EngineProfile,
  PreferredNativeBackend,
} from "@decompflow/core";

const program = new Command();

program
  .name("decompflow")
  .description("Autonomous AI Reverse Engineering & Software Architecture Analysis Agent powered by LangGraph, REA, and MCP")
  .version("0.1.0");

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

    console.log("===============================================================");
    console.log("    DecompFlow AI Agent v0.1.0 (Tiered Orchestrator & REA)     ");
    console.log("===============================================================");
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

program.parse(process.argv);
