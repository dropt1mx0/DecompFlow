import React, { useState } from "react";
import { PixelMascot } from "./PixelMascot";
import {
  CheckCircle2,
  Loader2,
  FileText,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Code,
  Copy,
  Check,
} from "lucide-react";
import { MessageItem, EvidenceItem } from "../types";

interface ChatStreamProps {
  messages: MessageItem[];
  isRunning: boolean;
  onOpenGraph: () => void;
  onOpenReport: () => void;
  onSelectEvidence?: (item: EvidenceItem) => void;
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  isRunning,
  onOpenGraph,
  onOpenReport,
  onSelectEvidence,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-3xl mx-auto w-full select-text font-sans">
      {messages.map((msg) => {
        if (msg.sender === "user") {
          return (
            <div key={msg.id} className="flex justify-end animate-in fade-in duration-200">
              <div className="max-w-xl bg-[#1d2028] border border-[#2d313f] rounded-2xl p-4 shadow-md text-sm text-[#f0f1f5] space-y-2">
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {(msg.target || msg.mode || msg.skill) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-[#8b8f9e]">
                    {msg.mode && (
                      <span className="px-2 py-0.5 rounded bg-[#131418] border border-[#262933] text-[#38bdf8] uppercase">
                        {msg.mode}
                      </span>
                    )}
                    {msg.skill && (
                      <span className="px-2 py-0.5 rounded bg-[#131418] border border-[#262933] text-[#f59e0b]">
                        ✦ {msg.skill}
                      </span>
                    )}
                    {msg.target && (
                      <span className="px-2 py-0.5 rounded bg-[#131418] border border-[#262933] text-[#8b8f9e] truncate max-w-[220px]">
                        {msg.target}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Agent message
        return (
          <div key={msg.id} className="flex items-start gap-3.5 animate-in fade-in duration-200">
            <div className="mt-1 shrink-0">
              <PixelMascot size={26} glow={true} />
            </div>

            <div className="flex-1 min-w-0 bg-[#181a20] border border-[#262933] rounded-2xl p-5 shadow-xl space-y-4">
              {/* Message Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#232630]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#f0f1f5]">DecompFlow Agent</span>
                  <span className="text-[10px] text-[#565a69] font-mono">{msg.timestamp}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenGraph}
                    className="flex items-center gap-1 text-[11px] text-[#38bdf8] hover:text-[#7dd3fc] font-medium transition-colors px-2 py-1 rounded-md hover:bg-[#20232c]"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>View Graph</span>
                  </button>

                  {msg.finalReport && (
                    <button
                      onClick={onOpenReport}
                      className="flex items-center gap-1 text-[11px] text-[#22c55e] hover:text-[#4ade80] font-medium transition-colors px-2 py-1 rounded-md hover:bg-[#20232c]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Node Stepper matching LangGraph nodes */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "start", label: "Target Ingestion", done: true },
                  {
                    id: "recon",
                    label:
                      msg.mode === "binary"
                        ? "Ghidra / REA MCP"
                        : msg.mode === "web"
                        ? "Playwright MCP"
                        : (msg.completedNodes || []).includes("rea_recon")
                        ? "REA ASAR Engine"
                        : "Source AST",
                    done: (msg.completedNodes || []).some((n) =>
                      ["binary_recon", "rea_recon", "web_recon", "source_recon"].includes(n)
                    ),
                    active: ["binary_recon", "rea_recon", "web_recon", "source_recon"].includes(
                      msg.activeNode || ""
                    ),
                  },
                  {
                    id: "analyze",
                    label: "LLM Reasoning",
                    done: (msg.completedNodes || []).includes("analyze"),
                    active: msg.activeNode === "analyze",
                  },
                  {
                    id: "report",
                    label: "Report Ready",
                    done: Boolean(msg.finalReport),
                    active: msg.activeNode === "report",
                  },
                ].map((step) => (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      step.active
                        ? "border-[#f97316] bg-[#221812] shadow-md shadow-[#f97316]/20 animate-pulse-glow"
                        : step.done
                        ? "border-[#22c55e]/40 bg-[#16211a]"
                        : "border-[#232630] bg-[#131418] opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#8b8f9e]">Step</span>
                      {step.active ? (
                        <Loader2 className="w-3 h-3 text-[#f97316] animate-spin" />
                      ) : step.done ? (
                        <CheckCircle2 className="w-3 h-3 text-[#22c55e]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#333745]" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#f0f1f5] truncate">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Body Text */}
              {msg.text && (
                <p className="text-xs text-[#8b8f9e] leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </p>
              )}

              {/* Key Architectural Findings */}
              {msg.findings && msg.findings.length > 0 && (
                <div className="bg-[#131418] border border-[#232630] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#38bdf8] tracking-wider font-semibold">
                    <Sparkles className="w-3 h-3 text-[#38bdf8]" />
                    <span>Discovered Architectural Modules</span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.findings.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#f0f1f5] leading-relaxed">
                        <span className="text-[#38bdf8] mt-0.5">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Evidence Block */}
              {msg.evidence && msg.evidence.length > 0 && (
                <div className="bg-[#131418] border border-[#232630] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#22c55e] tracking-wider font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Verified Evidence Chain (REA Provenance)</span>
                    </div>
                    <span className="text-[10px] text-[#565a69] font-mono">
                      {msg.evidence.length} verified item{msg.evidence.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {msg.evidence.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectEvidence && onSelectEvidence(item)}
                        className="p-2.5 rounded-lg bg-[#161820] border border-[#252834] hover:border-[#f97316]/70 hover:bg-[#1b1e2a] space-y-1.5 text-xs transition-all cursor-pointer group"
                        title="Click to inspect code, line numbers & cross references"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[#8b8f9e] group-hover:text-[#f0f1f5] text-[11px] truncate max-w-[280px] transition-colors">
                            {item.source}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#64748b] group-hover:text-[#f97316] transition-colors font-mono hidden sm:inline">
                              Inspect code →
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                                item.confidence === "VERIFIED"
                                  ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30"
                                  : "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                              }`}
                            >
                              {item.confidence}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-[#38bdf8] flex items-center justify-between">
                          <span>@ {item.location}</span>
                        </div>
                        <pre className="p-2 rounded bg-[#0f1115] border border-[#1e212b] group-hover:border-[#2d3244] text-[11px] font-mono text-[#cbd5e1] overflow-x-auto whitespace-pre-wrap leading-relaxed transition-colors">
                          {item.snippet}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reconstructed Implementation Block */}
              {msg.reconstructedCode && (
                <div className="bg-[#131418] border border-[#232630] rounded-xl overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#171922] border-b border-[#232630]">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-[#f0f1f5]">
                        Reconstructed Implementation
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#20232f] border border-[#2a2f40] text-amber-300 font-mono">
                        Clean TypeScript
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(msg.id, msg.reconstructedCode!)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#20232f] hover:bg-[#282d3d] border border-[#2a2f40] text-[11px] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#22c55e]" />
                          <span className="text-[#22c55e]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#8b8f9e]" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 text-xs font-mono text-[#e2e8f0] overflow-x-auto leading-relaxed bg-[#0e1014] max-h-96">
                    <code>{msg.reconstructedCode}</code>
                  </pre>
                </div>
              )}

              {/* Completed Report Link Card */}
              {msg.finalReport && (
                <div className="pt-2 flex items-center justify-between border-t border-[#232630]">
                  <div className="flex items-center gap-2 text-xs text-[#22c55e] font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Architectural report & Mermaid diagrams compiled</span>
                  </div>

                  <button
                    onClick={onOpenReport}
                    className="px-3.5 py-1.5 rounded-xl bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] border border-[#22c55e]/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>Read Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
