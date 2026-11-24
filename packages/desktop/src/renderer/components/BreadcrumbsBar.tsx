import React, { useState, useRef, useEffect } from "react";
import {
  PanelLeft,
  ChevronRight,
  Folder,
  Github,
  MoreHorizontal,
  Layers,
  FileText,
  MessageSquare,
  Settings,
  Plus,
  Download,
  Trash2,
  X,
  FileCode,
  BookOpen,
} from "lucide-react";

interface BreadcrumbsBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName: string;
  sessionTitle: string;
  target: string;
  isRunning: boolean;
  activeView: "chat" | "graph" | "report";
  setActiveView: (view: "chat" | "graph" | "report") => void;
  hasReport: boolean;
  onSelectTarget: () => void;
  onClearTarget: () => void;
  onOpenSettings: () => void;
  onOpenDocumentation?: () => void;
  onNewSession: () => void;
  onSaveReport?: () => void;
  onClearChat?: () => void;
  onDeleteSession?: () => void;
}

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  projectName,
  sessionTitle,
  target,
  isRunning,
  activeView,
  setActiveView,
  hasReport,
  onSelectTarget,
  onClearTarget,
  onOpenSettings,
  onOpenDocumentation,
  onNewSession,
  onSaveReport,
  onClearChat,
  onDeleteSession,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const targetBasename = target
    ? target.split("/").filter(Boolean).pop() || target
    : "No target selected";

  const handleOpenGithub = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal("https://github.com");
    } else {
      window.open("https://github.com", "_blank");
    }
  };

  const isMac =
    typeof navigator !== "undefined" &&
    (navigator.platform?.toLowerCase().includes("mac") ||
      navigator.userAgent.toLowerCase().includes("mac"));

  const isWindows =
    typeof navigator !== "undefined" &&
    (navigator.platform?.toLowerCase().includes("win") ||
      navigator.userAgent.toLowerCase().includes("windows"));

  return (
    <div
      className={`h-12 bg-[#131418] border-b border-[#1c1e26] flex items-center justify-between select-none shrink-0 z-30 font-sans titlebar-drag ${
        isMac ? "pl-20 pr-4" : isWindows ? "pl-4 pr-36" : "px-4"
      }`}
    >
      {/* Left: Sidebar Toggle + Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0 titlebar-no-drag">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#8b8f9e] hover:text-[#f0f1f5] hover:bg-[#181a20] transition-colors shrink-0 cursor-pointer"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-xs truncate">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" />
          <span className="font-semibold text-[#f0f1f5] truncate">{projectName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#565a69] shrink-0" />
          <span className="text-[#8b8f9e] font-medium truncate max-w-[220px]">
            {sessionTitle || "New chat"}
          </span>
        </div>
      </div>

      {/* Center: View Switcher (Chat | Visual Graph | Report) */}
      <div className="flex items-center gap-1 bg-[#181a20] p-1 rounded-xl border border-[#232630] titlebar-no-drag">
        <button
          onClick={() => setActiveView("chat")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeView === "chat"
              ? "bg-[#242834] text-[#38bdf8] shadow-sm font-semibold"
              : "text-[#8b8f9e] hover:text-[#f0f1f5]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveView("graph")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeView === "graph"
              ? "bg-[#242834] text-[#38bdf8] shadow-sm font-semibold"
              : "text-[#8b8f9e] hover:text-[#f0f1f5]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Visual Graph</span>
          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />}
        </button>

        <button
          onClick={() => setActiveView("report")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeView === "report"
              ? "bg-[#242834] text-[#38bdf8] shadow-sm font-semibold"
              : hasReport
              ? "text-[#22c55e] hover:text-[#4ade80]"
              : "text-[#565a69] hover:text-[#8b8f9e]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Report</span>
          {hasReport && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
        </button>
      </div>

      {/* Right: Actions & Pills */}
      <div className="flex items-center gap-2 relative titlebar-no-drag" ref={menuRef}>
        {/* GitHub Button */}
        <button
          onClick={handleOpenGithub}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a20] hover:bg-[#20232b] text-xs text-[#8b8f9e] hover:text-[#f0f1f5] border border-[#232630] transition-colors cursor-pointer"
        >
          <Github className="w-3.5 h-3.5 text-[#8b8f9e]" />
          <span>GitHub</span>
        </button>

        {/* Real Target Folder/File Pill */}
        <div className="flex items-center bg-[#181a20] border border-[#232630] rounded-lg text-xs font-mono group">
          <button
            onClick={onSelectTarget}
            title={target ? `Target: ${target} (Click to change)` : "Click to select binary or source"}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[#8b8f9e] hover:text-[#f0f1f5] transition-colors cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="truncate max-w-[130px]">{targetBasename}</span>
          </button>
          {target && (
            <button
              onClick={onClearTarget}
              title="Clear target"
              className="px-1.5 py-1 text-[#565a69] hover:text-rose-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a20] text-xs border border-[#232630]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? "bg-[#f59e0b] animate-pulse" : "bg-[#f97316]"
            }`}
          />
          <span className={isRunning ? "text-[#f0f1f5] font-medium" : "text-[#f97316] font-medium"}>
            {isRunning ? "Orchestrating..." : "dropt1m"}
          </span>
        </div>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-[#181a20] text-[#565a69] hover:text-[#f0f1f5] transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {moreMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#181a20] border border-[#2d313e] rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => {
                  onNewSession();
                  setMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#f0f1f5] text-left transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>New Chat</span>
              </button>

              {hasReport && onSaveReport && (
                <button
                  onClick={() => {
                    onSaveReport();
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#22c55e] text-left transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>Export Report (.md)</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenSettings();
                  setMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#f0f1f5] text-left transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>

              {onOpenDocumentation && (
                <button
                  onClick={() => {
                    onOpenDocumentation();
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#38bdf8] text-left transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Docs & Guide</span>
                </button>
              )}

              {onClearChat && (
                <button
                  onClick={() => {
                    onClearChat();
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#8b8f9e] hover:bg-[#20232c] hover:text-amber-400 text-left transition-colors border-t border-[#232630] mt-0.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Chat</span>
                </button>
              )}

              {onDeleteSession && (
                <button
                  onClick={() => {
                    onDeleteSession();
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 text-left transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Session</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
