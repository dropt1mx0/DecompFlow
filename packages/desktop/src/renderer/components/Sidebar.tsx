import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Folder,
  ChevronDown,
  ChevronRight,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  FolderPlus,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useI18n } from "../i18n";
import { PixelMascot } from "./PixelMascot";
import { ProjectItem, SessionItem } from "../types";

interface SidebarProps {
  isOpen: boolean;
  username?: string;
  projects: ProjectItem[];
  activeProjectId: string;
  activeSessionId: string | null;
  onSelectProject: (projectId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onNewProject: () => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenSettings: () => void;
  onOpenDocumentation?: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
  return `${Math.floor(diffSec / 604800)}w`;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  username,
  projects,
  activeProjectId,
  activeSessionId,
  onSelectProject,
  onSelectSession,
  onNewSession,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onRenameSession,
  onDeleteSession,
  onOpenSettings,
  onOpenDocumentation,
}) => {
  const { l } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  // In-line editing state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMac =
    typeof navigator !== "undefined" &&
    (navigator.platform.toUpperCase().includes("MAC") ||
      navigator.userAgent.toUpperCase().includes("MAC"));
  const kShortcut = isMac ? "⌘K" : "Ctrl K";
  const nShortcut = isMac ? "⌘N" : "Ctrl N";

  // Global Ctrl+K / Cmd+K and Ctrl+N / Cmd+N listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (isModifier && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewSession();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMac, onNewSession]);

  if (!isOpen) return null;

  const toggleProjectCollapse = (id: string) => {
    setCollapsedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalSessions = projects.reduce((acc, p) => acc + p.sessions.length, 0);

  // Filter projects & sessions
  const query = searchQuery.trim().toLowerCase();
  const filteredProjects = projects
    .map((p) => {
      const matchesProject = p.name.toLowerCase().includes(query) || p.path.toLowerCase().includes(query);
      const matchingSessions = p.sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.target.toLowerCase().includes(query)
      );
      if (matchesProject || matchingSessions.length > 0) {
        return {
          ...p,
          sessions: query ? matchingSessions : p.sessions,
        };
      }
      return null;
    })
    .filter(Boolean) as ProjectItem[];

  return (
    <aside className="w-64 bg-[#0f1013] border-r border-[#1c1e26] flex flex-col justify-between shrink-0 select-none h-full transition-all duration-200 min-w-0 min-h-0">
      {/* Top Header & Search */}
      <div className="flex flex-col p-3 gap-3">
        {/* Workspace Brand Card */}
        <div className="flex items-center justify-between px-1.5 py-1">
          <div className="flex items-center gap-2.5">
            <PixelMascot size={22} glow={false} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f0f1f5] tracking-tight">{l.sidebar.brandName}</span>
              <span className="text-[11px] text-[#565a69]">{l.sidebar.brandSubtitle}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181a20] text-[#8b8f9e] border border-[#262933] font-medium">
            v0.2.0
          </span>
        </div>

        {/* Search Bar with Ctrl+K */}
        <div className="relative">
          <div className="flex items-center bg-[#181a20] border border-[#232630] rounded-xl px-2.5 py-1.5 text-xs text-[#8b8f9e] focus-within:border-[#38bdf8] focus-within:text-[#f0f1f5] transition-colors">
            <Search className="w-3.5 h-3.5 shrink-0 mr-2 text-[#565a69]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${l.common.or === "or" ? "Search chats & targets..." : "Поиск по чатам и целям..."} (${kShortcut})`}
              className="bg-transparent border-none outline-none w-full text-xs text-[#f0f1f5] placeholder-[#565a69]"
            />
            <span className="text-[10px] font-mono text-[#565a69] px-1 py-0.2 rounded bg-[#1c1e26] border border-[#282b35] shrink-0 ml-1">
              {kShortcut}
            </span>
          </div>
        </div>

        {/* New Chat Button with Ctrl+N / Cmd+N */}
        <button
          onClick={onNewSession}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-[#181a20] hover:bg-[#20232b] text-xs text-[#f0f1f5] border border-[#232630] hover:border-[#2d313e] transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs">{l.sidebar.newChat}</span>
          </div>
          <span className="text-[10px] font-mono text-[#565a69] px-1 py-0.2 rounded bg-[#1c1e26] border border-[#282b35]">
            {nShortcut}
          </span>
        </button>

        {/* Projects Tree List */}
        <div className="flex flex-col mt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#565a69] px-1.5 mb-1.5 tracking-wider uppercase">
            <span>PROJECTS</span>
            <span>{projects.length}</span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
            {filteredProjects.map((project) => {
              const isProjectActive = project.id === activeProjectId;
              const isCollapsed = Boolean(collapsedProjects[project.id]);

              return (
                <div key={project.id} className="flex flex-col">
                  {/* Project Header Item */}
                  <div
                    onClick={() => onSelectProject(project.id)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors group ${
                      isProjectActive
                        ? "bg-[#181a22] text-[#f0f1f5] font-semibold border border-[#262a36]"
                        : "text-[#8b8f9e] hover:bg-[#14161c] hover:text-[#f0f1f5]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProjectCollapse(project.id);
                        }}
                        className="p-0.5 text-[#565a69] hover:text-[#f0f1f5]"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Folder className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />

                      {editingProjectId === project.id ? (
                        <div
                          className="flex items-center gap-1 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onRenameProject(project.id, editingProjectName);
                                setEditingProjectId(null);
                              } else if (e.key === "Escape") {
                                setEditingProjectId(null);
                              }
                            }}
                            autoFocus
                            className="bg-[#101217] text-xs px-1.5 py-0.5 rounded border border-[#38bdf8] text-[#f0f1f5] w-full outline-none"
                          />
                          <button
                            onClick={() => {
                              onRenameProject(project.id, editingProjectName);
                              setEditingProjectId(null);
                            }}
                            className="text-[#22c55e] hover:text-[#4ade80]"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate">{project.name}</span>
                      )}
                    </div>

                    {/* Action buttons on project hover */}
                    {editingProjectId !== project.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(project.id);
                            setEditingProjectName(project.name);
                          }}
                          className="p-1 text-[#565a69] hover:text-[#38bdf8]"
                          title="Rename project"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {projects.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project.id);
                            }}
                            className="p-1 text-[#565a69] hover:text-rose-400"
                            title="Delete project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sessions inside project */}
                  {!isCollapsed && (
                    <div className="flex flex-col pl-3 mt-0.5 space-y-0.5 border-l border-[#1c1e26] ml-3.5">
                      {project.sessions.length === 0 ? (
                        <div className="py-1 px-2 text-[11px] text-[#565a69] italic">
                          No chats yet
                        </div>
                      ) : (
                        project.sessions.map((session) => {
                          const isSessionActive = session.id === activeSessionId;

                          return (
                            <div
                              key={session.id}
                              onClick={() => {
                                onSelectProject(project.id);
                                onSelectSession(session.id);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group ${
                                isSessionActive
                                  ? "bg-[#20232c] text-[#f0f1f5] font-medium border border-[#2e323f]"
                                  : "text-[#8b8f9e] hover:bg-[#181a20] hover:text-[#f0f1f5]"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isSessionActive ? "bg-[#22c55e]" : "bg-[#565a69]"
                                  }`}
                                />

                                {editingSessionId === session.id ? (
                                  <div
                                    className="flex items-center gap-1 flex-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      value={editingSessionTitle}
                                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          onRenameSession(session.id, editingSessionTitle);
                                          setEditingSessionId(null);
                                        } else if (e.key === "Escape") {
                                          setEditingSessionId(null);
                                        }
                                      }}
                                      autoFocus
                                      className="bg-[#101217] text-xs px-1.5 py-0.5 rounded border border-[#38bdf8] text-[#f0f1f5] w-full outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        onRenameSession(session.id, editingSessionTitle);
                                        setEditingSessionId(null);
                                      }}
                                      className="text-[#22c55e] hover:text-[#4ade80]"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="truncate">{session.title}</span>
                                )}
                              </div>

                              {/* Hover actions */}
                              {editingSessionId !== session.id && (
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <span className="text-[10px] text-[#565a69] font-mono group-hover:hidden">
                                    {formatTimeAgo(session.createdAt || Date.now())}
                                  </span>

                                  <div className="hidden group-hover:flex items-center gap-0.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSessionId(session.id);
                                        setEditingSessionTitle(session.title);
                                      }}
                                      className="p-1 text-[#565a69] hover:text-[#38bdf8]"
                                      title="Rename chat"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSession(session.id);
                                      }}
                                      className="p-1 text-[#565a69] hover:text-rose-400"
                                      title="Delete chat"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* + New project button */}
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-2.5 py-2 mt-2 rounded-xl text-xs text-[#8b8f9e] hover:text-[#f0f1f5] hover:bg-[#181a20] border border-dashed border-[#232630] hover:border-[#38bdf8]/50 transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="font-medium">{l.sidebar.newProject}</span>
          </button>
        </div>
      </div>

      {/* Bottom Profile Footer */}
      <div className="p-3 border-t border-[#1c1e26] flex flex-col gap-2">
        <div className="text-[11px] text-[#565a69] px-2 font-mono">
          {totalSessions} {l.sidebar.chatsInWorkspace}
        </div>

        {/* User Card */}
        <div
          onClick={onOpenSettings}
          className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#181a20] transition-colors cursor-pointer group border border-transparent hover:border-[#232630]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {(username || "Guest").trim()[0]?.toUpperCase() || "G"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#f0f1f5] truncate max-w-[120px]">
                {username || l.sidebar.guestUser}
              </span>
              <span className="text-[10px] text-[#565a69]">{l.sidebar.localWorkspace}</span>
            </div>
          </div>
          <Settings className="w-4 h-4 text-[#565a69] group-hover:text-[#8b8f9e] transition-colors" />
        </div>

        {/* Documentation & Guide Button */}
        {onOpenDocumentation && (
          <button
            onClick={onOpenDocumentation}
            className="flex items-center justify-between px-2.5 py-2 rounded-xl text-[#8b8f9e] hover:text-[#f0f1f5] hover:bg-[#181a20] transition-all cursor-pointer group border border-transparent hover:border-[#232630]"
            title={l.sidebar.documentationGuide}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#181a20] border border-[#262933] flex items-center justify-center text-[#38bdf8] group-hover:border-[#38bdf8]/40 transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-[#cbd5e1] group-hover:text-[#f0f1f5]">
                  {l.sidebar.documentationGuide}
                </span>
                <span className="text-[10px] text-[#565a69]">{l.sidebar.manualArchitecture}</span>
              </div>
            </div>
            <HelpCircle className="w-3.5 h-3.5 text-[#565a69] group-hover:text-[#8b8f9e] transition-colors" />
          </button>
        )}
      </div>
    </aside>
  );
};
