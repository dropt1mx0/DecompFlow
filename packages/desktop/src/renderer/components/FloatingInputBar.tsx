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
  Key,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { TargetMode, EngineProfile } from "../types";
import { useI18n } from "../i18n";

interface FloatingInputBarProps {
  promptText: string;
  setPromptText: (text: string) => void;
  target: string;
  setTarget: (target: string) => void;
  mode: TargetMode;
  setMode: (mode: TargetMode) => void;
  skill: string;
  setSkill: (skill: string) => void;
  engineProfile?: EngineProfile;
  setEngineProfile?: (profile: EngineProfile) => void;
  onSend: () => void;
  onStop?: () => void;
  isRunning: boolean;
  availableSkills: string[];
  sessionContextChars?: number;
  onSelectTarget: () => void;
  onClearTarget: () => void;
  onOpenSettings?: () => void;
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
  engineProfile = "auto",
  setEngineProfile,
  onSend,
  onStop,
  isRunning,
  availableSkills,
  sessionContextChars = 0,
  onSelectTarget,
  onClearTarget,
  onOpenSettings,
}) => {
  const { language, l } = useI18n();
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active Model and Local LLM State
  const [activeProvider, setActiveProvider] = useState("openai");
  const [activeModel, setActiveModel] = useState("gpt-4o");
  const [detectedLocalModels, setDetectedLocalModels] = useState<string[]>([]);
  const [isScanningLocal, setIsScanningLocal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load configured model from backend on mount
  useEffect(() => {
    if (window.electronAPI?.getConfig) {
      window.electronAPI.getConfig().then((res) => {
        if (res?.yamlConfig?.llm) {
          const p = res.yamlConfig.llm.provider || "openai";
          const m = res.yamlConfig.llm.model || (p === "ollama" ? "qwen2.5-coder" : "gpt-4o");
          setActiveProvider(p);
          setActiveModel(m);
        }
      });
    }
  }, []);

  const handleScanLocalModels = async () => {
    setIsScanningLocal(true);
    if (window.electronAPI?.detectLocalModels) {
      try {
        const res = await window.electronAPI.detectLocalModels();
        const models = [...(res.ollama?.models || []), ...(res.lmstudio?.models || [])];
        setDetectedLocalModels(models);
        if (models.length > 0 && (activeProvider === "ollama" || activeProvider === "lmstudio")) {
          setActiveModel(models[0]);
        }
      } catch (err) {
        console.error("Local LLM scan error:", err);
      }
    }
    setIsScanningLocal(false);
  };

  const handleSelectModel = async (p: string, m: string) => {
    setActiveProvider(p);
    setActiveModel(m);
    setModelMenuOpen(false);
    if (window.electronAPI?.getConfig && window.electronAPI?.saveConfig) {
      try {
        const current = await window.electronAPI.getConfig();
        const updated = {
          ...(current.yamlConfig || {}),
          llm: {
            ...(current.yamlConfig?.llm || {}),
            provider: p,
            model: m,
            base_url: p === "ollama" ? "http://127.0.0.1:11434/v1" : p === "lmstudio" ? "http://127.0.0.1:1234/v1" : undefined,
          },
        };
        await window.electronAPI.saveConfig({ yamlConfig: updated });
      } catch (err) {
        console.error("Failed to save selected model:", err);
      }
    }
  };

  const isLocalActive = activeProvider === "ollama" || activeProvider === "lmstudio";

  const modelCategories = [
    {
      category: "Cloud Coders",
      icon: "🌟",
      models: [
        { p: "openai", m: "gpt-4o", label: "GPT-4o (OpenAI)" },
        { p: "openai", m: "o1", label: "o1 (OpenAI Reasoning)", isReasoning: true },
        { p: "deepseek", m: "deepseek-chat", label: "DeepSeek-Chat (V3)" },
        { p: "deepseek", m: "deepseek-reasoner", label: "DeepSeek-Reasoner (R1)", isReasoning: true },
        { p: "qwen", m: "qwen2.5-coder-32b-instruct", label: "Qwen 2.5 Coder 32B" },
        { p: "qwen", m: "qwen-max", label: "Qwen Max" },
      ],
    },
    {
      category: "Open Source Weights",
      icon: "⚡",
      models: [
        { p: "meta", m: "llama-3.3-70b-versatile", label: "Meta Llama 3.3 70B (Groq)" },
        { p: "nvidia", m: "nvidia/nemotron-4-34b-instruct", label: "NVIDIA Nemotron 4 34B" },
        { p: "qwen", m: "qwen2.5-coder-72b-instruct", label: "Qwen 2.5 Coder 72B" },
        { p: "qwen", m: "qwq-32b-preview", label: "QwQ 32B (Qwen Reasoning)", isReasoning: true },
      ],
    },
    {
      category: "Local / Offline",
      icon: "💻",
      models: [
        { p: "ollama", m: "qwen2.5-coder", label: "Qwen 2.5 Coder (Ollama)" },
        { p: "lmstudio", m: "deepseek-coder", label: "DeepSeek Coder (LM Studio)" },
        { p: "ollama", m: "deepseek-r1", label: "DeepSeek R1 (Ollama)", isReasoning: true },
        ...detectedLocalModels.map((m) => ({
          p: "ollama",
          m,
          label: `${m} (Local Detected)`,
          isReasoning: m.toLowerCase().includes("r1") || m.toLowerCase().includes("qwq"),
        })),
      ],
    },
  ];

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSkillMenuOpen(false);
        setModeMenuOpen(false);
        setModelMenuOpen(false);
        setProfileMenuOpen(false);
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
                ? language === "ru"
                  ? "Укажите URL (напр. https://example.com) или задачу аудита API..."
                  : "Enter target URL (e.g. https://example.com) or inspection task..."
                : mode === "binary"
                ? language === "ru"
                  ? "Запросите декомпиляцию функций, карту xrefs или аудит бинарника..."
                  : "Ask to decompile functions, map xrefs, or reconstruct binary architecture..."
                : l.input.placeholder
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

            {/* Model & Local LLM Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setModelMenuOpen(!modelMenuOpen);
                  setSkillMenuOpen(false);
                  setModeMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isLocalActive
                    ? "bg-[#142419] border-[#22c55e]/40 text-[#22c55e]"
                    : "bg-[#20232c] hover:bg-[#282c38] text-[#8b8f9e] hover:text-[#f0f1f5] border-[#2d313e]"
                }`}
              >
                {isLocalActive ? (
                  <ShieldCheck className="w-3 h-3 text-[#22c55e]" />
                ) : (
                  <Key className="w-3 h-3 text-purple-400" />
                )}
                <span className="truncate max-w-[110px]">{activeModel}</span>
                {isLocalActive && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#22c55e]/20 text-[#22c55e] font-mono font-bold hidden sm:inline">
                    LOCAL
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-[#565a69]" />
              </button>

              {modelMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#181a20] border border-[#2d313e] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-[#262a38]">
                    <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider font-semibold">
                      Multi-Model Hub
                    </span>
                    <button
                      type="button"
                      onClick={handleScanLocalModels}
                      disabled={isScanningLocal}
                      className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isScanningLocal ? "animate-spin" : ""}`} />
                      <span>{isScanningLocal ? "Scanning..." : "Scan Local"}</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {modelCategories.map((cat) => (
                      <div key={cat.category} className="space-y-0.5">
                        <div className="text-[9px] font-mono uppercase tracking-wider text-[#f97316] font-semibold px-1.5 py-0.5 flex items-center gap-1 opacity-90">
                          <span>{cat.icon}</span>
                          <span>{cat.category}</span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          {cat.models.map((opt) => (
                            <button
                              key={`${cat.category}-${opt.m}`}
                              type="button"
                              onClick={() => handleSelectModel(opt.p, opt.m)}
                              className={`text-left px-2 py-1 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                activeModel === opt.m
                                  ? "bg-[#282c38] text-[#f97316] font-medium"
                                  : "text-[#cbd5e1] hover:bg-[#20232c] hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="truncate">{opt.label}</span>
                                {opt.isReasoning && (
                                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 shrink-0">
                                    🧠 R1
                                  </span>
                                )}
                              </div>
                              {activeModel === opt.m && <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setModelMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-center py-1 mt-1 border-t border-[#262a38] text-[10px] text-[#8b8f9e] hover:text-[#f0f1f5] transition-colors cursor-pointer"
                    >
                      Configure endpoints in Settings →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Engine Speed Profile Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setModelMenuOpen(false);
                  setSkillMenuOpen(false);
                  setModeMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  engineProfile === "fast-triage"
                    ? "bg-[#271b12] border-[#f97316]/60 text-[#f97316]"
                    : engineProfile === "deep-decompile"
                    ? "bg-[#211a2f] border-purple-500/60 text-purple-300"
                    : "bg-[#20232c] hover:bg-[#282c38] text-[#8b8f9e] hover:text-[#f0f1f5] border-[#2d313e]"
                }`}
                title="Engine Profile: Fast Triage vs. Deep Decompilation"
              >
                <span>
                  {engineProfile === "fast-triage"
                    ? "⚡ Fast"
                    : engineProfile === "deep-decompile"
                    ? "🔬 Deep"
                    : "📱 Auto"}
                </span>
                <ChevronDown className="w-3 h-3 text-[#565a69]" />
              </button>

              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-60 bg-[#181a20] border border-[#2d313e] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#565a69] px-2 py-0.5">
                    Engine Speed Profile
                  </div>
                  {[
                    { id: "fast-triage", label: "⚡ Fast (Capa + r2)", desc: "< 1s triage, < 80MB RAM" },
                    { id: "deep-decompile", label: "🔬 Deep (Capa + Ghidra/IDA)", desc: "Targeted full decompilation" },
                    { id: "auto", label: "📱 Auto-Route", desc: "Smart target match (Jadx/REA/Ghidra)" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (setEngineProfile) setEngineProfile(p.id as EngineProfile);
                        setProfileMenuOpen(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex flex-col cursor-pointer ${
                        engineProfile === p.id
                          ? "bg-[#282c38] text-[#f97316] font-medium"
                          : "text-[#8b8f9e] hover:bg-[#20232c] hover:text-[#f0f1f5]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{p.label}</span>
                        {engineProfile === p.id && <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />}
                      </div>
                      <span className="text-[10px] text-[#565a69] mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Send/Stop button */}
          <div className="flex items-center gap-3">
            {/* Send / Stop Button with AbortController */}
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-transform active:scale-90 shadow-md shadow-rose-500/30 cursor-pointer"
                title={l.input.stopTooltip}
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
                title={l.input.sendTooltip}
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
