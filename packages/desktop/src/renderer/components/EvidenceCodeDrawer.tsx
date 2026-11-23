import React, { useState } from "react";
import {
  X,
  Cpu,
  Package,
  Globe,
  FileCode,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  CornerDownRight,
  GitBranch,
} from "lucide-react";
import { EvidenceItem } from "../types";

interface EvidenceCodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem | null;
  expandedCode?: string;
  onDeepDive?: (prompt: string) => void;
}

export const EvidenceCodeDrawer: React.FC<EvidenceCodeDrawerProps> = ({
  isOpen,
  onClose,
  evidence,
  expandedCode,
  onDeepDive,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !evidence) return null;

  const displayCode = expandedCode || evidence.snippet || "// No snippet available";
  const lines = displayCode.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeepDiveClick = () => {
    if (onDeepDive) {
      onDeepDive(`Детально разбери внутреннюю логику, структуры данных и xrefs для ${evidence.location}`);
      onClose();
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes(".exe") || s.includes(".elf") || s.includes("0x") || s.includes("sub_")) {
      return <Cpu className="w-4 h-4 text-amber-400" />;
    }
    if (s.includes(".asar") || s.includes("ipc") || s.includes("dist/") || s.includes("preload")) {
      return <Package className="w-4 h-4 text-[#f97316]" />;
    }
    if (s.includes("http") || s.includes("api") || s.includes("web")) {
      return <Globe className="w-4 h-4 text-sky-400" />;
    }
    return <FileCode className="w-4 h-4 text-emerald-400" />;
  };

  // Simulated cross references based on location
  const isBinarySymbol = evidence.location.startsWith("0x") || evidence.location.startsWith("sub_");
  const xrefsTo = isBinarySymbol
    ? ["main+0x42 (0x00401120)", "dispatch_worker_threads+0x8a"]
    : ["dist/renderer/assets/index.js", "dist/preload/index.js"];
  const xrefsFrom = isBinarySymbol
    ? ["validate_bounds(char*, size_t)", "malloc(size_t)", "crypto_transform_block()"]
    : ["ipcRenderer.invoke()", "contextBridge.exposeInMainWorld()"];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer */}
      <div className="relative ml-auto w-full max-w-xl bg-[#111319] border-l border-[#232734] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-[#20232f] flex items-center justify-between bg-[#14161f] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#1a1d28] border border-[#272b3b] flex items-center justify-center shrink-0">
              {getSourceIcon(evidence.source)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#f0f1f5] truncate">
                  Code & Evidence Inspector
                </h3>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                    evidence.confidence === "VERIFIED"
                      ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30"
                      : "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                  }`}
                >
                  {evidence.confidence}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#38bdf8] truncate mt-0.5">
                @ {evidence.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-[#8b8f9e] hover:text-[#f0f1f5] hover:bg-[#20232e] border border-transparent hover:border-[#2d3142] transition-colors cursor-pointer"
              title="Copy snippet"
            >
              {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8b8f9e] hover:text-[#f0f1f5] hover:bg-[#20232e] border border-transparent hover:border-[#2d3142] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata Card */}
          <div className="p-3.5 rounded-xl bg-[#141620] border border-[#242838] space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider font-semibold block">
              Provenance & Metadata
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#0e1015] border border-[#1e212b]">
                <span className="text-[#64748b] block text-[10px]">Source Target:</span>
                <span className="font-mono text-[#cbd5e1] truncate block text-[11px] mt-0.5" title={evidence.source}>
                  {evidence.source}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#0e1015] border border-[#1e212b]">
                <span className="text-[#64748b] block text-[10px]">Symbol / Location:</span>
                <span className="font-mono text-[#38bdf8] truncate block text-[11px] mt-0.5" title={evidence.location}>
                  {evidence.location}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Code Viewer */}
          <div className="rounded-xl bg-[#0b0d12] border border-[#222533] overflow-hidden shadow-inner flex flex-col">
            <div className="px-4 py-2 bg-[#13151d] border-b border-[#202330] flex items-center justify-between text-xs font-mono text-[#8b8f9e]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-[11px] text-[#94a3b8]">
                  {isBinarySymbol ? "Decompiled C Pseudocode (Ghidra)" : "Extracted JavaScript / IPC Handler"}
                </span>
              </div>
              <span className="text-[10px] text-[#555a6d]">{lines.length} lines</span>
            </div>

            <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[380px] overflow-y-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#161a26]/70 transition-colors ${
                        idx === 0 || line.includes("process") || line.includes("validate")
                          ? "bg-[#182030]/40"
                          : ""
                      }`}
                    >
                      <td className="w-10 pr-4 text-right text-[#475569] select-none text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="text-[#e2e8f0] whitespace-pre font-mono text-[11px]">
                        {line}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cross References (Xrefs) */}
          <div className="p-4 rounded-xl bg-[#141620] border border-[#242838] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f1f5]">
              <GitBranch className="w-4 h-4 text-[#f97316]" />
              <span>Cross References & Call Hierarchy</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#64748b] tracking-wider block mb-1">
                  Called By (Xrefs To):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {xrefsTo.map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#191c27] border border-[#272b3b] text-[11px] font-mono text-[#cbd5e1]"
                    >
                      <CornerDownRight className="w-3 h-3 text-[#38bdf8]" />
                      {ref}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1f2230]">
                <span className="text-[10px] font-mono uppercase text-[#64748b] tracking-wider block mb-1">
                  Calls Out To (Callees):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {xrefsFrom.map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#191c27] border border-[#272b3b] text-[11px] font-mono text-[#94a3b8]"
                    >
                      <CornerDownRight className="w-3 h-3 text-amber-400" />
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Action Bar */}
        <div className="p-4 border-t border-[#20232f] bg-[#14161f] shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-[#8b8f9e]">
            <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
            <span>Interactive Clean-Room Inspector</span>
          </div>

          <button
            onClick={handleDeepDiveClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white text-xs font-semibold shadow-lg shadow-[#f97316]/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
            <span>Deep Dive this Symbol</span>
          </button>
        </div>
      </div>
    </div>
  );
};
