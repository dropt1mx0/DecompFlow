import React, { useState, useRef, useEffect, DragEvent } from "react";
import {
  ArrowUp,
  Sparkles,
  ChevronDown,
  FolderOpen,
  Cpu,
  Globe,
  FolderGit2,
  Square,
  UploadCloud,
  X,
} from "lucide-react";
import { TargetMode } from "../types";

interface FloatingInputBarProps {
  promptText: string;
  setPromptText: (text: string) => void;
  target: string;
  setTarget: (target: string) => void;
  mode: TargetMode;
  setMode: (mode: TargetMode) => void;
  skill: string;
  setSkill: (skill: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isRunning: boolean;
  availableSkills: string[];
  sessionContextChars?: number;
  onSelectTarget: () => void;
  onClearTarget: () => void;
}

export const FloatingInputBar: React.FC<FloatingInputBarProps> = ({
  promptText,
  setPromptText,
  target,
  setTarget,
  mode,
  setMode,
  skill,
  setSkill,
  onSend,
  onStop,
  isRunning,
  availableSkills,
  sessionContextChars = 0,
  onSelectTarget,
  onClearTarget,
}) => {
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSkillMenuOpen(false);
        setModeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [promptText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isRunning) {
        onSend();
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const filePath = (file as any).path || file.name;
      setTarget(filePath);

      if (
        filePath.endsWith(".exe") ||
        filePath.endsWith(".bin") ||
        filePath.endsWith(".so") ||
        filePath.endsWith(".elf") ||
        !filePath.includes(".")
      ) {
        setMode("binary");
        setSkill("binary-architecture");
      } else if (
        filePath.endsWith(".js") ||
        filePath.endsWith(".ts") ||
        filePath.endsWith(".c") ||
        filePath.endsWith(".cpp") ||
        filePath.endsWith(".py")
      ) {
        setMode("source");
        setSkill("code-cleanup");
      }
    }
  };

  // Dynamic token calculation based on input + target + message history
  const totalChars = promptText.length + target.length + sessionContextChars;
  const approxTokens = Math.max(8, Math.round(totalChars / 3.8));
  const maxTokens = 256000;
  const percentUsed = Math.min(100, Math.max(1, (approxTokens / maxTokens) * 100));

  const targetBasename = target
    ? target.split("/").filter(Boolean).pop() || target
    : "No target";

  return (
    <div
      ref={containerRef}
      className="w-full max-w-3xl mx-auto px-4 pb-4 select-none shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Floating Card Container */}
      <div
        className={`relative bg-[#181a20] rounded-2xl border transition-all shadow-xl shadow-black/50 ${
          isDragOver
            ? "border-[#38bdf8] bg-[#1a202c] shadow-[0_0_25px_rgba(56,189,248,0.25)]"
            : "border-[#262933] focus-within:border-[#38bdf8]/60 focus-within:ring-1 focus-within:ring-[#38bdf8]/30"
        }`}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-semibold text-[#38bdf8]">
            <UploadCloud className="w-5 h-5 animate-bounce" />
            <span>Drop file or folder here to set target</span>
          </div>
        )}

        {/* Text Input Area */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "web"
                ? "Enter target URL (e.g. https://example.com) or inspection task..."
                : mode === "binary"
                ? "Ask to decompile functions, map xrefs, or reconstruct binary architecture..."
                : "Ask to audit security, analyze repository architecture, or clean up code..."
            }
            className="w-full bg-transparent text-sm text-[#f0f1f5] placeholder-[#565a69] resize-none border-none outline-none font-sans leading-relaxed min-h-[28px] max-h-36"
          />
        </div>

