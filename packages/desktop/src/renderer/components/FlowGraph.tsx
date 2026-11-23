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
import { TargetMode, NodeExecutionStatus } from "../types";

interface FlowGraphProps {
  mode: TargetMode;
  activeNode: string | null;
  completedNodes: string[];
}

const nodeTypes = {
  custom: CustomNode,
};

export const FlowGraph: React.FC<FlowGraphProps> = ({
  mode,
  activeNode,
  completedNodes,
}) => {
  const getNodeStatus = (nodeId: string): NodeExecutionStatus => {
    if (activeNode === nodeId) return "running";
    if (completedNodes.includes(nodeId)) return "completed";
    return "idle";
  };

  const nodes: Node[] = useMemo(() => {
    const isBinaryActive = activeNode === "binary_recon";
    const isReaActive = activeNode === "rea_recon";
    const isWebActive = activeNode === "web_recon";
    const isSourceActive = activeNode === "source_recon";

    return [
      {
        id: "__start__",
        type: "custom",
        position: { x: 390, y: 30 },
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
        position: { x: 390, y: 150 },
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
        position: { x: 20, y: 290 },
        data: {
          label: "Ghidra / REA Binary",
          sublabel: isBinaryActive ? "Running Native Decompilation..." : "Decompilation & Native Xrefs",
          iconName: "ghidra",
          status: getNodeStatus("binary_recon"),
        },
      },
      {
        id: "rea_recon",
        type: "custom",
        position: { x: 265, y: 290 },
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
        position: { x: 510, y: 290 },
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
        position: { x: 755, y: 290 },
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
        position: { x: 390, y: 440 },
        data: {
          label: "LLM Reasoning Node",
          sublabel: "Applies Markdown Skill & Evidence",
          iconName: "llm",
          status: getNodeStatus("analyze"),
        },
      },
      {
        id: "report",
        type: "custom",
        position: { x: 390, y: 570 },
        data: {
          label: "Report Generator",
          sublabel: "Evidence Table & Reconstructed Code",
          iconName: "report",
          status: getNodeStatus("report"),
        },
      },
    ];
  }, [mode, activeNode, completedNodes]);

  const edges: Edge[] = useMemo(() => {
    const isBinary = mode === "binary";
    const isWeb = mode === "web";
    const isSource = mode === "source";

    return [
      {
        id: "e-start-router",
        source: "__start__",
        target: "router",
        animated: activeNode === "__start__" || activeNode === "router",
        style: { stroke: "#64748b", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      },
      {
        id: "e-router-binary",
        source: "router",
        target: "binary_recon",
        animated: isBinary && (activeNode === "router" || activeNode === "binary_recon"),
        style: {
          stroke: isBinary ? "#f59e0b" : "#33384a",
          strokeWidth: isBinary ? 2.5 : 1,
          opacity: isBinary ? 1 : 0.4,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isBinary ? "#f59e0b" : "#33384a" },
      },
      {
        id: "e-router-rea",
        source: "router",
        target: "rea_recon",
        animated: activeNode === "router" || activeNode === "rea_recon",
        style: {
          stroke: activeNode === "rea_recon" || completedNodes.includes("rea_recon") ? "#f97316" : "#33384a",
          strokeWidth: 2,
          opacity: 0.8,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#f97316" },
      },
      {
        id: "e-router-web",
        source: "router",
        target: "web_recon",
        animated: isWeb && (activeNode === "router" || activeNode === "web_recon"),
        style: {
          stroke: isWeb ? "#38bdf8" : "#33384a",
          strokeWidth: isWeb ? 2.5 : 1,
          opacity: isWeb ? 1 : 0.4,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isWeb ? "#38bdf8" : "#33384a" },
      },
      {
        id: "e-router-source",
        source: "router",
        target: "source_recon",
        animated: isSource && (activeNode === "router" || activeNode === "source_recon"),
        style: {
          stroke: isSource ? "#22c55e" : "#33384a",
          strokeWidth: isSource ? 2.5 : 1,
          opacity: isSource ? 1 : 0.4,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSource ? "#22c55e" : "#33384a" },
      },
      {
        id: "e-binary-analyze",
        source: "binary_recon",
        target: "analyze",
        animated: activeNode === "analyze" && completedNodes.includes("binary_recon"),
        style: { stroke: "#64748b", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      },
      {
        id: "e-rea-analyze",
        source: "rea_recon",
        target: "analyze",
        animated: activeNode === "analyze" && completedNodes.includes("rea_recon"),
        style: { stroke: "#f97316", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#f97316" },
      },
      {
        id: "e-web-analyze",
        source: "web_recon",
        target: "analyze",
        animated: activeNode === "analyze" && completedNodes.includes("web_recon"),
        style: { stroke: "#64748b", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      },
      {
        id: "e-source-analyze",
        source: "source_recon",
        target: "analyze",
        animated: activeNode === "analyze" && completedNodes.includes("source_recon"),
        style: { stroke: "#64748b", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      },
      {
        id: "e-analyze-report",
        source: "analyze",
        target: "report",
        animated: activeNode === "report" || completedNodes.includes("analyze"),
        style: { stroke: "#64748b", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      },
    ];
  }, [mode, activeNode, completedNodes]);

  return (
    <div className="w-full h-full bg-[#0d0f15]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
