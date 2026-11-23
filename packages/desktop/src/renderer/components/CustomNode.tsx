import React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Cpu,
  Globe,
  FolderGit2,
  Sparkles,
  FileText,
  GitFork,
  PlayCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package,
  RefreshCw,
} from "lucide-react";
import { NodeData } from "../types";

export const CustomNode: React.FC<{ data: NodeData; isConnectable?: boolean }> = ({
  data,
  isConnectable = false,
}) => {
  const getIcon = () => {
    switch (data.iconName) {
      case "trigger":
        return <PlayCircle className="w-5 h-5 text-cyan-400" />;
      case "router":
        return <GitFork className="w-5 h-5 text-indigo-400" />;
      case "ghidra":
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case "rea":
        return <Package className="w-5 h-5 text-[#f97316]" />;
      case "playwright":
        return <Globe className="w-5 h-5 text-sky-400" />;
      case "source":
        return <FolderGit2 className="w-5 h-5 text-emerald-400" />;
      case "llm":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case "report":
        return <FileText className="w-5 h-5 text-rose-400" />;
      case "deep_dive":
        return <RefreshCw className={`w-5 h-5 text-[#f97316] ${data.status === "running" ? "animate-spin" : ""}`} />;
    }
  };

  const getStatusStyles = () => {
    switch (data.status) {
      case "running":
        return "border-[#f97316] bg-[#1a1410] shadow-lg shadow-[#f97316]/30 animate-pulse-glow ring-2 ring-[#f97316]/50";
      case "completed":
        return "border-[#22c55e]/80 bg-[#121c15] shadow-md shadow-[#22c55e]/10";
      case "error":
        return "border-rose-500 bg-[#1e1316] shadow-md shadow-rose-500/20";
      default:
        return "border-[#232734] bg-[#14161f] hover:border-[#38bdf8]/40";
    }
  };

  return (
    <div
      className={`relative px-4 py-3 rounded-xl border backdrop-blur-md min-w-[210px] transition-all duration-300 ${getStatusStyles()}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="!bg-[#33384a] !w-2.5 !h-2.5 !border-[#14161f]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        isConnectable={isConnectable}
        className="!bg-[#33384a] !w-2.5 !h-2.5 !border-[#14161f]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        isConnectable={isConnectable}
        className="!bg-[#33384a] !w-2.5 !h-2.5 !border-[#14161f]"
      />

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#181a24] border border-[#262a38] flex items-center justify-center shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-semibold text-[#f0f1f5] truncate">{data.label}</h4>
            {data.status === "running" && (
              <Loader2 className="w-3.5 h-3.5 text-[#f97316] animate-spin shrink-0" />
            )}
            {data.status === "completed" && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
            )}
            {data.status === "error" && (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-[#8b8f9e] truncate mt-0.5">{data.sublabel}</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="!bg-[#33384a] !w-2.5 !h-2.5 !border-[#14161f]"
      />
    </div>
  );
};
