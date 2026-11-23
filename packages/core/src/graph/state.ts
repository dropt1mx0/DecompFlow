import { Annotation } from "@langchain/langgraph";

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
});

export type DecompFlowStateType = typeof DecompFlowState.State;
