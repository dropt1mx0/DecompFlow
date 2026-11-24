import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Download, Copy, Check, FileText, Code2, ShieldCheck } from "lucide-react";
import { EvidenceItem, DetectedCapability } from "../types";

interface ReportViewerProps {
  reportMarkdown: string | null;
  onSave?: () => void;
  onSelectEvidence?: (item: EvidenceItem) => void;
  detectedCapabilities?: DetectedCapability[];
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportMarkdown,
  onSave,
  onSelectEvidence,
  detectedCapabilities,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#0f172a",
        primaryColor: "#f97316",
        primaryTextColor: "#f1f5f9",
        primaryBorderColor: "#334155",
        lineColor: "#94a3b8",
        secondaryColor: "#1e293b",
        tertiaryColor: "#0b1120",
      },
    });
  }, []);

  useEffect(() => {
    if (!reportMarkdown || !containerRef.current) return;

    // Render Mermaid diagrams inside the container
    const mermaidElements = containerRef.current.querySelectorAll(".mermaid-block");
    mermaidElements.forEach(async (el, index) => {
      const code = el.getAttribute("data-code");
      if (code) {
        try {
          const id = `mermaid-svg-${Date.now()}-${index}`;
          const { svg } = await mermaid.render(id, code);
          el.innerHTML = svg;
        } catch (err) {
          console.warn("Mermaid render error:", err);
        }
      }
    });
  }, [reportMarkdown]);

  const handleCopy = () => {
    if (reportMarkdown) {
      navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  if (!reportMarkdown) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#565a69] gap-3">
        <FileText className="w-12 h-12 stroke-[1.2] text-[#3d4251]" />
        <p className="text-sm">No analysis report generated yet.</p>
        <p className="text-xs text-[#565a69]">Run an analysis to view architectural documentation and evidence.</p>
      </div>
    );
  }

  // Parse markdown sections, code blocks, tables, and Mermaid
  const renderParsedContent = () => {
    const parts: React.ReactNode[] = [];
    const lines = reportMarkdown.split("\n");
    let inMermaid = false;
    let mermaidCode: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines: string[] = [];
    let textBuffer: string[] = [];

    const flushText = () => {
      if (textBuffer.length > 0) {
        const text = textBuffer.join("\n");
        parts.push(
          <div key={`text-${parts.length}`} className="prose prose-invert max-w-none text-[#cbd5e1] text-sm leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        );
        textBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Mermaid start
      if (line.trim().startsWith("```mermaid")) {
        flushText();
        inMermaid = true;
        mermaidCode = [];
        continue;
      }

      // Mermaid end
      if (inMermaid && line.trim().startsWith("```")) {
        inMermaid = false;
        const code = mermaidCode.join("\n");
        parts.push(
          <div
            key={`mermaid-${parts.length}`}
            className="my-5 p-4 rounded-xl bg-[#14161f] border border-[#232734] shadow-xl flex flex-col items-center overflow-x-auto"
          >
            <div className="text-[10px] font-mono text-[#f97316] uppercase tracking-widest self-start mb-2 font-semibold">
              ● Architecture Diagram
            </div>
            <div className="mermaid-block w-full flex justify-center py-2" data-code={code} />
          </div>
        );
        continue;
      }

      if (inMermaid) {
        mermaidCode.push(line);
        continue;
      }

      // Code block start (e.g. ```typescript, ```python, etc.)
      if (line.trim().startsWith("```") && !inCodeBlock) {
        flushText();
        inCodeBlock = true;
        codeLanguage = line.trim().replace(/^```/, "").trim() || "code";
        codeLines = [];
        continue;
      }

      // Code block end
      if (inCodeBlock && line.trim().startsWith("```")) {
        inCodeBlock = false;
        const fullCode = codeLines.join("\n");
        const blockId = `code-${parts.length}`;
        const isReconstructed = fullCode.includes("Reconstructed") || fullCode.includes("export class") || codeLanguage === "typescript";

        parts.push(
          <div
            key={blockId}
            className="my-5 rounded-xl bg-[#11131a] border border-[#242838] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-[#171a24] border-b border-[#232634]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#f97316]" />
                <span className="text-xs font-semibold text-[#f0f1f5]">
                  {isReconstructed ? "Reconstructed Implementation" : "Code Snippet"}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1f2330] text-[#94a3b8] border border-[#2b3042]">
                  {codeLanguage}
                </span>
              </div>

              <button
                onClick={() => handleCopySnippet(blockId, fullCode)}
                className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f0f1f5] px-2 py-1 rounded bg-[#1f2330] hover:bg-[#282d3e] border border-[#2c3144] transition-colors cursor-pointer"
              >
                {copiedSnippetId === blockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span className="text-[#22c55e]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-[#e2e8f0] overflow-x-auto leading-relaxed bg-[#0c0e14]">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Skip markdown header if rendered by custom badge block
      if (line.includes("## 🛡️ Detected Binary Capabilities")) {
        flushText();
        continue;
      }

      // Check if table header for Capa Triage Capabilities
      if (line.includes("| Capability | Namespace | Target Address | Confidence |")) {
        flushText();
        const tableLines = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith("|")) {
          tableLines.push(lines[j]);
          j++;
        }
        i = j - 1;

        const rows = tableLines.slice(2).map((r) =>
          r
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        const caps = rows.map((row) => ({
          capability: row[0]?.replace(/\*\*/g, "").trim() || "",
          namespace: row[1]?.replace(/`/g, "").trim() || "",
          address: row[2]?.replace(/`/g, "").trim() || "",
          confidence: row[3]?.replace(/\*\*/g, "").trim() || "VERIFIED",
        }));

        parts.push(
          <div key={`capa-table-${parts.length}`} className="my-5 rounded-xl bg-[#141824] border border-[#232d44] p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🛡️</span>
              <span className="text-xs font-bold text-[#f0f1f5]">Detected Binary Capabilities (Capa Triage)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 font-semibold">
                Fast Triage &lt; 1s
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {caps.map((cap, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => {
                    if (onSelectEvidence) {
                      onSelectEvidence({
                        source: cap.namespace,
                        location: cap.address,
                        snippet: `Identified ${cap.capability} at ${cap.address} (Namespace: ${cap.namespace}, Confidence: ${cap.confidence})`,
                        confidence: cap.confidence || "VERIFIED",
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222b40] border border-[#2b3752] hover:border-[#f97316]/60 transition-all cursor-pointer group shadow-sm text-xs"
                  title={`Click to inspect ${cap.address} in Drawer`}
                >
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#10131a] text-[#38bdf8] border border-[#242e44]">
                    {cap.namespace.split("/").pop() || cap.namespace}
                  </span>
                  <span className="font-semibold text-[#f0f1f5] group-hover:text-white">
                    {cap.capability}
                  </span>
                  <span className="text-[11px] font-mono text-[#f97316] group-hover:underline">
                    @{cap.address}
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-[#22c55e]/20 text-[#22c55e]">
                    {cap.confidence}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // Check if table header for Verified Evidence
      if (line.includes("| Source | Location | Evidence Snippet | Confidence |")) {
        flushText();
        // Read table lines
        const tableLines = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith("|")) {
          tableLines.push(lines[j]);
          j++;
        }
        i = j - 1;

        const rows = tableLines.slice(2).map((r) =>
          r
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        parts.push(
          <div key={`table-${parts.length}`} className="my-5 rounded-xl bg-[#12141c] border border-[#232734] overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#171a24] border-b border-[#232734]">
              <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
              <span className="text-xs font-bold text-[#f0f1f5]">Verified Evidence Chain</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#171922] text-[#8b8f9e] border-b border-[#232734] font-mono text-[11px]">
                  <tr>
                    <th className="px-4 py-2">Source</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Snippet</th>
                    <th className="px-4 py-2 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e212c]">
                  {rows.map((row, rIdx) => {
                    const item: EvidenceItem = {
                      source: row[0] || "",
                      location: row[1] || "",
                      snippet: row[2] || "",
                      confidence: row[3]?.replace(/\*\*/g, "").trim() || "VERIFIED",
                    };
                    return (
                      <tr
                        key={rIdx}
                        onClick={() => onSelectEvidence && onSelectEvidence(item)}
                        className="hover:bg-[#1a1d2b] transition-colors cursor-pointer group"
                        title="Click to inspect code & cross references in Drawer"
                      >
                        <td className="px-4 py-2.5 font-mono text-[#cbd5e1] max-w-[200px] truncate group-hover:text-white">
                          {row[0]}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[#38bdf8] group-hover:underline">
                          {row[1]}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[#94a3b8] max-w-[320px] truncate">
                          {row[2]}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row[3]?.includes("VERIFIED")
                                ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30"
                                : "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                            }`}
                          >
                            {row[3]?.replace(/\*\*/g, "") || "VERIFIED"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
        continue;
      }

      textBuffer.push(line);
    }

    flushText();
    return parts;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f1117]">
      {/* Report Action Toolbar */}
      <div className="h-12 border-b border-[#20232d] px-6 flex items-center justify-between shrink-0 bg-[#13141a]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#f97316]" />
          <span className="text-xs font-semibold text-[#f0f1f5]">DecompFlow Analysis & Evidence Report</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-[#181a22] border border-[#272b38] hover:border-[#38bdf8]/40 text-[#cbd5e1] hover:text-[#f0f1f5] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          {onSave && (
            <button
              onClick={onSave}
              className="px-2.5 py-1.5 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-[#f97316]/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Content Body */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-4 font-sans">{renderParsedContent()}</div>
      </div>
    </div>
  );
};
