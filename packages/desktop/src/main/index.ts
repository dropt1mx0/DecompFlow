import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  shell,
  nativeTheme,
  systemPreferences,
  session,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import yaml from "yaml";
import {
  runAnalysisWithProgress,
  findProjectRoot,
  defaultMcpManager,
  SystemEnvManager,
} from "@decompflow/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure full PATH environment for GUI-mode executables (Node, Python, Java, etc.)
SystemEnvManager.ensurePathEnv();

// Apply sandbox and GPU fallback flags ONLY on Linux or when safe-gpu is explicitly requested
const isLinux = process.platform === "linux";
const isSafeGpuRequested = process.argv.includes("--safe-gpu");
if (isLinux || isSafeGpuRequested) {
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("no-zygote");
  app.commandLine.appendSwitch("disable-gpu");
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;
let currentAbortController: AbortController | null = null;

// Native OS user data & workspace paths
const USER_DATA_DIR = SystemEnvManager.getUserDataDir();
const WORKSPACE_FILE = SystemEnvManager.getWorkspaceFile();

function ensureWorkspaceFile() {
  SystemEnvManager.ensureUserDataDir();

  // Migration from legacy ~/.decompflow if present
  const legacyPath = path.join(os.homedir(), ".decompflow", "workspace.json");
  if (!fs.existsSync(WORKSPACE_FILE) && fs.existsSync(legacyPath)) {
    try {
      fs.copyFileSync(legacyPath, WORKSPACE_FILE);
      console.log(`[Main] Migrated workspace from ${legacyPath} to ${WORKSPACE_FILE}`);
    } catch (err) {
      console.warn("[Main] Error migrating legacy workspace:", err);
    }
  }

  if (!fs.existsSync(WORKSPACE_FILE)) {
    const defaultData = {
      projects: [
        {
          id: "proj-default",
          name: "Default Workspace",
          path: findProjectRoot(),
          createdAt: Date.now(),
          sessions: [],
        },
      ],
      activeProjectId: "proj-default",
      activeSessionId: null,
    };
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

function createWindow() {
  const isMac = process.platform === "darwin";

  if (!isMac) {
    Menu.setApplicationMenu(null);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: !isMac,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: isMac ? { x: 14, y: 14 } : undefined,
    backgroundColor: "#131418",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const htmlPath = path.join(__dirname, "../renderer/index.html");
    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else {
      mainWindow.loadURL("http://localhost:5173");
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupIpc() {
  // System Info & Environment Handler
  ipcMain.handle("system:get-info", async () => {
    let accentColor: string | null = null;
    try {
      if (typeof systemPreferences.getAccentColor === "function") {
        const raw = systemPreferences.getAccentColor();
        if (raw) {
          accentColor = raw.startsWith("#") ? raw : `#${raw.slice(0, 6)}`;
        }
      }
    } catch {
      // ignore
    }

    const systemPaths = await SystemEnvManager.detectSystemBinaries();

    return {
      platform: process.platform,
      arch: process.arch,
      theme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
      accentColor,
      locale: app.getLocale(),
      userDataDir: USER_DATA_DIR,
      workspaceFile: WORKSPACE_FILE,
      systemPaths,
    };
  });

  // Workspace persistence
  ipcMain.handle("workspace:load", async () => {
    ensureWorkspaceFile();
    try {
      const content = fs.readFileSync(WORKSPACE_FILE, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("[Main IPC] Error reading workspace:", err);
      return null;
    }
  });

  ipcMain.handle("workspace:save", async (_, data) => {
    ensureWorkspaceFile();
    try {
      fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2), "utf-8");
      return { success: true };
    } catch (err: any) {
      console.error("[Main IPC] Error saving workspace:", err);
      return { success: false, error: err.message };
    }
  });

  // Native Dialogs
  ipcMain.handle("dialog:openDirectory", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("dialog:openFile", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        {
          name: "All Supported Targets",
          extensions: ["*", "exe", "elf", "so", "dylib", "dll", "apk", "asar", "js", "bin"],
        },
        { name: "Binary Executables", extensions: ["exe", "elf", "so", "dylib", "dll", "apk", "bin"] },
        { name: "Electron & ASAR", extensions: ["asar", "js"] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("dialog:saveFile", async (_, { content, defaultPath }) => {
    if (!mainWindow) return { success: false };
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultPath || "decompflow_report.md",
      filters: [{ name: "Markdown Report", extensions: ["md"] }],
    });
    if (result.canceled || !result.filePath) return { success: false };

    try {
      fs.writeFileSync(result.filePath, content, "utf-8");
      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Skills Listing
  ipcMain.handle("skills:list", async () => {
    const root = findProjectRoot();
    const skillsDir = path.join(root, "skills");
    if (!fs.existsSync(skillsDir)) return [];

    try {
      const files = fs.readdirSync(skillsDir);
      return files
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
    } catch (err) {
      console.error("[Main IPC] Error listing skills:", err);
      return [];
    }
  });

  // Configuration Loading and Saving
  ipcMain.handle("config:get", async () => {
    const root = findProjectRoot();
    const yamlPath = path.join(root, "config/decompflow.yaml");
    const mcpPath = path.join(root, "config/mcp-servers.json");

    let yamlData: any = {};
    let mcpData: any = {};

    if (fs.existsSync(yamlPath)) {
      try {
        yamlData = yaml.parse(fs.readFileSync(yamlPath, "utf-8")) || {};
      } catch (err) {
        console.warn("[Main IPC] Error parsing decompflow.yaml:", err);
      }
    }

    if (fs.existsSync(mcpPath)) {
      try {
        mcpData = JSON.parse(fs.readFileSync(mcpPath, "utf-8")) || {};
      } catch (err) {
        console.warn("[Main IPC] Error parsing mcp-servers.json:", err);
      }
    }

    return {
      yamlConfig: yamlData,
      mcpConfig: mcpData,
      envApiKey: process.env.OPENAI_API_KEY || "",
    };
  });

  ipcMain.handle("config:save", async (_, { yamlConfig, mcpConfig, envApiKey }) => {
    const root = findProjectRoot();
    const yamlPath = path.join(root, "config/decompflow.yaml");
    const mcpPath = path.join(root, "config/mcp-servers.json");

    try {
      if (yamlConfig) {
        fs.writeFileSync(yamlPath, yaml.stringify(yamlConfig), "utf-8");
      }
      if (mcpConfig) {
        fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2), "utf-8");
      }
      if (envApiKey !== undefined) {
        process.env.OPENAI_API_KEY = envApiKey;
      }
      return { success: true };
    } catch (err: any) {
      console.error("[Main IPC] Error saving configs:", err);
      return { success: false, error: err.message };
    }
  });

  // Test MCP Connections
  ipcMain.handle("mcp:testConnections", async () => {
    try {
      console.log("[Main IPC] Testing all configured MCP connections...");
      return await defaultMcpManager.testAllConnections();
    } catch (err: any) {
      console.error("[Main IPC] Error testing MCP connections:", err);
      return {};
    }
  });

  // External Links
  ipcMain.handle("shell:openExternal", async (_, url: string) => {
    if (url) {
      await shell.openExternal(url);
    }
    return { success: true };
  });

  // Analysis Execution with Cancellation
  ipcMain.handle("analysis:run", async (_, payload) => {
    console.log("[Main IPC] Starting analysis execution:", payload);
    currentAbortController = new AbortController();

    try {
      const result = await runAnalysisWithProgress(
        {
          target: payload.target,
          mode: payload.mode,
          activeSkill: payload.skill,
          userPrompt: payload.userPrompt,
          messages: payload.messages,
          outPath: payload.outPath,
        },
        (progressEvent) => {
          if (currentAbortController?.signal.aborted) {
            return;
          }
          console.log(`[Main IPC] Node completed: ${progressEvent.node}`);
          mainWindow?.webContents.send("analysis:progress", progressEvent);
        }
      );

      if (currentAbortController?.signal.aborted) {
        return { success: false, error: "Analysis aborted by user." };
      }

      return { success: true, data: result };
    } catch (err: any) {
      console.error("[Main IPC] Analysis execution failed:", err);
      return { success: false, error: err.message || String(err) };
    } finally {
      currentAbortController = null;
    }
  });

  ipcMain.handle("analysis:stop", async () => {
    if (currentAbortController) {
      console.log("[Main IPC] Aborting analysis execution by user request...");
      currentAbortController.abort();
      currentAbortController = null;
      return { success: true };
    }
    return { success: false };
  });
}

app.whenReady().then(() => {
  // Use system proxy settings
  try {
    session.defaultSession.setProxy({ mode: "system" });
  } catch {
    // ignore
  }

  // Subscribe to OS theme changes
  nativeTheme.on("updated", () => {
    mainWindow?.webContents.send(
      "system:theme-updated",
      nativeTheme.shouldUseDarkColors ? "dark" : "light"
    );
  });

  ensureWorkspaceFile();
  setupIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
