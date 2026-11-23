import React from "react";
import { Cpu, Terminal, Shield, Sparkles, FolderGit2 } from "lucide-react";

interface HeaderProps {
  mode: string;
  isRunning: boolean;
  activeTab: "overview" | "flow" | "report";
  setActiveTab: (tab: "overview" | "flow" | "report") => void;
  hasReport: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  isRunning,
  activeTab,
  setActiveTab,
  hasReport,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0b1120] flex items-center justify-between px-6 select-none shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-100 text-base">DecompFlow</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold uppercase">
              Studio v0.1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Autonomous AI Reverse Engineering & Architecture Agent</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "overview"
              ? "bg-slate-800 text-cyan-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Control Panel
        </button>
        <button
          onClick={() => setActiveTab("flow")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "flow"
              ? "bg-slate-800 text-cyan-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Visual Graph</span>
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "report"
              ? "bg-slate-800 text-cyan-400 shadow-sm"
              : hasReport
              ? "text-emerald-400 hover:text-emerald-300"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          <span>Report</span>
          {hasReport && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
          <span className="text-slate-500">Mode:</span>
          <span className="text-slate-200 uppercase font-semibold">{mode}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            }`}
          />
          <span className="text-slate-400">{isRunning ? "Orchestrating..." : "Ready"}</span>
        </div>
      </div>
    </header>
  );
};
