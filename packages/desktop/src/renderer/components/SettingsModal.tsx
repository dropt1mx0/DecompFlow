import React, { useState, useEffect } from "react";
import {
  X,
  Server,
  Key,
  Cpu,
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  Activity,
  Package,
  Laptop,
  Palette,
  FolderTree,
  Terminal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { McpTestResult, SystemInfo } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"system" | "llm" | "mcp">("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // System Info
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [detectingPaths, setDetectingPaths] = useState(false);
  const [themeMode, setThemeMode] = useState<"auto" | "dark" | "light">("auto");
  const [useAccentColor, setUseAccentColor] = useState(true);

  // LLM Config
  const [provider, setProvider] = useState("openai");
  const [modelName, setModelName] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [temperature, setTemperature] = useState(0.1);

  // Local LLM Detection
  const [scanningLocal, setScanningLocal] = useState(false);
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([]);
  const [localLmStudioModels, setLocalLmStudioModels] = useState<string[]>([]);
  const [localScanMessage, setLocalScanMessage] = useState<string | null>(null);

  // MCP Servers Config
  const [reaEnabled, setReaEnabled] = useState(true);
  const [reaCommand, setReaCommand] = useState("npx -y rea-agents@latest mcp");

  const [ghidraEnabled, setGhidraEnabled] = useState(true);
  const [ghidraCommand, setGhidraCommand] = useState("python3 ./tools/ghidra_mcp_bridge.py");

  const [playwrightEnabled, setPlaywrightEnabled] = useState(true);
  const [playwrightCommand, setPlaywrightCommand] = useState("npx -y @playwright/mcp");

  // Connection testing state
  const [testingMcp, setTestingMcp] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, McpTestResult>>({});

  // Raw configs for safe merging
  const [rawYaml, setRawYaml] = useState<any>({});
  const [rawMcp, setRawMcp] = useState<any>({});

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSavedSuccess(false);

    if (window.electronAPI) {
      Promise.all([
        window.electronAPI.getConfig(),
        window.electronAPI.getSystemInfo ? window.electronAPI.getSystemInfo() : Promise.resolve(null),
      ]).then(([res, sys]) => {
        if (sys) {
          setSystemInfo(sys);
        }

        if (res) {
          const yamlCfg = res.yamlConfig || {};
          const mcpCfg = res.mcpConfig || {};

          setRawYaml(yamlCfg);
          setRawMcp(mcpCfg);

          if (yamlCfg.llm) {
            setProvider(yamlCfg.llm.provider || "openai");
            setModelName(yamlCfg.llm.model || "gpt-4o");
            setTemperature(yamlCfg.llm.temperature ?? 0.1);
            setBaseUrl(yamlCfg.llm.base_url || "");
          }

          setApiKey(res.envApiKey || "");

          if (mcpCfg.mcpServers?.rea) {
            setReaEnabled(mcpCfg.mcpServers.rea.enabled !== false);
            const cmd = [
              mcpCfg.mcpServers.rea.command,
              ...(mcpCfg.mcpServers.rea.args || []),
            ].join(" ");
            setReaCommand(cmd);
          }

          if (mcpCfg.mcpServers?.ghidra) {
            setGhidraEnabled(mcpCfg.mcpServers.ghidra.enabled !== false);
            const cmd = [
              mcpCfg.mcpServers.ghidra.command,
              ...(mcpCfg.mcpServers.ghidra.args || []),
            ].join(" ");
            setGhidraCommand(cmd);
          }

          if (mcpCfg.mcpServers?.playwright) {
            setPlaywrightEnabled(mcpCfg.mcpServers.playwright.enabled !== false);
            const cmd = [
              mcpCfg.mcpServers.playwright.command,
              ...(mcpCfg.mcpServers.playwright.args || []),
            ].join(" ");
            setPlaywrightCommand(cmd);
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [isOpen]);

  const handleAutoDetectPaths = async () => {
    setDetectingPaths(true);
    if (window.electronAPI?.getSystemInfo) {
      try {
        const sys = await window.electronAPI.getSystemInfo();
        setSystemInfo(sys);
      } catch (err) {
        console.error("Failed to detect system paths:", err);
      }
    }
    setDetectingPaths(false);
  };

  const handleScanLocal = async () => {
    setScanningLocal(true);
    setLocalScanMessage(null);
    if (window.electronAPI?.detectLocalModels) {
      try {
        const res = await window.electronAPI.detectLocalModels();
        const ollamaList = res.ollama?.models || [];
        const lmList = res.lmstudio?.models || [];
        setLocalOllamaModels(ollamaList);
        setLocalLmStudioModels(lmList);

        const found: string[] = [];
        if (res.ollama?.available) found.push(`Ollama (${ollamaList.length} models)`);
        if (res.lmstudio?.available) found.push(`LM Studio (${lmList.length} models)`);

        if (found.length > 0) {
          setLocalScanMessage(`Discovered: ${found.join(", ")}`);
        } else {
          setLocalScanMessage("No local models found on :11434 (Ollama) or :1234 (LM Studio)");
        }
      } catch (err: any) {
        setLocalScanMessage("Detection error: " + (err.message || String(err)));
      }
    }
    setScanningLocal(false);
  };

  const handleTestConnections = async () => {
    setTestingMcp(true);
    if (window.electronAPI?.testMcpConnections) {
      try {
        const results = await window.electronAPI.testMcpConnections();
        setTestResults(results);
      } catch (err) {
        console.error("Failed to test MCP connections:", err);
      }
    }
    setTestingMcp(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedYaml = {
        ...rawYaml,
        llm: {
          ...(rawYaml.llm || {}),
          provider,
          model: modelName,
          temperature,
          ...(baseUrl ? { base_url: baseUrl } : {}),
        },
      };

      const parseCommand = (fullCmd: string) => {
        const parts = fullCmd.trim().split(" ");
        return {
          command: parts[0] || "npx",
          args: parts.slice(1),
        };
      };

      const reaParsed = parseCommand(reaCommand);
      const ghidraParsed = parseCommand(ghidraCommand);
      const playwrightParsed = parseCommand(playwrightCommand);

      const updatedMcp = {
        ...rawMcp,
        mcpServers: {
          ...(rawMcp.mcpServers || {}),
          rea: {
            command: reaParsed.command,
            args: reaParsed.args,
            transport: "stdio",
            enabled: reaEnabled,
          },
          ghidra: {
            command: ghidraParsed.command,
            args: ghidraParsed.args,
            transport: "stdio",
            enabled: ghidraEnabled,
          },
          playwright: {
            command: playwrightParsed.command,
            args: playwrightParsed.args,
            transport: "stdio",
            enabled: playwrightEnabled,
          },
        },
      };

      if (window.electronAPI) {
        await window.electronAPI.saveConfig({
          yamlConfig: updatedYaml,
          mcpConfig: updatedMcp,
          envApiKey: apiKey,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const platformDisplay =
    systemInfo?.platform === "darwin"
      ? "macOS"
      : systemInfo?.platform === "win32"
      ? "Windows"
      : "Linux";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-2xl bg-[#14161c] border border-[#272a36] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#20232d] bg-[#101217] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1c202a] border border-[#2d3140] flex items-center justify-center">
              <Laptop className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f1f5]">DecompFlow Studio Settings</h3>
              <p className="text-[11px] text-[#6b7280]">
                Native OS Configuration & Runtime Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#f0f1f5] hover:bg-[#1f222c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-[#20232d] bg-[#0e1015] gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "system"
                ? "border-[#f97316] text-[#f97316] bg-[#161822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>System & Environment</span>
          </button>

          <button
            onClick={() => setActiveTab("llm")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "llm"
                ? "border-[#f97316] text-[#f97316] bg-[#161822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>LLM Reasoning</span>
          </button>

          <button
            onClick={() => setActiveTab("mcp")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "mcp"
                ? "border-[#f97316] text-[#f97316] bg-[#161822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Model Context Protocol (MCP)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#6b7280] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#f97316]" />
              <span>Loading configuration...</span>
            </div>
          ) : activeTab === "system" ? (
            /* TAB 1: SYSTEM & ENVIRONMENT */
            <div className="space-y-5">
              {/* OS Summary Card */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Host Operating System & Architecture</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#11131a] border border-[#212430]">
                    <span className="text-[10px] text-[#6b7280] block">OS Platform</span>
                    <span className="font-bold text-[#f0f1f5]">{platformDisplay}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#11131a] border border-[#212430]">
                    <span className="text-[10px] text-[#6b7280] block">Architecture</span>
                    <span className="font-bold text-[#f0f1f5]">{systemInfo?.arch || process.arch}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#11131a] border border-[#212430]">
                    <span className="text-[10px] text-[#6b7280] block">System Locale</span>
                    <span className="font-bold text-[#f0f1f5]">{systemInfo?.locale || "en-US"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#11131a] border border-[#212430]">
                    <span className="text-[10px] text-[#6b7280] block">System Proxy</span>
                    <span className="font-bold text-[#22c55e]">Auto (OS Mode)</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-[11px] font-mono text-[#8b8f9e]">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                    <span className="text-[#6b7280] shrink-0">userData:</span>
                    <span className="text-[#cbd5e1] truncate">{systemInfo?.userDataDir || "~/.config/decompflow"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[#6b7280] shrink-0">workspace:</span>
                    <span className="text-[#cbd5e1] truncate">{systemInfo?.workspaceFile || "workspace.json"}</span>
                  </div>
                </div>
              </div>

              {/* Theme & Accents Card */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>UI Theme & Native Accent Synchronization</span>
                </span>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#cbd5e1]">
                    <input
                      type="radio"
                      name="themeMode"
                      checked={themeMode === "auto"}
                      onChange={() => setThemeMode("auto")}
                      className="text-[#f97316] focus:ring-0"
                    />
                    <span>Sync with OS (Auto)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#cbd5e1]">
                    <input
                      type="radio"
                      name="themeMode"
                      checked={themeMode === "dark"}
                      onChange={() => setThemeMode("dark")}
                      className="text-[#f97316] focus:ring-0"
                    />
                    <span>Dark</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#cbd5e1]">
                    <input
                      type="radio"
                      name="themeMode"
                      checked={themeMode === "light"}
                      onChange={() => setThemeMode("light")}
                      className="text-[#f97316] focus:ring-0"
                    />
                    <span>Light</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#232734]">
                  <span className="text-[#8b8f9e]">Adopt Native OS Accent Color</span>
                  <div className="flex items-center gap-2">
                    {systemInfo?.accentColor && (
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: systemInfo.accentColor }}
                        title={`System Accent: ${systemInfo.accentColor}`}
                      />
                    )}
                    <input
                      type="checkbox"
                      checked={useAccentColor}
                      onChange={(e) => setUseAccentColor(e.target.checked)}
                      className="rounded bg-[#101217] border-[#2d3140] text-[#f97316] focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* System Binaries & Decompiler Paths */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span>Auto-Detected System Binaries</span>
                  </span>

                  <button
                    onClick={handleAutoDetectPaths}
                    disabled={detectingPaths}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12141c] hover:bg-[#1a1e2a] border border-[#2b3042] text-[11px] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#f97316] ${detectingPaths ? "animate-spin" : ""}`} />
                    <span>Auto-Detect System Paths</span>
                  </button>
                </div>

                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Node / NPX Runtime:</span>
                    <span className="text-[#22c55e] truncate max-w-[320px]">{systemInfo?.systemPaths?.nodePath || "Detected via PATH"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Python 3 (Bridge):</span>
                    <span className="text-[#22c55e] truncate max-w-[320px]">{systemInfo?.systemPaths?.pythonPath || "Detected via PATH"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Java Runtime (Ghidra):</span>
                    <span className="text-[#38bdf8] truncate max-w-[320px]">{systemInfo?.systemPaths?.javaPath || "Detected in standard paths"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Ghidra Installation:</span>
                    <span className="text-[#f59e0b] truncate max-w-[320px]">{systemInfo?.systemPaths?.ghidraPath || "Auto-search active (/opt, ~/ghidra)"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">REA Engine Availability:</span>
                    <span className="text-[#f97316]">{systemInfo?.systemPaths?.reaAvailable ? "Ready (npx on-demand / local)" : "Available via npx"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "llm" ? (
            /* TAB 2: LLM REASONING */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>LLM Reasoning Engine & Local Offline AI</span>
                </span>

                <button
                  onClick={handleScanLocal}
                  disabled={scanningLocal}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#202432] border border-[#2d3144] text-[11px] text-[#cbd5e1] hover:text-[#f0f1f5] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 text-[#22c55e] ${scanningLocal ? "animate-spin" : ""}`} />
                  <span>{scanningLocal ? "Scanning :11434 / :1234..." : "Scan Local LLMs (Ollama / LM Studio)"}</span>
                </button>
              </div>

              {localScanMessage && (
                <div className="p-2.5 rounded-lg bg-[#141a1f] border border-[#22394a] text-xs text-[#38bdf8] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span>{localScanMessage}</span>
                </div>
              )}

              {/* Provider Selection Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#8b8f9e] block">Select LLM Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "openai", label: "OpenAI Cloud", desc: "gpt-4o", defaultUrl: "" },
                    { id: "ollama", label: "Ollama Local", desc: "Port 11434", defaultUrl: "http://127.0.0.1:11434/v1" },
                    { id: "lmstudio", label: "LM Studio", desc: "Port 1234", defaultUrl: "http://127.0.0.1:1234/v1" },
                    { id: "custom", label: "Custom OpenAI", desc: "Self-hosted", defaultUrl: baseUrl || "http://127.0.0.1:8000/v1" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProvider(p.id);
                        if (p.defaultUrl) setBaseUrl(p.defaultUrl);
                        if (p.id === "ollama") {
                          if (localOllamaModels.length > 0) setModelName(localOllamaModels[0]);
                          else setModelName("qwen2.5-coder");
                        } else if (p.id === "lmstudio") {
                          if (localLmStudioModels.length > 0) setModelName(localLmStudioModels[0]);
                          else setModelName("deepseek-coder");
                        } else if (p.id === "openai") {
                          setModelName("gpt-4o");
                          setBaseUrl("");
                        }
                      }}
                      className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        provider === p.id
                          ? "border-[#f97316] bg-[#221812] shadow-md shadow-[#f97316]/10"
                          : "border-[#262a38] bg-[#12141a] hover:border-[#38bdf8]/40"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${provider === p.id ? "text-[#f97316]" : "text-[#f0f1f5]"}`}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-[#8b8f9e] font-mono">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Local Offline Banner */}
              {(provider === "ollama" || provider === "lmstudio") && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#142319] border border-[#22c55e]/30 text-[#22c55e]">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold block">LOCAL / OFFLINE — 100% Private Mode Active</span>
                    <span className="text-[11px] text-[#a7f3d0] opacity-90">
                      All decompiled code, disassembly, and AST structures are processed locally on your hardware. Zero telemetry.
                    </span>
                  </div>
                </div>
              )}

              {/* Model Picker or Manual Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#8b8f9e] mb-1 block">Active Model</label>
                  {provider === "ollama" && localOllamaModels.length > 0 ? (
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs cursor-pointer"
                    >
                      {localOllamaModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : provider === "lmstudio" && localLmStudioModels.length > 0 ? (
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs cursor-pointer"
                    >
                      {localLmStudioModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder={provider === "ollama" ? "qwen2.5-coder" : provider === "lmstudio" ? "deepseek-coder" : "gpt-4o"}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#8b8f9e] mb-1 block">
                    API Key {provider === "ollama" || provider === "lmstudio" ? "(Optional for Local)" : "(Required for Cloud)"}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === "ollama" || provider === "lmstudio" ? "local (not needed)" : "sk-proj-..."}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs placeholder:text-[#424656]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#8b8f9e] mb-1 block">
                  API Endpoint / Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://127.0.0.1:11434/v1"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs placeholder:text-[#424656]"
                />
              </div>
            </div>
          ) : (
            /* TAB 3: MCP SERVERS */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Model Context Protocol (mcp-servers.json)</span>
                </span>

                <button
                  onClick={handleTestConnections}
                  disabled={testingMcp}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#202432] border border-[#2d3144] text-[11px] text-[#cbd5e1] hover:text-[#f0f1f5] transition-colors cursor-pointer"
                >
                  {testingMcp ? (
                    <Loader2 className="w-3 h-3 text-[#f97316] animate-spin" />
                  ) : (
                    <Activity className="w-3 h-3 text-[#22c55e]" />
                  )}
                  <span>{testingMcp ? "Testing..." : "Test MCP Connections"}</span>
                </button>
              </div>

              {/* REA MCP Server */}
              <div className="p-3.5 rounded-xl bg-[#181a22] border border-[#242834] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#f97316]" />
                    <div>
                      <span className="font-semibold text-[#f0f1f5]">REA MCP Engine</span>
                      <span className="text-[10px] text-[#8b8f9e] ml-2">Electron / ASAR / JS Bundles</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {testResults.rea && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        testResults.rea.success
                          ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {testResults.rea.success ? `● Ready (${testResults.rea.latencyMs}ms)` : "○ Offline"}
                      </span>
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#8b8f9e]">
                      <input
                        type="checkbox"
                        checked={reaEnabled}
                        onChange={(e) => setReaEnabled(e.target.checked)}
                        className="rounded bg-[#101217] border-[#2d3140] text-[#f97316] focus:ring-0"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  value={reaCommand}
                  onChange={(e) => setReaCommand(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#8b8f9e] focus:text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs"
                />
              </div>

              {/* Ghidra MCP Server */}
              <div className="p-3.5 rounded-xl bg-[#181a22] border border-[#242834] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-semibold text-[#f0f1f5]">Ghidra MCP Server</span>
                      <span className="text-[10px] text-[#8b8f9e] ml-2">Native Decompilation</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {testResults.ghidra && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        testResults.ghidra.success
                          ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {testResults.ghidra.success ? `● Ready (${testResults.ghidra.latencyMs}ms)` : "○ Offline"}
                      </span>
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#8b8f9e]">
                      <input
                        type="checkbox"
                        checked={ghidraEnabled}
                        onChange={(e) => setGhidraEnabled(e.target.checked)}
                        className="rounded bg-[#101217] border-[#2d3140] text-[#f97316] focus:ring-0"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  value={ghidraCommand}
                  onChange={(e) => setGhidraCommand(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#8b8f9e] focus:text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs"
                />
              </div>

              {/* Playwright MCP Server */}
              <div className="p-3.5 rounded-xl bg-[#181a22] border border-[#242834] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="font-semibold text-[#f0f1f5]">Playwright MCP Server</span>
                      <span className="text-[10px] text-[#8b8f9e] ml-2">Web Application Recon</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {testResults.playwright && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        testResults.playwright.success
                          ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {testResults.playwright.success ? `● Ready (${testResults.playwright.latencyMs}ms)` : "○ Offline"}
                      </span>
                    )}

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#8b8f9e]">
                      <input
                        type="checkbox"
                        checked={playwrightEnabled}
                        onChange={(e) => setPlaywrightEnabled(e.target.checked)}
                        className="rounded bg-[#101217] border-[#2d3140] text-[#f97316] focus:ring-0"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  value={playwrightCommand}
                  onChange={(e) => setPlaywrightCommand(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#8b8f9e] focus:text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#20232d] bg-[#101217] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#6b7280]">
            Syncs with native OS environment and project configurations
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#181a20] hover:bg-[#20232c] text-xs font-medium text-[#8b8f9e] hover:text-[#f0f1f5] border border-[#262933] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#f97316]/20 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Config</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
