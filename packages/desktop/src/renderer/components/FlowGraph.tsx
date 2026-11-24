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
import { useI18n } from "../i18n";

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
  const { language } = useI18n();
  const isRu = language === "ru";

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
          label: isRu ? "Вход / Целевой объект" : "Trigger / Input Target",
          sublabel: isRu ? "Загрузка и авто-определение" : "Target ingestion & auto-detect",
          iconName: "trigger",
          status: getNodeStatus("__start__"),
        },
      },
      {
        id: "router",
        type: "custom",
        position: { x: 640, y: 170 },
        data: {
          label: isRu ? "Маршрутизатор LangGraph" : "Switch Router",
          sublabel: isRu ? `Авто-выбор: ${mode} / формат цели` : `Auto-route: ${mode} / target format`,
          iconName: "router",
          status: getNodeStatus("router"),
        },
      },
      {
        id: "binary_recon",
        type: "custom",
        position: { x: 0, y: 330 },
        data: {
          label: engineProfile === "fast-triage"
            ? (isRu ? "Tier 1: Capa + r2 Триаж" : "Tier 1: Capa + r2 Triage")
            : (isRu ? "Capa + Ghidra Декомпиляция" : "Capa + Heavy Decompile"),
          sublabel: isBinaryActive
            ? (isRu ? "Быстрый триаж и анализ возможностей..." : "Fast Triage & Capability Scan...")
            : (isRu ? "Эвристика Mandiant Capa и r2" : "Mandiant Capa & r2 Fast Index"),
          iconName: "capa",
          status: getNodeStatus("binary_recon"),
        },
      },
      {
        id: "mobile_recon",
        type: "custom",
        position: { x: 320, y: 330 },
        data: {
          label: isRu ? "Mobile: Jadx APK Движок" : "Mobile: Jadx APK Engine",
          sublabel: isMobileActive
            ? (isRu ? "Парсинг Manifest и DEX классов..." : "Parsing Manifest & DEX...")
            : (isRu ? "Android APK и DEX классы" : "Android APK & DEX Classes"),
          iconName: "jadx",
          status: getNodeStatus("mobile_recon"),
        },
      },
      {
        id: "rea_recon",
        type: "custom",
        position: { x: 640, y: 330 },
        data: {
          label: isRu ? "REA MCP Мост" : "REA MCP Engine",
          sublabel: isReaActive
            ? (isRu ? "Интроспекция ASAR и JS бандлов..." : "Active: Inspecting ASAR/JS...")
            : (isRu ? "Electron, ASAR и JS бандлы" : "Electron, ASAR & JS Bundles"),
          iconName: "rea",
          status: getNodeStatus("rea_recon"),
        },
      },
      {
        id: "web_recon",
        type: "custom",
        position: { x: 960, y: 330 },
        data: {
          label: isRu ? "Playwright Web Агент" : "Playwright MCP Recon",
          sublabel: isWebActive
            ? (isRu ? "Браузерный аудит и картографирование..." : "Active: Browser Crawling...")
            : (isRu ? "DOM, бандлы и скрытые API" : "DOM, Bundle & API Mapping"),
          iconName: "playwright",
          status: getNodeStatus("web_recon"),
        },
      },
      {
        id: "source_recon",
        type: "custom",
        position: { x: 1280, y: 330 },
        data: {
          label: isRu ? "AST Анализ исходников" : "Source AST Recon",
          sublabel: isSourceActive
            ? (isRu ? "Сканирование дерева модулей..." : "Active: Scanning AST...")
            : (isRu ? "Синтаксис, импорты и зависимости" : "Directory & Module Analysis"),
          iconName: "source",
          status: getNodeStatus("source_recon"),
        },
      },
      {
        id: "analyze",
        type: "custom",
        position: { x: 640, y: 500 },
        data: {
          label: isRu ? "Узел LLM-рассуждений" : "LLM Reasoning Node",
          sublabel: isRu ? "Анализ по скиллам и сбор доказательств" : "Applies Markdown Skill & Evidence",
          iconName: "llm",
          status: getNodeStatus("analyze"),
        },
      },
      {
        id: "deep_dive",
        type: "custom",
        position: { x: 980, y: 500 },
        data: {
          label: isRu ? "Цикл Deep Dive" : "Deep Dive Loop",
          sublabel:
            activeNode === "deep_dive"
              ? (isRu ? "Декомпиляция целевого символа..." : "Targeted Symbol Decompilation...")
              : completedNodes.includes("deep_dive")
              ? (isRu ? "Доказательства Multi-hop собраны" : "Multi-hop Evidence Refined")
              : (isRu ? "Точечный вызов MCP (Ghidra/Jadx)" : "Targeted MCP Fetch (Ghidra/r2/Jadx)"),
          iconName: "deep_dive",
          status: getNodeStatus("deep_dive"),
        },
      },
      {
        id: "report",
        type: "custom",
        position: { x: 640, y: 670 },
        data: {
          label: isRu ? "Генератор отчета" : "Report Generator",
          sublabel: isRu ? "Таблица доказательств и код фичи" : "Evidence Table & Reconstructed Code",
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

    const defaultStroke = "#64748b";
    const inactiveStroke = "#252836";
    const defaultMarker = {
      type: MarkerType.ArrowClosed,
      color: "#64748b",
      width: 14,
      height: 14,
    };
    const inactiveMarker = {
      type: MarkerType.ArrowClosed,
      color: "#252836",
      width: 12,
      height: 12,
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
          stroke: activeNode === "__start__" || activeNode === "router" ? "#38bdf8" : defaultStroke,
          strokeWidth: activeNode === "__start__" || activeNode === "router" ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "__start__" || activeNode === "router"
          ? { type: MarkerType.ArrowClosed, color: "#38bdf8", width: 14, height: 14 }
          : defaultMarker,
      },
      {
        id: "e-router-binary",
        source: "router",
        target: "binary_recon",
        type: "custom",
        animated: isBinary && (activeNode === "router" || activeNode === "binary_recon"),
        style: {
          stroke: isBinary ? "#f59e0b" : inactiveStroke,
          strokeWidth: isBinary ? 2.2 : 1.5,
        },
        markerEnd: isBinary
          ? { type: MarkerType.ArrowClosed, color: "#f59e0b", width: 14, height: 14 }
          : inactiveMarker,
      },
      {
        id: "e-router-mobile",
        source: "router",
        target: "mobile_recon",
        type: "custom",
        animated: isMobileActive,
        style: {
          stroke: isMobileActive ? "#10b981" : inactiveStroke,
          strokeWidth: isMobileActive ? 2.2 : 1.5,
        },
        markerEnd: isMobileActive
          ? { type: MarkerType.ArrowClosed, color: "#10b981", width: 14, height: 14 }
          : inactiveMarker,
      },
      {
        id: "e-router-rea",
        source: "router",
        target: "rea_recon",
        type: "custom",
        animated: isReaActive,
        style: {
          stroke: isReaActive ? "#f97316" : inactiveStroke,
          strokeWidth: isReaActive ? 2.2 : 1.5,
        },
        markerEnd: isReaActive
          ? { type: MarkerType.ArrowClosed, color: "#f97316", width: 14, height: 14 }
          : inactiveMarker,
      },
      {
        id: "e-router-web",
        source: "router",
        target: "web_recon",
        type: "custom",
        animated: isWeb && (activeNode === "router" || activeNode === "web_recon"),
        style: {
          stroke: isWeb ? "#38bdf8" : inactiveStroke,
          strokeWidth: isWeb ? 2.2 : 1.5,
        },
        markerEnd: isWeb
          ? { type: MarkerType.ArrowClosed, color: "#38bdf8", width: 14, height: 14 }
          : inactiveMarker,
      },
      {
        id: "e-router-source",
        source: "router",
        target: "source_recon",
        type: "custom",
        animated: isSource && (activeNode === "router" || activeNode === "source_recon"),
        style: {
          stroke: isSource ? "#22c55e" : inactiveStroke,
          strokeWidth: isSource ? 2.2 : 1.5,
        },
        markerEnd: isSource
          ? { type: MarkerType.ArrowClosed, color: "#22c55e", width: 14, height: 14 }
          : inactiveMarker,
      },
      {
        id: "e-binary-analyze",
        source: "binary_recon",
        target: "analyze",
        type: "custom",
        animated: activeNode === "analyze" && completedNodes.includes("binary_recon"),
        style: {
          stroke: activeNode === "analyze" && completedNodes.includes("binary_recon")
            ? "#f59e0b"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("binary_recon") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("binary_recon")
          ? { type: MarkerType.ArrowClosed, color: "#f59e0b", width: 14, height: 14 }
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
            ? "#10b981"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("mobile_recon") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("mobile_recon")
          ? { type: MarkerType.ArrowClosed, color: "#10b981", width: 14, height: 14 }
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
            ? "#f97316"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("rea_recon") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("rea_recon")
          ? { type: MarkerType.ArrowClosed, color: "#f97316", width: 14, height: 14 }
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
            ? "#38bdf8"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("web_recon") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("web_recon")
          ? { type: MarkerType.ArrowClosed, color: "#38bdf8", width: 14, height: 14 }
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
            ? "#22c55e"
            : defaultStroke,
          strokeWidth: activeNode === "analyze" && completedNodes.includes("source_recon") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "analyze" && completedNodes.includes("source_recon")
          ? { type: MarkerType.ArrowClosed, color: "#22c55e", width: 14, height: 14 }
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
            ? "#f97316"
            : defaultStroke,
          strokeWidth: activeNode === "deep_dive" || completedNodes.includes("deep_dive") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "deep_dive" || completedNodes.includes("deep_dive")
          ? { type: MarkerType.ArrowClosed, color: "#f97316", width: 14, height: 14 }
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
            ? "#f97316"
            : defaultStroke,
          strokeWidth: 1.8,
          strokeDasharray: "5 4",
        },
        markerEnd: completedNodes.includes("deep_dive")
          ? { type: MarkerType.ArrowClosed, color: "#f97316", width: 14, height: 14 }
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
            ? "#22c55e"
            : defaultStroke,
          strokeWidth: activeNode === "report" || completedNodes.includes("analyze") ? 2.2 : 1.8,
        },
        markerEnd: activeNode === "report" || completedNodes.includes("analyze")
          ? { type: MarkerType.ArrowClosed, color: "#22c55e", width: 14, height: 14 }
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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
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
