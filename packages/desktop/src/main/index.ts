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
import child_process from "node:child_process";
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

function getAppIconPath(): string {
  const candidatePaths = [
    path.join(__dirname, "icon.png"),
    path.join(__dirname, "../icon.png"),
    path.join(__dirname, "../../build/icon.png"),
    path.join(app.getAppPath(), "build/icon.png"),
    path.join(app.getAppPath(), "dist/icon.png"),
    path.join(app.getAppPath(), "dist/main/icon.png"),
    path.join(process.resourcesPath, "build/icon.png"),
    path.join(process.resourcesPath, "icon.png"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "";
}

function createDesktopShortcut(): { success: boolean; path?: string; error?: string } {
  try {
    const home = os.homedir();
    const appIcon = getAppIconPath();

    // Ensure icon is copied to standard user icons location
    const iconsDir = path.join(home, ".local", "share", "icons");
    fs.mkdirSync(iconsDir, { recursive: true });
    const permanentIcon = path.join(iconsDir, "decompflow.png");
    if (appIcon && fs.existsSync(appIcon)) {
      try {
        fs.copyFileSync(appIcon, permanentIcon);
      } catch (err) {
        console.warn("[Main] Failed to copy icon to ~/.local/share/icons:", err);
      }
    }
    const finalIconPath = fs.existsSync(permanentIcon) ? permanentIcon : appIcon;

    if (process.platform === "linux") {
      const isAppImage = Boolean(process.env.APPIMAGE);
      const isDefaultApp = Boolean(process.defaultApp);
      let execCommand: string;

      if (isAppImage) {
        execCommand = `"${process.env.APPIMAGE}" --no-sandbox %U`;
      } else if (isDefaultApp) {
        execCommand = `"${process.execPath}" "${path.join(app.getAppPath(), "dist/main/index.js")}" --no-sandbox %U`;
      } else {
        execCommand = `"${process.execPath}" --no-sandbox %U`;
      }

      const desktopFileContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=DecompFlow
GenericName=Autonomous Reverse Engineering Studio
Comment=Autonomous AI Reverse Engineering Studio & Feature Reconstruction
Exec=${execCommand}
Icon=${finalIconPath}
Terminal=false
Categories=Development;Security;Debugger;
StartupWMClass=decompflow-studio
`;

      // 1. Applications menu
      const appsDir = path.join(home, ".local", "share", "applications");
      fs.mkdirSync(appsDir, { recursive: true });
      const menuDesktopPath = path.join(appsDir, "decompflow.desktop");
      fs.writeFileSync(menuDesktopPath, desktopFileContent, { encoding: "utf-8", mode: 0o755 });

      // 2. Discover user's Desktop folder(s)
      const desktopDirs = new Set<string>();
      const stdDesktop = path.join(home, "Desktop");
      const ruDesktop = path.join(home, "Рабочий стол");

      if (fs.existsSync(stdDesktop)) desktopDirs.add(stdDesktop);
      if (fs.existsSync(ruDesktop)) desktopDirs.add(ruDesktop);

      const userDirsPath = path.join(home, ".config", "user-dirs.dirs");
      if (fs.existsSync(userDirsPath)) {
        try {
          const content = fs.readFileSync(userDirsPath, "utf-8");
          const match = content.match(/XDG_DESKTOP_DIR="?\$HOME\/([^"\n]+)"?/);
          if (match && match[1]) {
            const xdgDesktop = path.join(home, match[1]);
            if (fs.existsSync(xdgDesktop)) {
              desktopDirs.add(xdgDesktop);
            }
          }
        } catch {
          // ignore
        }
      }

      if (desktopDirs.size === 0) {
        fs.mkdirSync(stdDesktop, { recursive: true });
        desktopDirs.add(stdDesktop);
      }

      const createdPaths: string[] = [];
      for (const d of desktopDirs) {
        const targetPath = path.join(d, "DecompFlow.desktop");
        fs.writeFileSync(targetPath, desktopFileContent, { encoding: "utf-8", mode: 0o755 });
        try {
          child_process.exec(`gio set "${targetPath}" metadata::trusted true`);
        } catch {
          // ignore
        }
        createdPaths.push(targetPath);
      }

      return {
        success: true,
        path: createdPaths.join(", "),
      };
    } else if (process.platform === "win32") {
      const desktopPath = path.join(home, "Desktop", "DecompFlow.lnk");
      const targetExec = process.execPath;
      const psScript = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${desktopPath.replace(/'/g, "''")}'); $s.TargetPath = '${targetExec.replace(/'/g, "''")}'; $s.IconLocation = '${finalIconPath.replace(/'/g, "''")}'; $s.Save();`;
      child_process.execSync(`powershell -NoProfile -NonInteractive -Command "${psScript}"`);
      return { success: true, path: desktopPath };
    } else {
      const desktopPath = path.join(home, "Desktop", "DecompFlow.command");
      const script = `#!/bin/bash\nopen -a "${process.execPath}"\n`;
      fs.writeFileSync(desktopPath, script, { encoding: "utf-8", mode: 0o755 });
      return { success: true, path: desktopPath };
    }
  } catch (err: any) {
    console.error("[Main] Failed to create desktop shortcut:", err);
    return { success: false, error: err.message || String(err) };
  }
}

function createWindow() {
  const isMac = process.platform === "darwin";

  if (!isMac) {
    Menu.setApplicationMenu(null);
  }

  const appIcon = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: !isMac,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: isMac ? { x: 14, y: 14 } : undefined,
    backgroundColor: "#131418",
    icon: appIcon || undefined,
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

  // Desktop Shortcut Generator
  ipcMain.handle("system:create-desktop-shortcut", async () => {
    return createDesktopShortcut();
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

  // Local LLM Detection (Ollama & LM Studio in 1 Click)
  ipcMain.handle("llm:detect-local", async () => {
    const result = {
      ollama: { available: false, models: [] as string[], host: "http://127.0.0.1:11434" },
      lmstudio: { available: false, models: [] as string[], host: "http://127.0.0.1:1234" },
    };

    // Ping Ollama
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("http://127.0.0.1:11434/api/tags", { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data: any = await res.json();
        const models = (data.models || []).map((m: any) => m.name || m.model).filter(Boolean);
        result.ollama.available = true;
        result.ollama.models = models;
      }
    } catch {
      // Ollama not reachable
    }

    // Ping LM Studio
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("http://127.0.0.1:1234/v1/models", { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data: any = await res.json();
        const models = (data.data || []).map((m: any) => m.id).filter(Boolean);
        result.lmstudio.available = true;
        result.lmstudio.models = models;
      }
    } catch {
      // LM Studio not reachable
    }

    return result;
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
