import { StateGraph, END } from "@langchain/langgraph";
import {
  DecompFlowState,
  DecompFlowStateType,
  EngineProfile,
  PreferredNativeBackend,
} from "./state.js";
import {
  binaryReconNode,
  mobileReconNode,
  reaReconNode,
  webReconNode,
  sourceReconNode,
  analyzeNode,
  deepDiveNode,
  reportNode,
} from "./nodes.js";
import { detectTargetType, defaultMcpManager } from "../mcp/client.js";

async function routeTarget(state: DecompFlowStateType) {
  const detected = detectTargetType(state.target);
  if (detected === "mobile") {
    return "mobile_recon";
  }
  if (detected === "electron_bundle") {
    return "rea_recon";
  }
  if (state.mode === "binary" || detected === "binary") {
    return "binary_recon";
  }
  if (state.mode === "web" || detected === "web") {
    return "web_recon";
  }
  return "source_recon";
}

function shouldContinueDeepDive(state: DecompFlowStateType) {
  const hasPending = state.pendingQueries && state.pendingQueries.length > 0;
  const canIterate = (state.iteration || 0) < (state.maxIterations || 3);
  if (hasPending && canIterate) {
    console.log(
      `[DecompFlow] [Routing] Continuing multi-hop deep dive (Iteration ${(state.iteration || 0) + 1}/${state.maxIterations || 3})...`
    );
    return "deep_dive";
  }
  console.log(`[DecompFlow] [Routing] Finalizing analysis -> routing to report.`);
  return "report";
}

export function buildDecompFlowGraph() {
  const graph = new StateGraph(DecompFlowState)
    .addNode("binary_recon", binaryReconNode)
    .addNode("mobile_recon", mobileReconNode)
    .addNode("rea_recon", reaReconNode)
    .addNode("web_recon", webReconNode)
    .addNode("source_recon", sourceReconNode)
    .addNode("analyze", analyzeNode)
    .addNode("deep_dive", deepDiveNode)
    .addNode("report", reportNode)
    .addConditionalEdges("__start__", routeTarget, {
      binary_recon: "binary_recon",
      mobile_recon: "mobile_recon",
      rea_recon: "rea_recon",
      web_recon: "web_recon",
      source_recon: "source_recon",
    })
    .addEdge("binary_recon", "analyze")
    .addEdge("mobile_recon", "analyze")
    .addEdge("rea_recon", "analyze")
    .addEdge("web_recon", "analyze")
    .addEdge("source_recon", "analyze")
    .addConditionalEdges("analyze", shouldContinueDeepDive, {
      deep_dive: "deep_dive",
      report: "report",
    })
    .addEdge("deep_dive", "analyze")
    .addEdge("report", END);

  return graph.compile();
}

export interface AnalysisProgressEvent {
  node: string;
  status: "running" | "completed";
  data?: any;
}

export async function runAnalysisWithProgress(
  initialState: {
    target: string;
    mode: "binary" | "web" | "source";
    activeSkill?: string;
    userPrompt?: string;
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    outPath?: string;
    maxIterations?: number;
    engineProfile?: EngineProfile;
    preferredNativeBackend?: PreferredNativeBackend;
  },
  onProgress?: (event: AnalysisProgressEvent) => void
): Promise<DecompFlowStateType> {
  const compiledGraph = buildDecompFlowGraph();
  const state: any = {
    target: initialState.target,
    mode: initialState.mode,
    activeSkill: initialState.activeSkill || "binary-architecture",
    userPrompt: initialState.userPrompt,
    messages: initialState.messages || [],
    outPath: initialState.outPath,
    extractedData: "",
    findings: [],
    evidence: [],
    reconstructedCode: undefined,
    finalReport: "",
    iteration: 0,
    maxIterations: initialState.maxIterations || 3,
    pendingQueries: [],
    symbolSnippets: {},
    engineProfile: initialState.engineProfile || "auto",
    preferredNativeBackend: initialState.preferredNativeBackend || "ghidra",
    detectedCapabilities: [],
  };

  try {
    const stream = await compiledGraph.stream(state, { streamMode: "updates" });
    for await (const chunk of stream) {
      for (const [nodeName, nodeOutput] of Object.entries(chunk)) {
        if (onProgress) {
          onProgress({
            node: nodeName,
            status: "completed",
            data: nodeOutput,
          });
        }
        Object.assign(state, nodeOutput);
      }
    }
  } finally {
    // Zero-overhead architecture: trigger auto idle timeouts or cleanup
    defaultMcpManager.scheduleIdleTimeout("capa-r2");
    defaultMcpManager.scheduleIdleTimeout("jadx");
    defaultMcpManager.scheduleIdleTimeout("ghidra");
    defaultMcpManager.scheduleIdleTimeout("rea");
  }

  return state as DecompFlowStateType;
}
