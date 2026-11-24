import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Cpu,
  Layers,
  Terminal,
  Compass,
  Zap,
  Shield,
  Copy,
  Check,
  Code2,
  Workflow,
  Boxes,
  ExternalLink,
  Laptop,
  HelpCircle,
  FileCode,
  Globe,
  Package,
  Sparkles,
  Command,
  Languages,
} from "lucide-react";
import { useI18n } from "../i18n";

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocTab = "overview" | "engines" | "guide" | "shortcuts";

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, l } = useI18n();
  const [activeTab, setActiveTab] = useState<DocTab>("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isMac =
    typeof navigator !== "undefined" &&
    (navigator.platform?.toLowerCase().includes("mac") ||
      navigator.userAgent.toLowerCase().includes("mac"));

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-4xl bg-[#111319] border border-[#232734] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f222d] bg-[#14161f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1b1f2b] border border-[#292f42] flex items-center justify-center shadow-inner">
              <BookOpen className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#f0f1f5]">{l.docs.title}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280]">
                {l.docs.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "ru" : "en")}
              className="px-2.5 py-1 rounded-lg bg-[#181a22] hover:bg-[#20232e] text-xs font-mono font-bold text-[#38bdf8] border border-[#272b3b] transition-colors cursor-pointer"
              title={l.breadcrumbs.switchLanguage}
            >
              {language.toUpperCase()}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#f0f1f5] hover:bg-[#1c202a] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#1f222d] bg-[#0d0f15] gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-[#f97316] text-[#f97316] bg-[#151822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>{l.docs.tabOverview}</span>
          </button>

          <button
            onClick={() => setActiveTab("engines")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "engines"
                ? "border-[#f97316] text-[#f97316] bg-[#151822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{l.docs.tabEngines}</span>
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "guide"
                ? "border-[#f97316] text-[#f97316] bg-[#151822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{l.docs.tabGuide}</span>
          </button>

          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "shortcuts"
                ? "border-[#f97316] text-[#f97316] bg-[#151822]"
                : "border-transparent text-[#8b8f9e] hover:text-[#f0f1f5]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{l.docs.tabShortcuts}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text text-sm leading-relaxed text-[#cbd5e1] font-sans">
          {/* TAB 1: OVERVIEW & PHILOSOPHY */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Hero Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#171a24] to-[#12141c] border border-[#252938] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 border border-[#f97316]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-[#f97316]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#f0f1f5]">
                    {l.docs.heroTitle}
                  </h4>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    {l.docs.heroDesc}
                  </p>
                </div>
              </div>

              {/* Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#14161f] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2 text-[#38bdf8]">
                    <Workflow className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">{l.docs.langGraphTitle}</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.langGraphDesc}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14161f] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2 text-[#22c55e]">
                    <Zap className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">{l.docs.tieredTitle}</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.tieredDesc}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14161f] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2 text-[#f97316]">
                    <Shield className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">{l.docs.airGappedTitle}</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.airGappedDesc}
                  </p>
                </div>
              </div>

              {/* Multi-Hop Reasoning Philosophy */}
              <div className="p-4 rounded-xl bg-[#13151e] border border-[#202432] space-y-3">
                <h5 className="text-xs font-bold text-[#f0f1f5] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#38bdf8]" />
                  <span>{l.docs.multiHopTitle}</span>
                </h5>
                <p className="text-xs text-[#94a3b8]">
                  {l.docs.multiHopDesc}
                </p>
                <ol className="list-decimal list-inside text-xs text-[#cbd5e1] space-y-1.5 pl-1">
                  <li>{l.docs.hop1}</li>
                  <li>{l.docs.hop2}</li>
                  <li>{l.docs.hop3}</li>
                  <li>{l.docs.hop4}</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: MCP ENGINES & PRO TOOLING */}
          {activeTab === "engines" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-[#94a3b8]">
                {language === "ru"
                  ? "Архитектура Zero-Overhead гарантирует ленивый запуск (Lazy Spawn): процессы поднимаются строго по необходимости и выгружаются по тайм-ауту без расхода системных ресурсов."
                  : "Zero-Overhead lazy spawn architecture ensures MCP processes are spawned strictly on-demand by graph nodes and unloaded after idle timeouts."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Engine: Capa */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">{l.docs.capaTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {l.docs.capaBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.capaDesc}
                  </p>
                </div>

                {/* Engine: Radare2 / Rizin */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">{l.docs.r2Title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {l.docs.r2Badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.r2Desc}
                  </p>
                </div>

                {/* Engine: Ghidra */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#f97316]" />
                      <span className="text-xs font-bold text-[#f0f1f5]">{l.docs.ghidraTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20">
                      {l.docs.ghidraBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.ghidraDesc}
                  </p>
                </div>

                {/* Engine: Jadx */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">{l.docs.jadxTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {l.docs.jadxBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.jadxDesc}
                  </p>
                </div>

                {/* Engine: REA */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">{l.docs.reaTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {l.docs.reaBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.reaDesc}
                  </p>
                </div>

                {/* Engine: Playwright */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">{l.docs.playwrightTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {l.docs.playwrightBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {l.docs.playwrightDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP GUIDE */}
          {activeTab === "guide" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-[#141620] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#f97316] text-[#111319] text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h5 className="text-xs font-bold text-[#f0f1f5]">{l.docs.step1Title}</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8] pl-8">
                    {l.docs.step1Desc}
                  </p>
                  <div className="pl-8 flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#0d0f15] border border-[#1f222e] text-[#cbd5e1]">
                      .exe, .dll, .sys (PE / Windows)
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#0d0f15] border border-[#1f222e] text-[#cbd5e1]">
                      .elf, .so (ELF / Linux / Android)
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#0d0f15] border border-[#1f222e] text-[#cbd5e1]">
                      .apk, .dex (Android Mobile)
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#0d0f15] border border-[#1f222e] text-[#cbd5e1]">
                      .asar, dist/ (Electron / Node)
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-[#141620] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#38bdf8] text-[#111319] text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h5 className="text-xs font-bold text-[#f0f1f5]">{l.docs.step2Title}</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8] pl-8">
                    {l.docs.step2Desc}
                  </p>
                  <div className="pl-8 grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#0d0f15] border border-[#1f222e]">
                      <span className="text-amber-400 font-bold block text-[11px]">⚡ {l.input.profileFast}</span>
                      <span className="text-[#8b8f9e] text-[10px] mt-0.5 block">
                        {language === "ru" ? "Мгновенный срез поверхностей атаки, Capa-правила и строки (< 1 сек)." : "Instant attack surface scan, Capa rules, and strings (< 1s)."}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0d0f15] border border-[#1f222e]">
                      <span className="text-[#38bdf8] font-bold block text-[11px]">⚖️ {l.input.profileAuto}</span>
                      <span className="text-[#8b8f9e] text-[10px] mt-0.5 block">
                        {language === "ru" ? "Умный эвристический запуск L1, переход к Ghidra только для подозрительных функций." : "Heuristic L1 triage, triggering Ghidra only for suspicious functions."}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0d0f15] border border-[#1f222e]">
                      <span className="text-[#f97316] font-bold block text-[11px]">🔬 {l.input.profileDeep}</span>
                      <span className="text-[#8b8f9e] text-[10px] mt-0.5 block">
                        {language === "ru" ? "Полномасштабный реверс-инжиниринг с генерацией всего C/Java псевдокода." : "Full-scale reverse engineering with full C/Java pseudocode generation."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-[#141620] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e] text-[#111319] text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h5 className="text-xs font-bold text-[#f0f1f5]">{l.docs.step3Title}</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8] pl-8">
                    {l.docs.step3Desc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHORTCUTS & CLI */}
          {activeTab === "shortcuts" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Keyboard Shortcuts */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-[#f0f1f5] uppercase tracking-wider flex items-center gap-2">
                  <Command className="w-4 h-4 text-[#38bdf8]" />
                  <span>{l.docs.shortcutsTitle}</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">{language === "ru" ? "Быстрый поиск по чатам и проектам" : "Quick search across chats & projects"}</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#38bdf8]">
                      {isMac ? "⌘K" : "Ctrl+K"}
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">{language === "ru" ? "Создать новый чат / сессию" : "Create new chat session"}</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#38bdf8]">
                      {isMac ? "⌘N" : "Ctrl+N"}
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">{language === "ru" ? "Закрыть панель кода или модальное окно" : "Close code drawer or active modal"}</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#cbd5e1]">
                      Esc
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">{language === "ru" ? "Отправить запрос на анализ" : "Launch analysis run"}</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#22c55e]">
                      Enter
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">{language === "ru" ? "Перенос строки в поле ввода" : "Newline in prompt input"}</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#cbd5e1]">
                      Shift+Enter
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">{language === "ru" ? "Свернуть / развернуть боковое меню" : "Toggle sidebar visibility"}</span>
                    <span className="text-[11px] font-mono text-[#8b8f9e]">{language === "ru" ? "Кнопка в верхнем баре" : "Top bar icon"}</span>
                  </div>
                </div>
              </div>

              {/* CLI Command Cheat Sheet */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-[#f0f1f5] uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#f97316]" />
                  <span>{l.docs.cliTitle}</span>
                </h5>

                <div className="space-y-2.5">
                  {/* CLI Snippet 1 */}
                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f222e] flex items-center justify-between font-mono text-xs">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-[#64748b] text-[10px] block font-sans">
                        {l.docs.cmd1Desc}
                      </span>
                      <code className="text-[#f97316] truncate block">
                        npx decompflow analyze ./sample.exe --mode binary --profile fast
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          "npx decompflow analyze ./sample.exe --mode binary --profile fast",
                          "cmd1"
                        )
                      }
                      className="p-1.5 rounded-lg bg-[#141620] hover:bg-[#1e2130] text-[#8b8f9e] hover:text-[#f0f1f5] transition-colors shrink-0 cursor-pointer"
                      title="Copy command"
                    >
                      {copiedKey === "cmd1" ? (
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* CLI Snippet 2 */}
                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f222e] flex items-center justify-between font-mono text-xs">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-[#64748b] text-[10px] block font-sans">
                        {l.docs.cmd2Desc}
                      </span>
                      <code className="text-[#38bdf8] truncate block">
                        npx decompflow analyze ./target.elf --skill security-audit --backend ghidra
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          "npx decompflow analyze ./target.elf --skill security-audit --backend ghidra",
                          "cmd2"
                        )
                      }
                      className="p-1.5 rounded-lg bg-[#141620] hover:bg-[#1e2130] text-[#8b8f9e] hover:text-[#f0f1f5] transition-colors shrink-0 cursor-pointer"
                      title="Copy command"
                    >
                      {copiedKey === "cmd2" ? (
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* CLI Snippet 3 */}
                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f222e] flex items-center justify-between font-mono text-xs">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-[#64748b] text-[10px] block font-sans">
                        {l.docs.cmd3Desc}
                      </span>
                      <code className="text-[#22c55e] truncate block">
                        npx decompflow detect-models
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy("npx decompflow detect-models", "cmd3")}
                      className="p-1.5 rounded-lg bg-[#141620] hover:bg-[#1e2130] text-[#8b8f9e] hover:text-[#f0f1f5] transition-colors shrink-0 cursor-pointer"
                      title="Copy command"
                    >
                      {copiedKey === "cmd3" ? (
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1f222d] bg-[#0d0f15] flex items-center justify-between shrink-0 text-xs text-[#6b7280]">
          <span>DecompFlow Studio · Autonomous Reverse Engineering Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a1d27] hover:bg-[#232736] text-[#cbd5e1] hover:text-[#f0f1f5] font-medium transition-colors cursor-pointer border border-[#272b3b]"
          >
            {l.common.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
