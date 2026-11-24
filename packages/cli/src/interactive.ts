import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import {
  buildDecompFlowGraph,
  defaultMcpManager,
  detectTargetType,
  EngineProfile,
  PreferredNativeBackend,
  resolveLlmConfig,
} from "@decompflow/core";
import {
  ANSI,
  printCliBanner,
  printStatusBar,
  printShortcutsHelp,
  formatModelDisplayName,
} from "./banner.js";

export interface InteractiveSessionOptions {
  model?: string;
  provider?: string;
  profile?: EngineProfile;
  backend?: PreferredNativeBackend;
  workspace?: string;
}

export async function startInteractiveSession(initialOpts: InteractiveSessionOptions = {}): Promise<void> {
  const llmConfig = resolveLlmConfig();

  let activeModel = initialOpts.model || llmConfig.model;
  let activeProvider = initialOpts.provider || llmConfig.provider;
  let activeProfile: EngineProfile = initialOpts.profile || "auto";
  let activeBackend: PreferredNativeBackend = initialOpts.backend || "ghidra";
  const workspace = initialOpts.workspace || process.cwd();

  const printCurrentScreen = () => {
    console.clear();
    printCliBanner({
      workspace,
      model: activeModel,
      provider: activeProvider,
      profile: activeProfile,
      backend: activeBackend,
    });
    printStatusBar({
      model: activeModel,
      provider: activeProvider,
      isReady: true,
    });
  };

  printCurrentScreen();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${ANSI.orange}decompflow${ANSI.reset}${ANSI.gray}$${ANSI.reset} `,
  });

  rl.prompt();

  rl.on("line", async (lineStr: string) => {
    const raw = lineStr.trim();
    if (!raw) {
      rl.prompt();
      return;
    }

    const [cmd, ...args] = raw.split(/\s+/);
    const lowerCmd = cmd.toLowerCase();

    // 1. Shortcuts / Help
    if (lowerCmd === "?" || lowerCmd === "help" || lowerCmd === "shortcuts") {
      printShortcutsHelp();
      rl.prompt();
      return;
    }

    // 2. Clear Screen
    if (lowerCmd === "clear" || lowerCmd === "cls") {
      printCurrentScreen();
      rl.prompt();
      return;
    }

    // 3. Exit / Quit
    if (lowerCmd === "exit" || lowerCmd === "quit" || lowerCmd === "q") {
      console.log(`\n${ANSI.gray}Shutting down DecompFlow CLI... Goodbye!${ANSI.reset}\n`);
      await defaultMcpManager.closeAll();
      process.exit(0);
    }

    // 4. Status / Info
    if (lowerCmd === "status" || lowerCmd === "info") {
      console.log(`\n${ANSI.bold}${ANSI.orange}DecompFlow System & Engine Status:${ANSI.reset}`);
      console.log(`  ${ANSI.gray}Active Model:    ${ANSI.reset}${ANSI.white}${formatModelDisplayName(activeModel, activeProvider)}${ANSI.reset} (${activeModel})`);
      console.log(`  ${ANSI.gray}Provider:        ${ANSI.reset}${ANSI.white}${activeProvider}${ANSI.reset}`);
      console.log(`  ${ANSI.gray}Engine Profile:  ${ANSI.reset}${ANSI.white}${activeProfile}${ANSI.reset}`);
      console.log(`  ${ANSI.gray}Native Backend:  ${ANSI.reset}${ANSI.white}${activeBackend}${ANSI.reset}`);
      console.log(`  ${ANSI.gray}Base URL:        ${ANSI.reset}${ANSI.white}${llmConfig.baseUrl}${ANSI.reset}`);
      console.log(`  ${ANSI.gray}Workspace Dir:   ${ANSI.reset}${ANSI.white}${workspace}${ANSI.reset}\n`);
      rl.prompt();
      return;
    }

    // 5. Change Model
    if (lowerCmd === "model") {
      if (!args[0]) {
        console.log(`\n${ANSI.yellow}Current model: ${formatModelDisplayName(activeModel, activeProvider)} (${activeModel})${ANSI.reset}`);
        console.log(`Usage: model <model-name> (e.g. model deepseek-reasoner, model qwen2.5-coder-72b-instruct)\n`);
      } else {
        activeModel = args[0];
        console.log(`\n${ANSI.green}✔ Active model switched to: ${ANSI.bold}${activeModel}${ANSI.reset}\n`);
      }
      rl.prompt();
      return;
    }

    // 6. Change Profile
    if (lowerCmd === "profile") {
      const p = args[0]?.toLowerCase();
      if (p === "auto" || p === "fast-triage" || p === "deep-decompile") {
        activeProfile = p as EngineProfile;
        console.log(`\n${ANSI.green}✔ Engine profile set to: ${ANSI.bold}${activeProfile}${ANSI.reset}\n`);
      } else {
        console.log(`\n${ANSI.yellow}Usage: profile <auto | fast-triage | deep-decompile>${ANSI.reset}\n`);
      }
      rl.prompt();
      return;
    }

    // 7. Change Backend
    if (lowerCmd === "backend") {
      const b = args[0]?.toLowerCase();
      if (b === "ghidra" || b === "radare2" || b === "ida" || b === "binja") {
        activeBackend = b as PreferredNativeBackend;
        console.log(`\n${ANSI.green}✔ Preferred native backend set to: ${ANSI.bold}${activeBackend}${ANSI.reset}\n`);
      } else {
        console.log(`\n${ANSI.yellow}Usage: backend <ghidra | radare2 | ida | binja>${ANSI.reset}\n`);
      }
      rl.prompt();
      return;
    }

    // 8. Triage Command (<1s Capa + R2)
    if (lowerCmd === "triage") {
      const targetFile = args[0];
      if (!targetFile) {
        console.log(`\n${ANSI.yellow}Usage: triage <path-to-binary>${ANSI.reset}\n`);
        rl.prompt();
        return;
      }
      await executeAnalysis({
        target: targetFile,
        profile: "fast-triage",
        backend: activeBackend,
        model: activeModel,
      });
      rl.prompt();
      return;
    }

    // 9. Analyze Command
    if (lowerCmd === "analyze") {
      const targetFile = args[0];
      if (!targetFile) {
        console.log(`\n${ANSI.yellow}Usage: analyze <path-to-target> [prompt]${ANSI.reset}\n`);
        rl.prompt();
        return;
      }
      const userPrompt = args.slice(1).join(" ") || undefined;
      await executeAnalysis({
        target: targetFile,
        profile: activeProfile,
        backend: activeBackend,
        model: activeModel,
        prompt: userPrompt,
      });
      rl.prompt();
      return;
    }

    // 10. Direct file path check (e.g. user typed "/bin/ls" or "./target.bin")
    const resolvedPath = path.resolve(raw);
    if (fs.existsSync(resolvedPath)) {
      console.log(`\n${ANSI.dim}Detected target file path: ${resolvedPath}${ANSI.reset}`);
      await executeAnalysis({
        target: resolvedPath,
        profile: activeProfile,
        backend: activeBackend,
        model: activeModel,
      });
      rl.prompt();
      return;
    }

    // 11. Fallback: treat line as an AI prompt or general instruction
    console.log(`\n${ANSI.dim}[Agent] Analyzing request: "${raw}"...${ANSI.reset}`);
    await executeAnalysis({
      target: workspace,
      prompt: raw,
      profile: activeProfile,
      backend: activeBackend,
      model: activeModel,
    });

    rl.prompt();
  });

  rl.on("close", async () => {
    console.log(`\n${ANSI.gray}DecompFlow interactive session closed.${ANSI.reset}\n`);
    await defaultMcpManager.closeAll();
    process.exit(0);
  });
}

async function executeAnalysis(opts: {
  target: string;
  prompt?: string;
  profile: EngineProfile;
  backend: PreferredNativeBackend;
  model: string;
}): Promise<void> {
  const detected = detectTargetType(opts.target);
  const mode = detected === "electron_bundle" ? "source" : detected === "mobile" ? "binary" : detected;

  console.log(`\n${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.orange}[DecompFlow Orchestrator]${ANSI.reset} Launching multi-tier analysis...`);
  console.log(`  Target:   ${ANSI.white}${opts.target}${ANSI.reset} (${detected})`);
  console.log(`  Profile:  ${ANSI.white}${opts.profile}${ANSI.reset}`);
  console.log(`  Backend:  ${ANSI.white}${opts.backend}${ANSI.reset}`);
  if (opts.prompt) {
    console.log(`  Prompt:   ${ANSI.white}${opts.prompt}${ANSI.reset}`);
  }
  console.log(`${ANSI.dim}─────────────────────────────────────────────────────────────${ANSI.reset}\n`);

  try {
    const graph = buildDecompFlowGraph();
    const result = await graph.invoke({
      target: opts.target,
      mode,
      activeSkill: "binary-architecture",
      userPrompt: opts.prompt,
      iteration: 0,
      maxIterations: 3,
      pendingQueries: [],
      symbolSnippets: {},
      engineProfile: opts.profile,
      preferredNativeBackend: opts.backend,
      detectedCapabilities: [],
    });

    console.log(`\n${ANSI.bold}${ANSI.green}══════════════════════ [ ANALYSIS REPORT ] ══════════════════════${ANSI.reset}\n`);
    console.log(result.finalReport || "No report generated.");
    console.log(`\n${ANSI.bold}${ANSI.green}═════════════════════════════════════════════════════════════════${ANSI.reset}\n`);
  } catch (err: any) {
    console.error(`\n${ANSI.red}[ERROR] Analysis execution failed: ${err.message || String(err)}${ANSI.reset}\n`);
  }
}
