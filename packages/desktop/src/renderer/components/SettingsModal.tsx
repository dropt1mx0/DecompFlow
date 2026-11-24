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
  User,
  AlertCircle,
  Globe,
} from "lucide-react";
import { useI18n } from "../i18n";
import { McpTestResult, SystemInfo, PreferredNativeBackend } from "../types";

interface ProviderMeta {
  label: string;
  desc: string;
  badge?: string;
  defaultUrl: string;
  defaultModel: string;
  recommendedModels: string[];
  keyPlaceholder: string;
  keyLabel: string;
  isLocal?: boolean;
}

const PROVIDER_METADATA: Record<string, ProviderMeta> = {
  openai: {
    label: "OpenAI Cloud",
    desc: "GPT-4o & o-series",
    defaultUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    recommendedModels: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"],
    keyPlaceholder: "sk-proj-...",
    keyLabel: "OpenAI API Key",
  },
  deepseek: {
    label: "DeepSeek AI",
    desc: "Chat & R1 Reasoning",
    badge: "🧠 R1",
    defaultUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    recommendedModels: ["deepseek-chat", "deepseek-reasoner"],
    keyPlaceholder: "sk-...",
    keyLabel: "DeepSeek API Key",
  },
  qwen: {
    label: "Qwen (DashScope)",
    desc: "Alibaba Cloud / QwQ",
    badge: "🧠 QwQ",
    defaultUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen2.5-coder-32b-instruct",
    recommendedModels: [
      "qwen2.5-coder-32b-instruct",
      "qwen-max",
      "qwen2.5-coder-72b-instruct",
      "qwq-32b-preview",
    ],
    keyPlaceholder: "sk-...",
    keyLabel: "DashScope API Key",
  },
  nvidia: {
    label: "NVIDIA NIM",
    desc: "Nemotron & Open Weights",
    defaultUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "nvidia/nemotron-4-34b-instruct",
    recommendedModels: [
      "nvidia/nemotron-4-34b-instruct",
      "meta/llama-3.3-70b-instruct",
      "deepseek-ai/deepseek-r1",
    ],
    keyPlaceholder: "nvapi-...",
    keyLabel: "NVIDIA NIM API Key",
  },
  meta: {
    label: "Meta Llama (Groq)",
    desc: "Ultra-Fast Inference",
    defaultUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    recommendedModels: ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile"],
    keyPlaceholder: "gsk_...",
    keyLabel: "Groq API Key",
  },
  ollama: {
    label: "Ollama Local",
    desc: "Port 11434 (Private)",
    badge: "💻 Local",
    defaultUrl: "http://127.0.0.1:11434/v1",
    defaultModel: "qwen2.5-coder",
    recommendedModels: ["qwen2.5-coder", "deepseek-r1", "llama3.3"],
    keyPlaceholder: "Not required for local engine",
    keyLabel: "Optional Key",
    isLocal: true,
  },
  lmstudio: {
    label: "LM Studio",
    desc: "Port 1234 (Private)",
    badge: "💻 Local",
    defaultUrl: "http://127.0.0.1:1234/v1",
    defaultModel: "deepseek-coder",
    recommendedModels: ["deepseek-coder", "qwen2.5-coder-7b", "deepseek-r1"],
    keyPlaceholder: "Not required for local engine",
    keyLabel: "Optional Key",
    isLocal: true,
  },
  custom: {
    label: "Custom Endpoint",
    desc: "OpenAI-Compatible",
    defaultUrl: "http://127.0.0.1:8000/v1",
    defaultModel: "gpt-4o",
    recommendedModels: ["gpt-4o", "deepseek-chat"],
    keyPlaceholder: "Bearer token",
    keyLabel: "Custom API Key / Token",
  },
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onSaveUsername?: (username: string) => void;
  preferredBackend?: PreferredNativeBackend;
  onSavePreferredBackend?: (backend: PreferredNativeBackend) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  username,
  onSaveUsername,
  preferredBackend = "ghidra",
  onSavePreferredBackend,
}) => {
  const { language, setLanguage, l } = useI18n();
  const [activeTab, setActiveTab] = useState<"system" | "llm" | "mcp">("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User Profile
  const [usernameInput, setUsernameInput] = useState<string>(
    username || localStorage.getItem("decompflow_username") || "dropt1m"
  );

  // Native Decompiler Backend
  const [preferredDecompiler, setPreferredDecompiler] = useState<PreferredNativeBackend>(
    preferredBackend ||
      (localStorage.getItem("decompflow_preferred_backend") as PreferredNativeBackend) ||
      "ghidra"
  );

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
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: "",
    deepseek: "",
    qwen: "",
    nvidia: "",
    meta: "",
  });

  // LLM Connection Testing
  const [testingLlm, setTestingLlm] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
    modelUsed?: string;
  } | null>(null);

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

  // Desktop Shortcut
  const [creatingShortcut, setCreatingShortcut] = useState(false);
  const [shortcutResult, setShortcutResult] = useState<{ success: boolean; path?: string; error?: string } | null>(null);

  // Raw configs for safe merging
  const [rawYaml, setRawYaml] = useState<any>({});
  const [rawMcp, setRawMcp] = useState<any>({});

  useEffect(() => {
    if (!isOpen) return;
    setUsernameInput(username || localStorage.getItem("decompflow_username") || "dropt1m");
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
            if (yamlCfg.llm.api_keys) {
              setApiKeys((prev) => ({
                ...prev,
                ...yamlCfg.llm.api_keys,
                openai: yamlCfg.llm.api_keys.openai || res.envApiKey || prev.openai || "",
              }));
            }
          }

          if (res.envApiKey) {
            setApiKey(res.envApiKey);
            setApiKeys((prev) => ({ ...prev, openai: prev.openai || res.envApiKey }));
          }

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

  const handleCreateShortcut = async () => {
    if (!window.electronAPI?.createDesktopShortcut) return;
    setCreatingShortcut(true);
    setShortcutResult(null);
    try {
      const res = await window.electronAPI.createDesktopShortcut();
      setShortcutResult(res);
    } catch (err: any) {
      setShortcutResult({ success: false, error: err.message || String(err) });
    } finally {
      setCreatingShortcut(false);
    }
  };

  const handleTestLlmConnection = async () => {
    setTestingLlm(true);
    setLlmTestResult(null);
    try {
      if (window.electronAPI?.testLlmConnection) {
        const activeKey = apiKeys[provider] || apiKey;
        const res = await window.electronAPI.testLlmConnection({
          provider,
          baseUrl: baseUrl || undefined,
          apiKey: activeKey || undefined,
          model: modelName || undefined,
        });
        setLlmTestResult(res);
      }
    } catch (err: any) {
      setLlmTestResult({ success: false, error: err.message || String(err) });
    } finally {
      setTestingLlm(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("decompflow_preferred_backend", preferredDecompiler);
      if (onSavePreferredBackend) {
        onSavePreferredBackend(preferredDecompiler);
      }
      const activeKey = apiKey || apiKeys[provider] || "";
      const updatedApiKeys = {
        ...apiKeys,
        [provider]: activeKey,
      };

      const updatedYaml = {
        ...rawYaml,
        native_decompiler: {
          preferred: preferredDecompiler,
        },
        llm: {
          ...(rawYaml.llm || {}),
          provider,
          model: modelName,
          temperature,
          ...(baseUrl ? { base_url: baseUrl } : {}),
          api_keys: updatedApiKeys,
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
          envApiKey: updatedApiKeys.openai || apiKey,
        });
      }

      const trimmedUser = usernameInput.trim() || "dropt1m";
      localStorage.setItem("decompflow_username", trimmedUser);
      if (onSaveUsername) {
        onSaveUsername(trimmedUser);
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
              <h3 className="text-sm font-bold text-[#f0f1f5]">{l.settings.title}</h3>
              <p className="text-[11px] text-[#6b7280]">
                {l.settings.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "ru" : "en")}
              className="px-2.5 py-1 rounded-lg bg-[#1a1d27] hover:bg-[#232736] text-xs font-mono font-bold text-[#38bdf8] border border-[#272b3b] transition-colors cursor-pointer"
              title={l.breadcrumbs.switchLanguage}
            >
              {language.toUpperCase()}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#f0f1f5] hover:bg-[#1f222c] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
            <span>{l.settings.tabSystem}</span>
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
            <span>{l.settings.tabLlm}</span>
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
            <span>{l.settings.tabMcp}</span>
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
              {/* User Profile Card */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>{l.settings.usernameLabel}</span>
                </span>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#cbd5e1] font-medium block">{l.settings.usernameLabel}</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter username (e.g. dropt1m)"
                    className="w-full bg-[#11131a] border border-[#262a38] rounded-lg px-3 py-2 text-xs text-[#f0f1f5] font-mono focus:outline-none focus:border-[#f97316]"
                  />
                  <span className="text-[10px] text-[#6b7280] block">
                    {l.settings.usernameDesc}
                  </span>
                </div>
              </div>

              {/* Language Selection Card */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>{l.settings.languageLabel}</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      language === "en"
                        ? "bg-[#162032] border-[#38bdf8] text-[#f0f1f5]"
                        : "bg-[#11131a] border-[#262a38] text-[#8b8f9e] hover:text-[#f0f1f5]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇬🇧</span>
                      <div className="text-left">
                        <span className="font-semibold block text-xs">English</span>
                        <span className="text-[10px] text-[#6b7280]">Default interface</span>
                      </div>
                    </div>
                    {language === "en" && <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("ru")}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      language === "ru"
                        ? "bg-[#251d19] border-[#f97316] text-[#f0f1f5]"
                        : "bg-[#11131a] border-[#262a38] text-[#8b8f9e] hover:text-[#f0f1f5]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇷🇺</span>
                      <div className="text-left">
                        <span className="font-semibold block text-xs">Русский</span>
                        <span className="text-[10px] text-[#6b7280]">Профессиональный реверс</span>
                      </div>
                    </div>
                    {language === "ru" && <CheckCircle2 className="w-4 h-4 text-[#f97316]" />}
                  </button>
                </div>
              </div>

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

              {/* Desktop Integration & Shortcut Card */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Desktop Integration & Launcher Shortcut</span>
                </span>

                <p className="text-[11px] text-[#8b8f9e]">
                  Create a native launcher shortcut on your Desktop and Applications Menu with the DecompFlow mascot icon.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateShortcut}
                    disabled={creatingShortcut}
                    className="px-3.5 py-2 rounded-lg bg-[#242834] hover:bg-[#2e3342] text-[#f0f1f5] font-medium text-xs flex items-center gap-2 border border-[#34384a] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {creatingShortcut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f97316]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
                    )}
                    <span>Create Desktop Shortcut</span>
                  </button>

                  {shortcutResult?.success && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Created: {shortcutResult.path}</span>
                    </span>
                  )}

                  {shortcutResult && !shortcutResult.success && (
                    <span className="text-[11px] font-mono text-rose-400">
                      Error: {shortcutResult.error}
                    </span>
                  )}
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
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Capa (Capability Detector):</span>
                    <span className="text-[#22c55e] truncate max-w-[320px]">{systemInfo?.systemPaths?.capaPath || "Detected via PATH / Heuristic fallback"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Radare2 / Rizin (Fast Mode):</span>
                    <span className="text-[#22c55e] truncate max-w-[320px]">{systemInfo?.systemPaths?.r2Path || "Detected via PATH"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Jadx (Android / Java APK):</span>
                    <span className="text-[#38bdf8] truncate max-w-[320px]">{systemInfo?.systemPaths?.jadxPath || "Detected via PATH / ZIP DEX Parser"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">IDA Pro MCP (:13337):</span>
                    <span className={systemInfo?.systemPaths?.idaProMcp ? "text-[#22c55e] font-bold" : "text-[#8b8f9e]"}>
                      {systemInfo?.systemPaths?.idaProMcp ? "🟢 Online (Port 13337 Open)" : "⚪ Offline (127.0.0.1:13337)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#11131a] border border-[#202330]">
                    <span className="text-[#8b8f9e]">Binary Ninja MCP (:13338):</span>
                    <span className={systemInfo?.systemPaths?.binjaMcp ? "text-[#22c55e] font-bold" : "text-[#8b8f9e]"}>
                      {systemInfo?.systemPaths?.binjaMcp ? "🟢 Online (Port 13338 Open)" : "⚪ Offline (127.0.0.1:13338)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferred Native Decompiler Backend */}
              <div className="p-4 rounded-xl bg-[#181a22] border border-[#242834] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Preferred Native Decompiler Backend</span>
                </span>
                <p className="text-[11px] text-[#8b8f9e]">
                  Active decompiler engine for targeted function deep dives (sub_XXXX) on native binaries.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "ghidra", label: "Ghidra", desc: "JVM Headless", tag: "Heavy / Full AST" },
                    { id: "radare2", label: "Radare2 / Rizin", desc: "r2 pdc/pdg", tag: "Sub-second Fast" },
                    { id: "ida", label: "IDA Pro (External)", desc: "127.0.0.1:13337", tag: "Hex-Rays Bridge" },
                    { id: "binja", label: "Binary Ninja (External)", desc: "127.0.0.1:13338", tag: "HLIL/BNIL Bridge" },
                  ].map((dec) => (
                    <button
                      key={dec.id}
                      type="button"
                      onClick={() => setPreferredDecompiler(dec.id as PreferredNativeBackend)}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        preferredDecompiler === dec.id
                          ? "border-[#f97316] bg-[#241a14] text-[#f0f1f5]"
                          : "border-[#252836] bg-[#11131a] text-[#8b8f9e] hover:border-[#384055] hover:text-[#f0f1f5]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">{dec.label}</span>
                          {preferredDecompiler === dec.id && (
                            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                          )}
                        </div>
                        <span className="text-[10px] text-[#6b7280] block font-mono">{dec.desc}</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-mono text-[#f97316] mt-2 block">
                        {dec.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "llm" ? (
            /* TAB 2: LLM REASONING */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#8b8f9e] tracking-wider block font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Multi-Model Provider Hub & Offline Engines</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleScanLocal}
                    disabled={scanningLocal}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#202432] border border-[#2d3144] text-[11px] text-[#cbd5e1] hover:text-[#f0f1f5] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#22c55e] ${scanningLocal ? "animate-spin" : ""}`} />
                    <span>{scanningLocal ? "Scanning :11434 / :1234..." : "Scan Local (Ollama / LM Studio)"}</span>
                  </button>
                </div>
              </div>

              {localScanMessage && (
                <div className="p-2.5 rounded-lg bg-[#141a1f] border border-[#22394a] text-xs text-[#38bdf8] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span>{localScanMessage}</span>
                </div>
              )}

              {/* Provider Selection Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#8b8f9e] block">Select Inference Provider</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(PROVIDER_METADATA).map(([id, meta]) => {
                    const isSelected = provider === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setProvider(id);
                          setBaseUrl(meta.defaultUrl);
                          setLlmTestResult(null);
                          if (id === "ollama") {
                            if (localOllamaModels.length > 0) setModelName(localOllamaModels[0]);
                            else setModelName("qwen2.5-coder");
                          } else if (id === "lmstudio") {
                            if (localLmStudioModels.length > 0) setModelName(localLmStudioModels[0]);
                            else setModelName("deepseek-coder");
                          } else {
                            setModelName(meta.defaultModel);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#f97316] bg-[#221812] shadow-md shadow-[#f97316]/10"
                            : "border-[#262a38] bg-[#12141a] hover:border-[#38bdf8]/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-semibold ${isSelected ? "text-[#f97316]" : "text-[#f0f1f5]"}`}>
                              {meta.label}
                            </span>
                            {meta.badge && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#f97316]/15 text-[#f97316] font-mono">
                                {meta.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#8b8f9e] font-mono block truncate">{meta.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Local Offline Banner */}
              {(provider === "ollama" || provider === "lmstudio") && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#142319] border border-[#22c55e]/30 text-[#22c55e]">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold block">LOCAL / OFFLINE — 100% Private Engine Active</span>
                    <span className="text-[11px] text-[#a7f3d0] opacity-90">
                      All decompiled code, disassembly, and AST structures are processed locally on your hardware. Zero telemetry.
                    </span>
                  </div>
                </div>
              )}

              {/* Reasoning Model Alert */}
              {(modelName.toLowerCase().includes("reasoner") ||
                modelName.toLowerCase().includes("r1") ||
                modelName.toLowerCase().includes("qwq")) && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#241a14] border border-[#f97316]/40 text-[#f97316]">
                  <Sparkles className="w-5 h-5 shrink-0 text-[#f97316]" />
                  <div className="text-xs">
                    <span className="font-semibold block">Reasoning Engine Activated</span>
                    <span className="text-[11px] text-[#fed7aa] opacity-90">
                      Multi-hop chain of thought (<code className="text-[#f97316] font-mono">&lt;think&gt;...&lt;/think&gt;</code>) is streamed directly into the Agent Reasoning Tree without breaking structured output schemas.
                    </span>
                  </div>
                </div>
              )}

              {/* Model Picker & Recommended Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-[#8b8f9e] block">Model Identifier</label>
                  {PROVIDER_METADATA[provider]?.recommendedModels && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#6b7280]">Presets:</span>
                      {PROVIDER_METADATA[provider].recommendedModels.map((rec) => (
                        <button
                          key={rec}
                          type="button"
                          onClick={() => {
                            setModelName(rec);
                            setLlmTestResult(null);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors cursor-pointer ${
                            modelName === rec
                              ? "bg-[#f97316]/20 border-[#f97316] text-[#f97316]"
                              : "bg-[#11131a] border-[#252838] text-[#8b8f9e] hover:text-[#f0f1f5]"
                          }`}
                        >
                          {rec}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    {provider === "ollama" && localOllamaModels.length > 0 ? (
                      <select
                        value={modelName}
                        onChange={(e) => {
                          setModelName(e.target.value);
                          setLlmTestResult(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs cursor-pointer"
                      >
                        {localOllamaModels.map((m) => (
                          <option key={m} value={m}>
                            {m} (Detected)
                          </option>
                        ))}
                      </select>
                    ) : provider === "lmstudio" && localLmStudioModels.length > 0 ? (
                      <select
                        value={modelName}
                        onChange={(e) => {
                          setModelName(e.target.value);
                          setLlmTestResult(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs cursor-pointer"
                      >
                        {localLmStudioModels.map((m) => (
                          <option key={m} value={m}>
                            {m} (Detected)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={modelName}
                        onChange={(e) => {
                          setModelName(e.target.value);
                          setLlmTestResult(null);
                        }}
                        placeholder={PROVIDER_METADATA[provider]?.defaultModel || "model-name"}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <input
                      type="password"
                      value={apiKeys[provider] ?? apiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApiKey(val);
                        setApiKeys((prev) => ({ ...prev, [provider]: val }));
                        setLlmTestResult(null);
                      }}
                      placeholder={PROVIDER_METADATA[provider]?.keyPlaceholder || "API Key"}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs placeholder:text-[#424656]"
                    />
                  </div>
                </div>
              </div>

              {/* Base URL and Test Connection Row */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#8b8f9e] block">
                  API Endpoint / Base URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => {
                      setBaseUrl(e.target.value);
                      setLlmTestResult(null);
                    }}
                    placeholder={PROVIDER_METADATA[provider]?.defaultUrl || "https://api.openai.com/v1"}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#101217] border border-[#2d3140] text-[#f0f1f5] outline-none focus:border-[#f97316] font-mono text-xs placeholder:text-[#424656]"
                  />

                  <button
                    type="button"
                    onClick={handleTestLlmConnection}
                    disabled={testingLlm}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c202a] hover:bg-[#252b3a] border border-[#2f3548] text-xs text-[#cbd5e1] hover:text-white font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {testingLlm ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#f97316] animate-spin" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-[#22c55e]" />
                    )}
                    <span>{testingLlm ? "Pinging..." : "Test Connection"}</span>
                  </button>
                </div>
              </div>

              {/* Live Test Connection Result */}
              {llmTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    llmTestResult.success
                      ? "bg-[#142319] border-[#22c55e]/40 text-[#22c55e]"
                      : "bg-[#251414] border-[#ef4444]/40 text-[#fca5a5]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {llmTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22c55e]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#ef4444]" />
                    )}
                    <div>
                      <span className="font-semibold block">
                        {llmTestResult.success ? "Connection Verified Successfully" : "Connection Failed"}
                      </span>
                      <span className="text-[11px] opacity-90 block">
                        {llmTestResult.success
                          ? `Model: ${llmTestResult.modelUsed || modelName} • Latency: ${llmTestResult.latencyMs ?? 0}ms`
                          : llmTestResult.error || "Unable to reach endpoint"}
                      </span>
                    </div>
                  </div>

                  {llmTestResult.success && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30">
                      ONLINE
                    </span>
                  )}
                </div>
              )}
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
              {l.common.cancel}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#f97316]/20 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{l.common.saving}</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{l.common.saved}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{l.settings.saveSettingsBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
