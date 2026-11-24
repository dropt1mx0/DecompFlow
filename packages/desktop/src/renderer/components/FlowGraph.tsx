import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Edge,
  Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";
import { CustomEdge } from "./CustomEdge";
import { TargetMode, NodeExecutionStatus, EngineProfile } from "../types";

interface FlowGraphProps {
  mode: TargetMode;
  activeNode: string | null;
  completedNodes: string[];
  engineProfile?: EngineProfile;
}

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
  default: CustomEdge,
};

export const FlowGraph: React.FC<FlowGraphProps> = ({
  mode,
  activeNode,
  completedNodes,
  engineProfile = "auto",
}) => {
  const getNodeStatus = (nodeId: string): NodeExecutionStatus => {
    if (activeNode === nodeId) return "running";
    if (completedNodes.includes(nodeId)) return "completed";
    return "idle";
  };

  const nodes: Node[] = useMemo(() => {
    const isBinaryActive = activeNode === "binary_recon";
    const isMobileActive = activeNode === "mobile_recon";
    const isReaActive = activeNode === "rea_recon";
    const isWebActive = activeNode === "web_recon";
    const isSourceActive = activeNode === "source_recon";

    return [
      {
        id: "__start__",
        type: "custom",
        position: { x: 640, y: 30 },
        data: {
          label: "Trigger / Input Target",
          sublabel: "Target ingestion & auto-detect",
          iconName: "trigger",
          status: getNodeStatus("__start__"),
        },
      },
      {
        id: "router",
        type: "custom",
        position: { x: 640, y: 170 },
        data: {
          label: "Switch Router",
          sublabel: `Auto-route: ${mode} / target format`,
          iconName: "router",
          status: getNodeStatus("router"),
        },
      },
      {
        id: "binary_recon",
        type: "custom",
        position: { x: 0, y: 330 },
        data: {
          label: engineProfile === "fast-triage" ? "Tier 1: Capa + r2 Triage" : "Capa + Heavy Decompile",
          sublabel: isBinaryActive ? "Fast Triage & Capability Scan..." : "Mandiant Capa & r2 Fast Index",
          iconName: "capa",
          status: getNodeStatus("binary_recon"),
        },
      },
      {
        id: "mobile_recon",
        type: "custom",
        position: { x: 320, y: 330 },
        data: {
          label: "Mobile: Jadx APK Engine",
          sublabel: isMobileActive ? "Parsing Manifest & DEX..." : "Android APK & DEX Classes",
          iconName: "jadx",
          status: getNodeStatus("mobile_recon"),
        },
      },
      {
        id: "rea_recon",
        type: "custom",
        position: { x: 640, y: 330 },
        data: {
          label: "REA MCP Engine",
          sublabel: isReaActive ? "Active: Inspecting ASAR/JS..." : "Electron, ASAR & JS Bundles",
          iconName: "rea",
          status: getNodeStatus("rea_recon"),
        },
      },
      {
        id: "web_recon",
        type: "custom",
        position: { x: 960, y: 330 },
        data: {
          label: "Playwright MCP Recon",
          sublabel: isWebActive ? "Active: Browser Crawling..." : "DOM, Bundle & API Mapping",
          iconName: "playwright",
          status: getNodeStatus("web_recon"),
        },
      },
      {
        id: "source_recon",
        type: "custom",
        position: { x: 1280, y: 330 },
        data: {
          label: "Source AST Recon",
          sublabel: isSourceActive ? "Active: Scanning AST..." : "Directory & Module Analysis",
          iconName: "source",
          status: getNodeStatus("source_recon"),
        },
      },
      {
        id: "analyze",
        type: "custom",
        position: { x: 640, y: 500 },
        data: {
          label: "LLM Reasoning Node",
          sublabel: "Applies Markdown Skill & Evidence",
          iconName: "llm",
          status: getNodeStatus("analyze"),
        },
      },
      {
        id: "deep_dive",
        type: "custom",
        position: { x: 980, y: 500 },
        data: {
          label: "Deep Dive Loop",
          sublabel:
            activeNode === "deep_dive"
              ? "Targeted Symbol Decompilation..."
              : completedNodes.includes("deep_dive")
              ? "Multi-hop Evidence Refined"
              : "Targeted MCP Fetch (Ghidra/r2/Jadx)",
          iconName: "deep_dive",
          status: getNodeStatus("deep_dive"),
        },
      },
      {
        id: "report",
        type: "custom",
        position: { x: 640, y: 670 },
        data: {
          label: "Report Generator",
          sublabel: "Evidence Table & Reconstructed Code",
          iconName: "report",
          status: getNodeStatus("report"),
        },
      },
    ];
  }, [mode, activeNode, completedNodes, engineProfile]);

  const edges: Edge[] = useMemo(() => {
    const isBinary = mode === "binary";
    const isWeb = mode === "web";
    const isSource = mode === "source";

    const defaultStroke = "rgba(255, 255, 255, 0.32)";
    const defaultMarker = {
      type: MarkerType.ArrowClosed,
      color: "rgba(255, 255, 255, 0.45)",
      width: 14,
      height: 14,
    };

    const isReaActive = activeNode === "rea_recon" || completedNodes.includes("rea_recon");
    const isMobileActive = activeNode === "mobile_recon" || completedNodes.includes("mobile_recon");

    return [
      {
        id: "e-start-router",
        source: "__start__",
        target: "router",
        type: "custom",
        animated: activeNode === "__start__" || activeNode === "router",
        style: {
          stroke: activeNode === "__start__" || activeNode === "router" ? "rgba(255, 255, 255, 0.65)" : defaultStroke,
          strokeWidth: activeNode === "__start__" || activeNode === "router" ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "__start__" || activeNode === "router"
          ? { type: MarkerType.ArrowClosed, color: "rgba(255, 255, 255, 0.65)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-router-binary",
        source: "router",
        target: "binary_recon",
        type: "custom",
        animated: isBinary && (activeNode === "router" || activeNode === "binary_recon"),
        style: {
          stroke: isBinary ? "rgba(245, 158, 11, 0.9)" : "rgba(255, 255, 255, 0.08)",
          strokeWidth: isBinary ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: isBinary
          ? { type: MarkerType.ArrowClosed, color: "rgba(245, 158, 11, 0.9)", width: 14, height: 14 }
          : { ...defaultMarker, color: "rgba(255, 255, 255, 0.12)" },
      },
      {
        id: "e-router-mobile",
        source: "router",
        target: "mobile_recon",
        type: "custom",
        animated: isMobileActive,
        style: {
          stroke: isMobileActive ? "rgba(16, 185, 129, 0.9)" : "rgba(255, 255, 255, 0.08)",
          strokeWidth: isMobileActive ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: isMobileActive
          ? { type: MarkerType.ArrowClosed, color: "rgba(16, 185, 129, 0.9)", width: 14, height: 14 }
          : { ...defaultMarker, color: "rgba(255, 255, 255, 0.12)" },
      },
      {
        id: "e-router-rea",
        source: "router",
        target: "rea_recon",
        type: "custom",
        animated: isReaActive,
        style: {
          stroke: isReaActive ? "rgba(249, 115, 22, 0.9)" : "rgba(255, 255, 255, 0.08)",
          strokeWidth: isReaActive ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: isReaActive
          ? { type: MarkerType.ArrowClosed, color: "rgba(249, 115, 22, 0.9)", width: 14, height: 14 }
          : { ...defaultMarker, color: "rgba(255, 255, 255, 0.12)" },
      },
      {
        id: "e-router-web",
        source: "router",
        target: "web_recon",
        type: "custom",
        animated: isWeb && (activeNode === "router" || activeNode === "web_recon"),
        style: {
          stroke: isWeb ? "rgba(56, 189, 248, 0.9)" : "rgba(255, 255, 255, 0.08)",
          strokeWidth: isWeb ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: isWeb
          ? { type: MarkerType.ArrowClosed, color: "rgba(56, 189, 248, 0.9)", width: 14, height: 14 }
          : { ...defaultMarker, color: "rgba(255, 255, 255, 0.12)" },
      },
      {
        id: "e-router-source",
        source: "router",
        target: "source_recon",
        type: "custom",
        animated: isSource && (activeNode === "router" || activeNode === "source_recon"),
        style: {
          stroke: isSource ? "rgba(34, 197, 94, 0.9)" : "rgba(255, 255, 255, 0.08)",
          strokeWidth: isSource ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: isSource
          ? { type: MarkerType.ArrowClosed, color: "rgba(34, 197, 94, 0.9)", width: 14, height: 14 }
          : { ...defaultMarker, color: "rgba(255, 255, 255, 0.12)" },
      },
      {
        id: "e-binary-analyze",
        source: "binary_recon",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("binary_recon"),
        style: {
          stroke: activeNode === "analyze" && completedNodes.includes("binary_recon")
            ? "rgba(245, 158, 11, 0.85)"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("binary_recon") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("binary_recon")
          ? { type: MarkerType.ArrowClosed, color: "rgba(245, 158, 11, 0.85)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-mobile-analyze",
        source: "mobile_recon",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("mobile_recon"),
        style: {
          stroke: activeNode === "analyze" && completedNodes.includes("mobile_recon")
            ? "rgba(16, 185, 129, 0.85)"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("mobile_recon") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("mobile_recon")
          ? { type: MarkerType.ArrowClosed, color: "rgba(16, 185, 129, 0.85)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-rea-analyze",
        source: "rea_recon",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("rea_recon"),
        style: {
          stroke: activeNode === "analyze" && completedNodes.includes("rea_recon")
            ? "rgba(249, 115, 22, 0.85)"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("rea_recon") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("rea_recon")
          ? { type: MarkerType.ArrowClosed, color: "rgba(249, 115, 22, 0.85)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-web-analyze",
        source: "web_recon",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("web_recon"),
        style: {
          stroke: activeNode === "analyze" && completedNodes.includes("web_recon")
            ? "rgba(56, 189, 248, 0.85)"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("web_recon") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("web_recon")
          ? { type: MarkerType.ArrowClosed, color: "rgba(56, 189, 248, 0.85)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-source-analyze",
        source: "source_recon",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("source_recon"),
        style: {
          stroke: activeNode === "analyze" && completedNodes.includes("source_recon")
            ? "rgba(34, 197, 94, 0.85)"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("source_recon") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("source_recon")
          ? { type: MarkerType.ArrowClosed, color: "rgba(34, 197, 94, 0.85)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-analyze-deepdive",
        source: "analyze",
        target: "deep_dive",
        sourceHandle: "source-right",
        targetHandle: "target-left",
        type: "custom",
        animated: activeNode === "deep_dive",
        style: {
          stroke: activeNode === "deep_dive" || completedNodes.includes("deep_dive")
            ? "rgba(249, 115, 22, 0.9)"
            : defaultStroke,
          strokeWidth: activeNode === "deep_dive" || completedNodes.includes("deep_dive") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "deep_dive" || completedNodes.includes("deep_dive")
          ? { type: MarkerType.ArrowClosed, color: "rgba(249, 115, 22, 0.9)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-deepdive-analyze",
        source: "deep_dive",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("deep_dive"),
        style: {
          stroke: completedNodes.includes("deep_dive")
            ? "rgba(249, 115, 22, 0.9)"
            : defaultStroke,
          strokeWidth: 1.2,
          strokeDasharray: "4 4",
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: completedNodes.includes("deep_dive")
          ? { type: MarkerType.ArrowClosed, color: "rgba(249, 115, 22, 0.9)", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-analyze-report",
        source: "analyze",
        target: "report",
        type: "custom",
        animated: activeNode === "report" || completedNodes.includes("analyze"),
        style: {
          stroke: activeNode === "report" || completedNodes.includes("analyze")
            ? "rgba(34, 197, 94, 0.85)"
            : defaultStroke,
          strokeWidth: activeNode === "report" || completedNodes.includes("analyze") ? 1.5 : 1.2,
          vectorEffect: "non-scaling-stroke",
        },
        markerEnd: activeNode === "report" || completedNodes.includes("analyze")
          ? { type: MarkerType.ArrowClosed, color: "rgba(34, 197, 94, 0.85)", width: 14, height: 14 }
          : defaultMarker,
      },
    ];
  }, [mode, activeNode, completedNodes]);

  return (
    <div className="w-full h-full bg-[#0d0f15]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "custom",
        }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e2230" gap={24} size={1} />
        <Controls className="!bg-[#151722] !border-[#262a3a] !text-[#8b8f9e] !rounded-xl !shadow-xl [&>button]:!border-[#262a3a] hover:[&>button]:!bg-[#1e2230]" />
        <MiniMap
          nodeColor={(n) => {
            if (n.id === activeNode) return "#f97316";
            if (completedNodes.includes(n.id)) return "#22c55e";
            return "#232634";
          }}
          className="!bg-[#12141c] !border-[#232634] !rounded-xl overflow-hidden shadow-2xl"
          maskColor="rgba(10, 11, 16, 0.75)"
        />
      </ReactFlow>
    </div>
  );
};