        {/* Toolbar Inside the Box */}
        <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
          {/* Left Controls: Target Pill + Skill Selector + Mode Selector */}
          <div className="flex items-center gap-2 relative">
            {/* Target Path Pill */}
            <div className="flex items-center bg-[#20232c] border border-[#2d313e] rounded-lg text-xs font-mono group">
              <button
                type="button"
                onClick={onSelectTarget}
                title={target ? `Target: ${target} (Click to change)` : "Click to select target file/folder"}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[#8b8f9e] hover:text-[#f0f1f5] transition-colors cursor-pointer"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    target ? "bg-[#22c55e]" : "bg-[#565a69]"
                  }`}
                />
                <span className="truncate max-w-[120px]">{targetBasename}</span>
              </button>
              {target && (
                <button
                  type="button"
                  onClick={onClearTarget}
                  title="Clear target"
                  className="px-1.5 py-1 text-[#565a69] hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Skill Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSkillMenuOpen(!skillMenuOpen);
                  setModeMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#20232c] hover:bg-[#282c38] text-xs text-[#f59e0b] border border-[#2d313e] transition-colors font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span className="truncate max-w-[130px]">{skill}</span>
                <ChevronDown className="w-3 h-3 text-[#8b8f9e]" />
              </button>

              {skillMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#181a20] border border-[#2d313e] rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#565a69] px-2 py-1">
                    Select Analysis Skill
                  </div>
                  {availableSkills.map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => {
                        setSkill(sk);
                        setSkillMenuOpen(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        skill === sk
                          ? "bg-[#282c38] text-[#f59e0b] font-medium"
                          : "text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#f0f1f5]"
                      }`}
                    >
                      <span className="truncate">{sk}</span>
                      {skill === sk && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mode Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setModeMenuOpen(!modeMenuOpen);
                  setSkillMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#20232c] hover:bg-[#282c38] text-xs text-[#8b8f9e] hover:text-[#f0f1f5] border border-[#2d313e] transition-colors capitalize font-medium cursor-pointer"
              >
                {mode === "binary" && <Cpu className="w-3 h-3 text-amber-400" />}
                {mode === "web" && <Globe className="w-3 h-3 text-sky-400" />}
                {mode === "source" && <FolderGit2 className="w-3 h-3 text-emerald-400" />}
                <span>{mode}</span>
                <ChevronDown className="w-3 h-3 text-[#565a69]" />
              </button>

              {modeMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-[#181a20] border border-[#2d313e] rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {(["binary", "web", "source"] as TargetMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setModeMenuOpen(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs capitalize transition-colors flex items-center gap-2 cursor-pointer ${
                        mode === m
                          ? "bg-[#282c38] text-[#38bdf8] font-medium"
                          : "text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#f0f1f5]"
                      }`}
                    >
                      {m === "binary" && <Cpu className="w-3 h-3 text-amber-400" />}
                      {m === "web" && <Globe className="w-3 h-3 text-sky-400" />}
                      {m === "source" && <FolderGit2 className="w-3 h-3 text-emerald-400" />}
                      <span>{m} Mode</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Token usage + Send/Stop button */}
          <div className="flex items-center gap-3">
            {/* Dynamic Context Meter */}
            <div
              title={`${approxTokens} tokens used / 256,000 max context window`}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[#565a69]"
            >
              <span>{approxTokens >= 1000 ? `${(approxTokens / 1000).toFixed(1)}k` : approxTokens}</span>
              <span>/</span>
              <span>256k</span>
              <div className="w-12 h-1 bg-[#262933] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#38bdf8] transition-all duration-300"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>

            {/* Send / Stop Button with AbortController */}
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-transform active:scale-90 shadow-md shadow-rose-500/30 cursor-pointer"
                title="Stop Analysis Execution"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!target.trim() && !promptText.trim()}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  target.trim() || promptText.trim()
                    ? "bg-[#f0f1f5] hover:bg-white text-[#131418] shadow-md shadow-white/20 active:scale-90 cursor-pointer"
                    : "bg-[#262933] text-[#565a69] cursor-not-allowed"
                }`}
                title="Launch DecompFlow Analysis (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar Hints */}
      <div className="flex items-center justify-between text-[11px] text-[#565a69] px-2 mt-2 font-sans">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#f59e0b]" />
          <span>skill: {skill}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-[#181a20] border border-[#262933] text-[10px]">Enter</span>
          <span>send</span>
          <span className="px-1.5 py-0.5 rounded bg-[#181a20] border border-[#262933] text-[10px] ml-1">Shift+Enter</span>
          <span>line</span>
        </div>
      </div>
    </div>
  );
};
