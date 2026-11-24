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
} from "lucide-react";

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocTab = "overview" | "engines" | "guide" | "shortcuts";

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
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
                <h3 className="text-sm font-bold text-[#f0f1f5]">DecompFlow Knowledge Base & Guide</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30">
                  v0.1.0
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280]">
                Architecture, Tiered Orchestration, MCP Engines & Autonomous Reverse Engineering
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#f0f1f5] hover:bg-[#1c202a] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
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
            <span>Overview & Philosophy</span>
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
            <span>MCP Engines & Pro Tooling</span>
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
            <span>Step-by-Step Guide</span>
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
            <span>Shortcuts & CLI</span>
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
                    Autonomous AI Reverse Engineering Studio
                  </h4>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    DecompFlow объединяет силу современных языковых моделей (LLM) с промышленными
                    инструментами декомпиляции через протокол <strong>Model Context Protocol (MCP)</strong>.
                    Вместо слепого угадывания агент строит циклический граф доказательств, верифицирует
                    каждое утверждение реальными сниппетами кода и сохраняет полную приватность.
                  </p>
                </div>
              </div>

              {/* Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#14161f] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2 text-[#38bdf8]">
                    <Workflow className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">LangGraph Core</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Управление жизненным циклом анализа через стейт-машину LangGraph. Каждый шаг (Recon,
                    Decompile, Synthesize, Verify) выполняется детерминированным узлом графа с валидацией состояния.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14161f] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2 text-[#22c55e]">
                    <Zap className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">Tiered Orchestration</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Двухфазное разделение нагрузки: <strong>L1 Fast Triage</strong> (&lt; 1 сек) через Capa/Radare2
                    для выявления криптографии и секций, и <strong>L2 Deep Decompile</strong> (Ghidra/Jadx) strictly on-demand.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14161f] border border-[#222533] space-y-2">
                  <div className="flex items-center gap-2 text-[#f97316]">
                    <Shield className="w-4 h-4" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">Air-Gapped & Local</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Полная поддержка локальных офлайн-моделей (через Ollama и LM Studio) и изолированных локальных
                    CLI-инструментов без отправки конфиденциального проприетарного кода во внешние облака.
                  </p>
                </div>
              </div>

              {/* Multi-Hop Reasoning Philosophy */}
              <div className="p-4 rounded-xl bg-[#13151e] border border-[#202432] space-y-3">
                <h5 className="text-xs font-bold text-[#f0f1f5] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#38bdf8]" />
                  <span>Концепция Multi-Hop Evidence Collection</span>
                </h5>
                <p className="text-xs text-[#94a3b8]">
                  В отличие от обычных чат-ботов, которые "галлюцинируют" логику закрытых бинарников, DecompFlow
                  использует методику <em>Multi-Hop Verification</em>:
                </p>
                <ol className="list-decimal list-inside text-xs text-[#cbd5e1] space-y-1.5 pl-1">
                  <li>
                    <strong className="text-[#f0f1f5]">Hop 1 — Surface Indexing:</strong> Сбор хешей,
                    архитектуры (x86_64, ARM64, Dalvik), строк и таблицы внешних библиотек.
                  </li>
                  <li>
                    <strong className="text-[#f0f1f5]">Hop 2 — Capability Scanning:</strong> Выявление паттернов
                    (AES/RSA константы, сетевые сокеты, системные вызовы через Capa).
                  </li>
                  <li>
                    <strong className="text-[#f0f1f5]">Hop 3 — Targeted Decompilation:</strong> Декомпиляция только
                    интересующих функций (sub_*, handlers, onClick) вместо трансляции всего бинарника.
                  </li>
                  <li>
                    <strong className="text-[#f0f1f5]">Hop 4 — Evidence Pinning:</strong> Каждый вывод в итоговом
                    отчете подтверждается ссылкой на точный адрес памяти или файл со сниппетом в инспекторе кода.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: MCP ENGINES & PRO TOOLING */}
          {activeTab === "engines" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-[#94a3b8]">
                Архитектура <strong>Zero-Overhead</strong> гарантирует ленивый запуск (Lazy Spawn): процессы
                поднимаются строго по необходимости и выгружаются по тайм-ауту без расхода системных ресурсов.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Engine: Capa */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">Capa Explorer</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Tier 1 · Heuristic
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Молниеносный детектор возможностей бинарных файлов (Mandiant Capa). Определяет упаковщики,
                    анти-отладку, криптографические алгоритмы и сетевую активность за миллисекунды по базе правил.
                  </p>
                </div>

                {/* Engine: Radare2 / Rizin */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">Radare2 / Rizin</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Tier 1 · Fast Recon
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Легковесный парсер PE/ELF/Mach-O. Извлекает точки входа, энтропию секций, импорты,
                    экспорты и строковые литералы без тяжелых виртуальных машин.
                  </p>
                </div>

                {/* Engine: Ghidra */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#f97316]" />
                      <span className="text-xs font-bold text-[#f0f1f5]">Ghidra Decompiler</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20">
                      Tier 2 · Deep Decompile
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Промышленный JVM-декомпилятор АНБ (NSA). Строит Abstract Syntax Tree (AST), перекрестные ссылки (Xrefs)
                    и генерирует чистый C-псевдокод для целевых ассемблерных функций.
                  </p>
                </div>

                {/* Engine: Jadx */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">Jadx Mobile Engine</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Tier 2 · Mobile APK
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Транслятор Android Dalvik Executable (DEX/APK) в исходный Java/Kotlin код.
                    Парсит AndroidManifest.xml, службы, разрешения и deeplinks.
                  </p>
                </div>

                {/* Engine: REA */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">REA Protocol Bridge</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      MCP · Introspection
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Reverse Engineering Assistant MCP Server. Интерактивная среда для запросов метаданных,
                    вызова локальных дизассемблеров и сопоставления сигнатур функций.
                  </p>
                </div>

                {/* Engine: Playwright */}
                <div className="p-4 rounded-xl bg-[#13151f] border border-[#202433] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-[#f0f1f5]">Playwright Web Agent</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      MCP · Web & API
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Headless браузерный движок для аудита веб-приложений. Картографирует скрытые API-роуты,
                    перехватывает трафик и извлекает бандлы клиентского JavaScript.
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
                    <h5 className="text-xs font-bold text-[#f0f1f5]">Выбор цели для исследования</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8] pl-8">
                    Перетащите исследуемый файл прямо в окно DecompFlow Studio (Drag-and-Drop) или нажмите
                    на иконку папки в строке ввода.
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
                    <h5 className="text-xs font-bold text-[#f0f1f5]">Настройка профиля скорости (Engine Profile)</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8] pl-8">
                    В панели ввода выберите оптимальный режим оркестрации в зависимости от глубины задачи:
                  </p>
                  <div className="pl-8 grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#0d0f15] border border-[#1f222e]">
                      <span className="text-amber-400 font-bold block text-[11px]">⚡ Fast Triage</span>
                      <span className="text-[#8b8f9e] text-[10px] mt-0.5 block">
                        Мгновенный срез поверхностей атаки, Capa-правила и строки (&lt; 1 сек).
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0d0f15] border border-[#1f222e]">
                      <span className="text-[#38bdf8] font-bold block text-[11px]">⚖️ Auto (Balanced)</span>
                      <span className="text-[#8b8f9e] text-[10px] mt-0.5 block">
                        Умный эвристический запуск L1, переход к Ghidra только для подозрительных функций.
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0d0f15] border border-[#1f222e]">
                      <span className="text-[#f97316] font-bold block text-[11px]">🔬 Deep Decompile</span>
                      <span className="text-[#8b8f9e] text-[10px] mt-0.5 block">
                        Полномасштабный реверс-инжиниринг с генерацией всего C/Java псевдокода.
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
                    <h5 className="text-xs font-bold text-[#f0f1f5]">Интерактивная работа с EvidenceCodeDrawer</h5>
                  </div>
                  <p className="text-xs text-[#94a3b8] pl-8">
                    Кликайте на любые найденные символы, адреса памяти (0x...) или теги доказательств в чате и отчете.
                    Справа откроется инспектор кода с подсветкой синтаксиса, Cross References (Xrefs) и кнопкой
                    <strong> "Запустить Deep Dive"</strong> для целенаправленного разбора логики без перезапуска сессии.
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
                  <span>Горячие клавиши (Keyboard Shortcuts)</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">Быстрый поиск по чатам и проектам</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#38bdf8]">
                      {isMac ? "⌘K" : "Ctrl+K"}
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">Создать новый чат / сессию</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#38bdf8]">
                      {isMac ? "⌘N" : "Ctrl+N"}
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">Закрыть панель кода или модальное окно</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#cbd5e1]">
                      Esc
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">Отправить запрос на анализ</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#22c55e]">
                      Enter
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">Перенос строки в поле ввода</span>
                    <kbd className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#0d0f15] border border-[#242838] text-[#cbd5e1]">
                      Shift+Enter
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141620] border border-[#222533]">
                    <span className="text-[#cbd5e1]">Свернуть / развернуть боковое меню</span>
                    <span className="text-[11px] font-mono text-[#8b8f9e]">Кнопка в верхнем баре</span>
                  </div>
                </div>
              </div>

              {/* CLI Command Cheat Sheet */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-[#f0f1f5] uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#f97316]" />
                  <span>Команды CLI (Headless & CI/CD Mode)</span>
                </h5>

                <div className="space-y-2.5">
                  {/* CLI Snippet 1 */}
                  <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f222e] flex items-center justify-between font-mono text-xs">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="text-[#64748b] text-[10px] block font-sans">
                        Быстрый триаж бинарного файла:
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
                        Глубокий аудит безопасности через Ghidra:
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
                        Детекция локальных моделей (Ollama / LM Studio):
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
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
