import { Annotation } from "@langchain/langgraph";

export type EngineProfile = "auto" | "fast-triage" | "deep-decompile";
export type PreferredNativeBackend = "ghidra" | "radare2" | "ida" | "binja";

export interface DetectedCapability {
  capability: string;
  namespace: string;
  address: string;
  confidence: string;
}

export interface EvidenceItem {
  source: string;
  location: string;
  snippet: string;
  confidence: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PendingQuery {
  server: string;
  tool: string;
  args: Record<string, any>;
  reason: string;
}

export const DecompFlowState = Annotation.Root({
  target: Annotation<string>,           // Путь к бинарнику, директории или URL
  mode: Annotation<"binary" | "web" | "source">,
  activeSkill: Annotation<string>,      // Загруженный .md скилл
  extractedData: Annotation<string>,    // Декомпилированный код / DOM / AST / REA Evidence
  findings: Annotation<string[]>,       // Выявленные модули, связи и дефекты
  evidence: Annotation<EvidenceItem[]>, // Цепочка доказательств (Evidence items)
  reconstructedCode: Annotation<string | undefined>, // Воссозданный код фичи
  userPrompt: Annotation<string | undefined>,        // Вопрос пользователя из инпута
  messages: Annotation<ChatMessage[] | undefined>,   // История сообщений для follow-up
  finalReport: Annotation<string>,      // Итоговый структурированный отчет
  outPath: Annotation<string | undefined>, // Путь сохранения отчета
  iteration: Annotation<number>,        // Текущий шаг многошаговой доразведки (0, 1, 2...)
  maxIterations: Annotation<number>,    // Лимит итераций (по умолчанию 3)
  pendingQueries: Annotation<PendingQuery[]>, // Очередь точечных запросов к MCP
  symbolSnippets: Annotation<Record<string, string>>, // Кеш декомпилированных функций/файлов
  engineProfile: Annotation<EngineProfile | undefined>, // ⚡ Fast | 🔬 Deep | 📱 Auto
  preferredNativeBackend: Annotation<PreferredNativeBackend | undefined>, // ghidra | radare2 | ida | binja
  detectedCapabilities: Annotation<DetectedCapability[] | undefined>, // Capa triage capabilities
});

export type DecompFlowStateType = typeof DecompFlowState.State;
