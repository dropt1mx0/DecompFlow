import React, { useState, useEffect, DragEvent } from "react";
import {
  Cpu,
  Globe,
  FolderGit2,
  FileCode,
  UploadCloud,
  Play,
  Loader2,
  FolderOpen,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { TargetMode } from "../types";

interface LaunchPanelProps {
  target: string;
  setTarget: (target: string) => void;
  mode: TargetMode;
  setMode: (mode: TargetMode) => void;
  skill: string;
  setSkill: (skill: string) => void;
  onLaunch: () => void;
  isRunning: boolean;
  error: string | null;
}

export const LaunchPanel: React.FC<LaunchPanelProps> = ({
  target,
  setTarget,
  mode,
  setMode,
  skill,
  setSkill,
  onLaunch,
  isRunning,
  error,
}) => {
  const [availableSkills, setAvailableSkills] = useState<string[]>([
    "binary-architecture",
    "code-cleanup",
    "security-audit",
  ]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAvailableSkills().then((skills) => {
        if (skills && skills.length > 0) {
          setAvailableSkills(skills);
        }
      });
    }
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const filePath = (file as any).path || file.name;
      setTarget(filePath);

      // Auto-detect mode if reasonable
      if (filePath.endsWith(".exe") || filePath.endsWith(".bin") || filePath.endsWith(".so") || filePath.endsWith(".elf") || !filePath.includes(".")) {
        setMode("binary");
      } else if (filePath.endsWith(".js") || filePath.endsWith(".ts") || filePath.endsWith(".c") || filePath.endsWith(".cpp") || filePath.endsWith(".py")) {
        setMode("source");
      }
    }
  };

  const handleBrowse = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectTargetFile();
      if (selected) {
        setTarget(selected);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 p-6">
      {/* Target Mode Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
          1. Select Environment Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMode("binary")}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
              mode === "binary"
                ? "bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold">Binary Analysis</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Ghidra MCP</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("web")}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
              mode === "web"
                ? "bg-sky-500/10 border-sky-500 text-sky-300 shadow-lg shadow-sky-500/10"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <Globe className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold">Web Inspection</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Playwright MCP</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("source")}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
              mode === "source"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <FolderGit2 className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-semibold">Source / AST</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Architecture AST</span>
          </button>
        </div>
      </div>

      {/* Target Input & Drag/Drop */}
      <div>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
          2. Target Target (File, Directory, or URL)
        </label>

        {mode === "web" ? (
          <div className="relative">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="https://example.com or http://localhost:8080"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowse}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/20"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                Drag & drop binary, file or folder here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">or click to browse local filesystem</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="./samples/sample_bin or /path/to/code"
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Browse</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modular Skill Selection */}
      <div>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center justify-between">
          <span>3. Modular Analysis Skill</span>
          <span className="text-[11px] text-slate-500 normal-case font-normal">Stored in skills/*.md</span>
        </label>
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
        >
          {availableSkills.map((sk) => (
            <option key={sk} value={sk}>
              {sk}.md
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Launch CTA */}
      <button
        type="button"
        disabled={!target.trim() || isRunning}
        onClick={onLaunch}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
          isRunning
            ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
            : !target.trim()
            ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
            : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 active:scale-[0.99]"
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Orchestrating LangGraph Pipeline...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Launch DecompFlow Analysis</span>
          </>
        )}
      </button>
    </div>
  );
};
