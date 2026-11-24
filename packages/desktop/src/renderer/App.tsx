import React, { useState, useEffect, DragEvent } from "react";
import { Sidebar } from "./components/Sidebar";
import { BreadcrumbsBar } from "./components/BreadcrumbsBar";
import { HeroState } from "./components/HeroState";
import { FloatingInputBar } from "./components/FloatingInputBar";
import { ChatStream, MessageItem } from "./components/ChatStream";
import { FlowGraph } from "./components/FlowGraph";
import { ReportViewer } from "./components/ReportViewer";
import { SettingsModal } from "./components/SettingsModal";
import { DocumentationModal } from "./components/DocumentationModal";
import { DisclaimerModal } from "./components/DisclaimerModal";
import { EvidenceCodeDrawer } from "./components/EvidenceCodeDrawer";
import {
  TargetMode,
  ProjectItem,
  SessionItem,
  WorkspaceData,
  EvidenceItem,
  EngineProfile,
  PreferredNativeBackend,
  DetectedCapability,
} from "./types";
import { UploadCloud } from "lucide-react";
import { useI18n } from "./i18n";

export const App: React.FC = () => {
  const { l } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<"chat" | "graph" | "report">("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("decompflow_legal_accepted") === "true";
    } catch {
      return false;
    }
  });
  const [globalDragOver, setGlobalDragOver] = useState(false);
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem("decompflow_username") || "dropt1m"
  );

  // Evidence Code Drawer State
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Workspace and Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: "proj-default",
      name: "Default Workspace",
      path: "",
      createdAt: Date.now(),
      sessions: [],
    },
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>("proj-default");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Current session parameters
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<TargetMode>("source");
  const [skill, setSkill] = useState("repo-onboarding");
  const [promptText, setPromptText] = useState("");
  const [availableSkills, setAvailableSkills] = useState<string[]>([
    "binary-architecture",
    "security-audit",
    "code-cleanup",
    "repo-onboarding",
    "web-api-mapper",
  ]);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // Engine Profile & Preferred Backend
  const [engineProfile, setEngineProfile] = useState<EngineProfile>("auto");
  const [preferredBackend, setPreferredBackend] = useState<PreferredNativeBackend>(
    () => (localStorage.getItem("decompflow_preferred_backend") as PreferredNativeBackend) || "ghidra"
  );
  const [detectedCapabilities, setDetectedCapabilities] = useState<DetectedCapability[]>([]);

  // 1. Load initial workspace from IPC / localStorage
  useEffect(() => {
    const initWorkspace = async () => {
      let loadedData: WorkspaceData | null = null;
      if (window.electronAPI) {
        try {
          loadedData = await window.electronAPI.workspaceLoad();
        } catch (err) {
          console.warn("Failed to load workspace via IPC:", err);
        }
      }

      if (!loadedData || !loadedData.projects || loadedData.projects.length === 0) {
        // Fallback or fresh start with clean Default Workspace
        const initialData: WorkspaceData = {
          projects: [
            {
              id: "proj-default",
              name: "Default Workspace",
              path: "/home/dropt1m/DecompFlow",
              createdAt: Date.now(),
              sessions: [],
            },
          ],
          activeProjectId: "proj-default",
          activeSessionId: null,
        };
        loadedData = initialData;
      }

      setProjects(loadedData.projects);
      setActiveProjectId(loadedData.activeProjectId || loadedData.projects[0].id);

      const currProj = loadedData.projects.find(
        (p) => p.id === (loadedData!.activeProjectId || loadedData!.projects[0].id)
      );

      if (currProj && currProj.sessions.length > 0) {
        const sess = currProj.sessions.find((s) => s.id === loadedData!.activeSessionId) || currProj.sessions[0];
        setActiveSessionId(sess.id);
        setTarget(sess.target || "");
        setMode(sess.mode || "source");
        setSkill(sess.skill || "repo-onboarding");
        setMessages(sess.messages || []);
        setFinalReport(sess.finalReport || null);
      } else {
        setActiveSessionId(null);
        setMessages([]);
        setFinalReport(null);
        setTarget("");
      }
    };

    initWorkspace();
  }, []);

  // 2. Load skills list via IPC
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.listSkills().then((skills) => {
        if (skills && skills.length > 0) {
          setAvailableSkills(skills);
        }
      });
    }
  }, []);

  // 2b. Automatic OS Theme Synchronization
  useEffect(() => {
    const applyTheme = (theme: "dark" | "light") => {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    if (window.electronAPI) {
      window.electronAPI.getSystemInfo().then((info) => {
        if (info?.theme) {
          applyTheme(info.theme);
        }
      });

      const unsubscribe = window.electronAPI.onThemeUpdated((theme) => {
        applyTheme(theme);
      });

      return () => {
        unsubscribe();
      };
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // 3. Save workspace changes to IPC
  const saveWorkspaceState = (newProjects: ProjectItem[], projId: string, sessId: string | null) => {
    if (window.electronAPI) {
      window.electronAPI.workspaceSave({
        projects: newProjects,
        activeProjectId: projId,
        activeSessionId: sessId,
      });
    }
  };

  // Switch session
  const handleSelectSession = (sessionId: string) => {
    const currentProj = projects.find((p) => p.id === activeProjectId);
    if (!currentProj) return;

    const sess = currentProj.sessions.find((s) => s.id === sessionId);
    if (sess) {
      setActiveSessionId(sessionId);
      setTarget(sess.target || "");
      setMode(sess.mode || "source");
      setSkill(sess.skill || "repo-onboarding");
      setMessages(sess.messages || []);
      setFinalReport(sess.finalReport || null);
      setDetectedCapabilities(sess.detectedCapabilities || []);
      setActiveView("chat");
      saveWorkspaceState(projects, activeProjectId, sessionId);
    }
  };

  // Switch project
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      if (proj.sessions.length > 0) {
        handleSelectSession(proj.sessions[0].id);
      } else {
        setActiveSessionId(null);
        setTarget("");
        setMessages([]);
        setFinalReport(null);
        saveWorkspaceState(projects, projectId, null);
      }
    }
  };

  // Create new session in active project
  const handleNewSession = () => {
    const currentProj = projects.find((p) => p.id === activeProjectId);
    if (!currentProj) return;

    const newId = `sess-${Date.now()}`;
    const newSession: SessionItem = {
      id: newId,
      title: "New chat",
      target: currentProj.path || "",
      mode: "source",
      skill: "repo-onboarding",
      createdAt: Date.now(),
      hasReport: false,
      messages: [],
      finalReport: null,
    };

    const updatedProjects = projects.map((p) =>
      p.id === activeProjectId ? { ...p, sessions: [newSession, ...p.sessions] } : p
    );

    setProjects(updatedProjects);
    setActiveSessionId(newId);
    setTarget(newSession.target);
    setMode(newSession.mode);
    setSkill(newSession.skill);
    setPromptText("");
    setMessages([]);
    setFinalReport(null);
    setDetectedCapabilities([]);
    setActiveNode(null);
    setCompletedNodes([]);
    setActiveView("chat");

    saveWorkspaceState(updatedProjects, activeProjectId, newId);
  };

  // Create new project from directory dialog
  const handleNewProject = async () => {
    if (window.electronAPI) {
      const selectedDir = await window.electronAPI.openDirectory();
      if (selectedDir) {
        const basename = selectedDir.split("/").filter(Boolean).pop() || "Project";
        const newProjId = `proj-${Date.now()}`;
        const newProj: ProjectItem = {
          id: newProjId,
          name: basename,
          path: selectedDir,
          createdAt: Date.now(),
          sessions: [],
        };

        const updatedProjects = [...projects, newProj];
        setProjects(updatedProjects);
        setActiveProjectId(newProjId);
        setActiveSessionId(null);
        setTarget(selectedDir);
        setMessages([]);
        setFinalReport(null);
        saveWorkspaceState(updatedProjects, newProjId, null);
      }
    }
  };

  // Rename Project
  const handleRenameProject = (projectId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = projects.map((p) => (p.id === projectId ? { ...p, name: newName.trim() } : p));
    setProjects(updated);
    saveWorkspaceState(updated, activeProjectId, activeSessionId);
  };

  // Delete Project
  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    const nextProj = updated[0];
    setActiveProjectId(nextProj.id);
    if (nextProj.sessions.length > 0) {
      setActiveSessionId(nextProj.sessions[0].id);
    } else {
      setActiveSessionId(null);
    }
    saveWorkspaceState(updated, nextProj.id, nextProj.sessions[0]?.id || null);
  };

  // Rename Session
  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updated = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          sessions: p.sessions.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s)),
        };
      }
      return p;
    });
    setProjects(updated);
    saveWorkspaceState(updated, activeProjectId, activeSessionId);
  };

  // Delete Session
  const handleDeleteSession = (sessionId?: string) => {
    const targetSessionId = sessionId || activeSessionId;
    if (!targetSessionId) return;

    const updated = projects.map((p) => {
      if (p.id === activeProjectId) {
        const remaining = p.sessions.filter((s) => s.id !== targetSessionId);
        return { ...p, sessions: remaining };
      }
      return p;
    });

    setProjects(updated);
    const activeProj = updated.find((p) => p.id === activeProjectId);
    if (activeProj && activeProj.sessions.length > 0) {
      handleSelectSession(activeProj.sessions[0].id);
    } else {
      setActiveSessionId(null);
      setMessages([]);
      setFinalReport(null);
      setTarget("");
      saveWorkspaceState(updated, activeProjectId, null);
    }
  };

  // Clear Chat in active session
  const handleClearChat = () => {
    if (!activeSessionId) return;
    setMessages([]);
    setFinalReport(null);
    setDetectedCapabilities([]);
    const updated = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          sessions: p.sessions.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [], finalReport: null, hasReport: false, detectedCapabilities: [] }
              : s
          ),
        };
      }
      return p;
    });
    setProjects(updated);
    saveWorkspaceState(updated, activeProjectId, activeSessionId);
  };

  // Pick target file or folder via native dialog
  const handleSelectTarget = async () => {
    if (window.electronAPI) {
      let selected: string | null = null;
      if (mode === "binary") {
        selected = await window.electronAPI.openFile();
      } else {
        selected = await window.electronAPI.openDirectory();
        if (!selected) {
          selected = await window.electronAPI.openFile();
        }
      }

      if (selected) {
        setTarget(selected);
        updateActiveSessionTarget(selected);
      }
    }
  };

  const handleClearTarget = () => {
    setTarget("");
    updateActiveSessionTarget("");
  };

  const updateActiveSessionTarget = (newTarget: string) => {
    if (!activeSessionId) return;
    const updated = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          sessions: p.sessions.map((s) => (s.id === activeSessionId ? { ...s, target: newTarget } : s)),
        };
      }
      return p;
    });
    setProjects(updated);
    saveWorkspaceState(updated, activeProjectId, activeSessionId);
  };

  // Global Ctrl+N shortcut for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewSession();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [projects, activeProjectId]);

  // Subscribe to real-time progress events from LangGraph
  useEffect(() => {
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onProgress((event) => {
        console.log("[Renderer] LangGraph Progress Event:", event);
        if (event.node) {
          setActiveNode(event.node);
          setCompletedNodes((prev) => (prev.includes(event.node) ? prev : [...prev, event.node]));

          setMessages((prev) =>
            prev.map((m) => {
              if (m.sender === "agent" && !m.finalReport) {
                return {
                  ...m,
                  activeNode: event.node,
                  completedNodes: Array.from(new Set([...(m.completedNodes || []), event.node])),
                };
              }
              return m;
            })
          );
        }
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  const handleSelectEvidence = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setDrawerOpen(true);
  };

  const handleDeepDiveFromDrawer = (prompt: string) => {
    setPromptText(prompt);
    setActiveView("chat");
  };

  // Quick action from HeroState
  const handleSelectHeroAction = async (
    actionText: string,
    actionMode: TargetMode,
    actionSkill: string,
    needFilePicker?: boolean
  ) => {
    setMode(actionMode);
    setSkill(actionSkill);

    let currentTarget = target;
    if (needFilePicker && window.electronAPI) {
      const picked = await window.electronAPI.openFile();
      if (picked) {
        currentTarget = picked;
        setTarget(picked);
      }
    }

    if (actionText === "https://") {
      setPromptText("https://");
    } else {
      setPromptText(actionText);
    }
  };

  // Launch analysis
  const handleLaunch = async () => {
    const runTarget = target.trim();
    const userText = promptText.trim() || `Execute ${mode} analysis with ${skill}`;

    if (!runTarget && mode !== "web") {
      await handleSelectTarget();
      return;
    }

    let sessionToUseId = activeSessionId;
    let currentProj = projects.find((p) => p.id === activeProjectId);

    // If no active session, create one automatically
    if (!sessionToUseId || !currentProj?.sessions.some((s) => s.id === sessionToUseId)) {
      const newId = `sess-${Date.now()}`;
      const newSession: SessionItem = {
        id: newId,
        title: runTarget.split("/").filter(Boolean).pop() || "Analysis Session",
        target: runTarget,
        mode,
        skill,
        createdAt: Date.now(),
        hasReport: false,
        messages: [],
        finalReport: null,
      };

      const updated = projects.map((p) =>
        p.id === activeProjectId ? { ...p, sessions: [newSession, ...p.sessions] } : p
      );
      setProjects(updated);
      setActiveSessionId(newId);
      sessionToUseId = newId;
    }

    setIsRunning(true);
    setPromptText("");
    setCompletedNodes(["__start__", "router"]);
    const isAsarOrJs = runTarget.endsWith(".asar") || runTarget.endsWith(".js") || runTarget.includes("resources");
    const isMobile = runTarget.endsWith(".apk") || runTarget.endsWith(".dex") || runTarget.endsWith(".jar") || runTarget.endsWith(".aab");
    const initialReconNode = isMobile
      ? "mobile_recon"
      : isAsarOrJs
      ? "rea_recon"
      : mode === "binary"
      ? "binary_recon"
      : mode === "web"
      ? "web_recon"
      : "source_recon";
    setActiveNode(initialReconNode);

    const timeStr = "now";

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      target: runTarget,
      mode,
      skill,
      timestamp: timeStr,
    };

    const agentMsgId = `agent-${Date.now()}`;
    const agentMsg: MessageItem = {
      id: agentMsgId,
      sender: "agent",
      text: `Ingesting target and connecting via Model Context Protocol (${
        initialReconNode === "mobile_recon"
          ? "Jadx Mobile Engine"
          : initialReconNode === "rea_recon"
          ? "REA MCP Engine"
          : mode === "binary"
          ? engineProfile === "fast-triage"
            ? "Capa + Radare2 Fast Triage"
            : "Capa + Ghidra Engine"
          : mode === "web"
          ? "Playwright MCP"
          : "Source AST"
      })...`,
      mode,
      skill,
      timestamp: timeStr,
      activeNode: initialReconNode,
      completedNodes: ["__start__", "router"],
    };

    const updatedMessages = [...messages, userMsg, agentMsg];
    setMessages(updatedMessages);

    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.runAnalysis({
          target: runTarget,
          mode,
          skill,
          userPrompt: userText,
          engineProfile,
          preferredNativeBackend: preferredBackend,
          messages: messages.map((m) => ({
            role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
            content: m.text,
          })),
        });

        if (response.success && response.data) {
          const reportText = response.data.finalReport || "Report completed.";
          const findings = response.data.findings || [];
          const evidence = response.data.evidence || [];
          const reconstructedCode = response.data.reconstructedCode;
          const caps = response.data.detectedCapabilities || [];
          const reasoningTree = response.data.reasoningTree;

          setFinalReport(reportText);
          setDetectedCapabilities(caps);
          setCompletedNodes(["__start__", "router", initialReconNode, "analyze", "report"]);
          setActiveNode(null);

          const finalMessages = updatedMessages.map((m) => {
            if (m.id === agentMsgId) {
              return {
                ...m,
                text: `Completed architectural decomposition & feature analysis for ${runTarget}.`,
                activeNode: null,
                completedNodes: ["__start__", "router", initialReconNode, "analyze", "report"],
                finalReport: reportText,
                findings,
                evidence,
                reconstructedCode,
                detectedCapabilities: caps,
                reasoningTree,
              };
            }
            return m;
          });

          setMessages(finalMessages);

          // Update active session and auto-name title if it was "New chat"
          const targetBasename = runTarget.split("/").filter(Boolean).pop() || "Analysis";
          const updatedProjects = projects.map((p) => {
            if (p.id === activeProjectId) {
              return {
                ...p,
                sessions: p.sessions.map((s) => {
                  if (s.id === sessionToUseId) {
                    return {
                      ...s,
                      title: s.title === "New chat" ? targetBasename : s.title,
                      target: runTarget,
                      mode,
                      skill,
                      hasReport: true,
                      messages: finalMessages,
                      finalReport: reportText,
                      evidence,
                      reconstructedCode,
                      detectedCapabilities: caps,
                      reasoningTree,
                    };
                  }
                  return s;
                }),
              };
            }
            return p;
          });

          setProjects(updatedProjects);
          saveWorkspaceState(updatedProjects, activeProjectId, sessionToUseId);
        } else {
          setActiveNode(null);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId
                ? { ...m, text: `Analysis error: ${response.error || "Execution failed."}`, activeNode: null }
                : m
            )
          );
        }
      }
    } catch (err: any) {
      setActiveNode(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId ? { ...m, text: `Fatal error: ${err.message || String(err)}` } : m
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Stop analysis
  const handleStopAnalysis = async () => {
    if (window.electronAPI) {
      await window.electronAPI.stopAnalysis();
    }
    setIsRunning(false);
    setActiveNode(null);
  };

  // Save report to markdown file via native dialog
  const handleSaveReport = async () => {
    if (finalReport && window.electronAPI) {
      const defaultFilename = `decompflow_${mode}_report.md`;
      await window.electronAPI.saveFile(finalReport, defaultFilename);
    }
  };

  // Drag and Drop anywhere on the window
  const handleWindowDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGlobalDragOver(true);
  };

  const handleWindowDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setGlobalDragOver(false);
    }
  };

  const handleWindowDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGlobalDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const filePath = (file as any).path || file.name;
      setTarget(filePath);
      updateActiveSessionTarget(filePath);

      if (
        filePath.endsWith(".exe") ||
        filePath.endsWith(".bin") ||
        filePath.endsWith(".so") ||
        filePath.endsWith(".elf") ||
        !filePath.includes(".")
      ) {
        setMode("binary");
        setSkill("binary-architecture");
      } else {
        setMode("source");
        setSkill("repo-onboarding");
      }
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeSession = activeProject.sessions.find((s) => s.id === activeSessionId);

  // Total session context character length for token estimation
  const sessionContextChars = messages.reduce((acc, m) => acc + (m.text?.length || 0), 0);

  return (
    <div
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
      className="h-screen w-screen flex flex-col bg-[#131418] text-[#f0f1f5] overflow-hidden select-none font-sans relative"
    >
      {/* Global Drag Overlay */}
      {globalDragOver && (
        <div className="absolute inset-0 z-50 bg-[#0f172a]/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#38bdf8] pointer-events-none">
          <UploadCloud className="w-12 h-12 text-[#38bdf8] animate-bounce" />
          <h2 className="text-base font-bold text-[#f0f1f5]">{l.hero.dropPrompt}</h2>
          <p className="text-xs text-[#8b8f9e]">{l.hero.dropSubtitle}</p>
        </div>
      )}

      {/* SINGLE CLEAN TOP NAVIGATION BAR (No duplicate headers / No mock OS buttons) */}
      <BreadcrumbsBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projectName={activeProject.name}
        sessionTitle={activeSession?.title || "New chat"}
        target={target}
        isRunning={isRunning}
        activeView={activeView}
        setActiveView={setActiveView}
        hasReport={Boolean(finalReport)}
        onSelectTarget={handleSelectTarget}
        onClearTarget={handleClearTarget}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDocumentation={() => setDocsOpen(true)}
        onNewSession={handleNewSession}
        onSaveReport={handleSaveReport}
        onClearChat={handleClearChat}
        onDeleteSession={activeSession ? () => handleDeleteSession(activeSession.id) : undefined}
      />

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden min-w-0 min-h-0">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          projects={projects}
          activeProjectId={activeProjectId}
          activeSessionId={activeSessionId}
          username={username}
          onSelectProject={handleSelectProject}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onNewProject={handleNewProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenDocumentation={() => setDocsOpen(true)}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#131418] min-w-0 min-h-0">
          <div className="flex-1 relative flex flex-col overflow-hidden min-w-0 min-h-0">
            {/* View: Chat */}
            {activeView === "chat" && (
              <>
                {messages.length === 0 ? (
                  <HeroState
                    workspaceName={activeProject.name}
                    targetPath={target}
                    onSelectAction={handleSelectHeroAction}
                    onSelectTarget={handleSelectTarget}
                  />
                ) : (
                  <ChatStream
                    messages={messages}
                    isRunning={isRunning}
                    onOpenGraph={() => setActiveView("graph")}
                    onOpenReport={() => setActiveView("report")}
                    onSelectEvidence={handleSelectEvidence}
                  />
                )}

                {/* Floating Bottom Input Bar */}
                <FloatingInputBar
                  promptText={promptText}
                  setPromptText={setPromptText}
                  target={target}
                  setTarget={setTarget}
                  mode={mode}
                  setMode={setMode}
                  skill={skill}
                  setSkill={setSkill}
                  engineProfile={engineProfile}
                  setEngineProfile={setEngineProfile}
                  onSend={handleLaunch}
                  onStop={handleStopAnalysis}
                  isRunning={isRunning}
                  availableSkills={availableSkills}
                  sessionContextChars={sessionContextChars}
                  onSelectTarget={handleSelectTarget}
                  onClearTarget={handleClearTarget}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              </>
            )}

            {/* View: Visual Graph (LangGraph Real-time React Flow) */}
            {activeView === "graph" && (
              <div className="w-full h-full relative">
                <FlowGraph
                  mode={mode}
                  activeNode={activeNode}
                  completedNodes={completedNodes}
                  engineProfile={engineProfile}
                />
              </div>
            )}

            {/* View: Report (Markdown + Rendered Mermaid SVG) */}
            {activeView === "report" && (
              <div className="w-full h-full relative">
                <ReportViewer
                  reportMarkdown={finalReport}
                  onSave={handleSaveReport}
                  onSelectEvidence={handleSelectEvidence}
                  detectedCapabilities={detectedCapabilities}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Evidence Code Drawer */}
      <EvidenceCodeDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        evidence={selectedEvidence}
        onDeepDive={handleDeepDiveFromDrawer}
      />

      {/* Settings Modal (Syncs with decompflow.yaml & mcp-servers.json) */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        username={username}
        onSaveUsername={setUsername}
        preferredBackend={preferredBackend}
        onSavePreferredBackend={setPreferredBackend}
      />

      {/* Interactive Documentation & Guide Modal */}
      <DocumentationModal
        isOpen={docsOpen}
        onClose={() => setDocsOpen(false)}
      />

      {/* Mandatory Legal Disclaimer & Terms Gate */}
      <DisclaimerModal
        isOpen={!legalAccepted}
        onAccept={() => setLegalAccepted(true)}
      />
    </div>
  );
};
