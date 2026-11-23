import { StateGraph, END } from "@langchain/langgraph";
import { DecompFlowState, DecompFlowStateType, EvidenceItem } from "./state.js";
import {
  binaryReconNode,
  reaReconNode,
  webReconNode,
  sourceReconNode,
  analyzeNode,
  reportNode,
} from "./nodes.js";
import { detectTargetType } from "../mcp/client.js";

async function routeTarget(state: DecompFlowStateType) {
  const detected = detectTargetType(state.target);
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

export function buildDecompFlowGraph() {
  const graph = new StateGraph(DecompFlowState)
    .addNode("binary_recon", binaryReconNode)
    .addNode("rea_recon", reaReconNode)
    .addNode("web_recon", webReconNode)
    .addNode("source_recon", sourceReconNode)
    .addNode("analyze", analyzeNode)
    .addNode("report", reportNode)
    .addConditionalEdges("__start__", routeTarget, {
      binary_recon: "binary_recon",
      rea_recon: "rea_recon",
      web_recon: "web_recon",
      source_recon: "source_recon",
    })
    .addEdge("binary_recon", "analyze")
    .addEdge("rea_recon", "analyze")
    .addEdge("web_recon", "analyze")
    .addEdge("source_recon", "analyze")
    .addEdge("analyze", "report")
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
  };

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

  return state as DecompFlowStateType;
}
