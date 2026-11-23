export type TargetMode = "binary" | "web" | "source";

export type NodeExecutionStatus = "idle" | "running" | "completed" | "error";

export interface EvidenceItem {
  source: string;
  location: string;
  snippet: string;
  confidence: string;
}

export interface NodeData {
  label: string;
  sublabel: string;
  iconName: "trigger" | "router" | "ghidra" | "rea" | "playwright" | "source" | "llm" | "report" | "deep_dive";
  status: NodeExecutionStatus;
  details?: any;
}

export interface MessageItem {
  id: string;
  sender: "user" | "agent";
  text: string;
  target?: string;
  mode?: TargetMode;
  skill?: string;
  timestamp: string;
  activeNode?: string | null;
  completedNodes?: string[];
  finalReport?: string | null;
  findings?: string[];
  evidence?: EvidenceItem[];
  reconstructedCode?: string;
}

export interface SessionItem {
  id: string;
  title: string;
  target: string;
  mode: TargetMode;
  skill: string;
  createdAt: number;
  hasReport: boolean;
  messages: MessageItem[];
  finalReport?: string | null;
  evidence?: EvidenceItem[];
  reconstructedCode?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  sessions: SessionItem[];
}

export interface WorkspaceData {
  projects: ProjectItem[];
  activeProjectId: string;
  activeSessionId: string | null;
}

export interface AnalysisPayload {
  target: string;
  mode: TargetMode;
  skill: string;
  userPrompt?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  outPath?: string;
}

export interface AnalysisProgressEvent {
  node: string;
  status: "running" | "completed";
  data?: any;
}

export interface LocalLlmDetectionResult {
  ollama: {
    available: boolean;
    models: string[];
    host: string;
  };
  lmstudio: {
    available: boolean;
    models: string[];
    host: string;
  };
}

export interface McpTestResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

export interface SystemInfo {
  platform: "linux" | "win32" | "darwin" | string;
  arch: string;
  theme: "dark" | "light";
  accentColor: string | null;
  locale: string;
  userDataDir: string;
  workspaceFile: string;
  systemPaths: {
    nodePath: string | null;
    pythonPath: string | null;
    javaPath: string | null;
    ghidraPath: string | null;
    reaAvailable: boolean;
  };
}

export interface ElectronAPI {
  workspaceLoad: () => Promise<WorkspaceData | null>;
  workspaceSave: (data: WorkspaceData) => Promise<{ success: boolean; error?: string }>;
  openDirectory: () => Promise<string | null>;
  openFile: () => Promise<string | null>;
  saveFile: (content: string, defaultPath?: string) => Promise<{ success: boolean; filePath?: string }>;
  listSkills: () => Promise<string[]>;
  getConfig: () => Promise<{ yamlConfig: any; mcpConfig: any; envApiKey: string }>;
  saveConfig: (data: { yamlConfig?: any; mcpConfig?: any; envApiKey?: string }) => Promise<{ success: boolean; error?: string }>;
  detectLocalModels: () => Promise<LocalLlmDetectionResult>;
  testMcpConnections: () => Promise<Record<string, McpTestResult>>;
  getSystemInfo: () => Promise<SystemInfo>;
  onThemeUpdated: (callback: (theme: "dark" | "light") => void) => () => void;
  openExternal: (url: string) => Promise<{ success: boolean }>;
  runAnalysis: (payload: AnalysisPayload) => Promise<{ success: boolean; data?: any; error?: string }>;
  stopAnalysis: () => Promise<{ success: boolean }>;
  onProgress: (callback: (event: AnalysisProgressEvent) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
