import { contextBridge, ipcRenderer } from "electron";

export interface AnalysisPayload {
  target: string;
  mode: "binary" | "web" | "source";
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

export interface ElectronAPI {
  workspaceLoad: () => Promise<any>;
  workspaceSave: (data: any) => Promise<{ success: boolean; error?: string }>;
  openDirectory: () => Promise<string | null>;
  openFile: () => Promise<string | null>;
  saveFile: (content: string, defaultPath?: string) => Promise<{ success: boolean; filePath?: string }>;
  listSkills: () => Promise<string[]>;
  getConfig: () => Promise<{ yamlConfig: any; mcpConfig: any; envApiKey: string }>;
  saveConfig: (data: any) => Promise<{ success: boolean; error?: string }>;
  detectLocalModels: () => Promise<{
    ollama: { available: boolean; models: string[]; host: string };
    lmstudio: { available: boolean; models: string[]; host: string };
  }>;
  testMcpConnections: () => Promise<Record<string, { success: boolean; latencyMs?: number; error?: string }>>;
  getSystemInfo: () => Promise<any>;
  createDesktopShortcut: () => Promise<{ success: boolean; path?: string; error?: string }>;
  onThemeUpdated: (callback: (theme: "dark" | "light") => void) => () => void;
  openExternal: (url: string) => Promise<{ success: boolean }>;
  runAnalysis: (payload: AnalysisPayload) => Promise<{ success: boolean; data?: any; error?: string }>;
  stopAnalysis: () => Promise<{ success: boolean }>;
  onProgress: (callback: (event: AnalysisProgressEvent) => void) => () => void;
}

const api: ElectronAPI = {
  workspaceLoad: () => ipcRenderer.invoke("workspace:load"),
  workspaceSave: (data: any) => ipcRenderer.invoke("workspace:save", data),
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  saveFile: (content: string, defaultPath?: string) =>
    ipcRenderer.invoke("dialog:saveFile", { content, defaultPath }),
  listSkills: () => ipcRenderer.invoke("skills:list"),
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (data: any) => ipcRenderer.invoke("config:save", data),
  detectLocalModels: () => ipcRenderer.invoke("llm:detect-local"),
  testMcpConnections: () => ipcRenderer.invoke("mcp:testConnections"),
  getSystemInfo: () => ipcRenderer.invoke("system:get-info"),
  createDesktopShortcut: () => ipcRenderer.invoke("system:create-desktop-shortcut"),
  onThemeUpdated: (callback: (theme: "dark" | "light") => void) => {
    const handler = (_: any, theme: "dark" | "light") => callback(theme);
    ipcRenderer.on("system:theme-updated", handler);
    return () => {
      ipcRenderer.removeListener("system:theme-updated", handler);
    };
  },
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  runAnalysis: (payload: AnalysisPayload) => ipcRenderer.invoke("analysis:run", payload),
  stopAnalysis: () => ipcRenderer.invoke("analysis:stop"),
  onProgress: (callback: (event: AnalysisProgressEvent) => void) => {
    const handler = (_: any, data: AnalysisProgressEvent) => callback(data);
    ipcRenderer.on("analysis:progress", handler);
    return () => {
      ipcRenderer.removeListener("analysis:progress", handler);
    };
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);
