import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { execSync } from "node:child_process";

export interface SystemPathsInfo {
  nodePath: string | null;
  pythonPath: string | null;
  javaPath: string | null;
  ghidraPath: string | null;
  capaPath: string | null;
  r2Path: string | null;
  jadxPath: string | null;
  idaProMcp: boolean;
  binjaMcp: boolean;
  reaAvailable: boolean;
}

export class SystemEnvManager {
  public static readonly platform = process.platform;
  public static readonly arch = process.arch;
  public static readonly isWindows = process.platform === "win32";
  public static readonly isMac = process.platform === "darwin";
  public static readonly isLinux = process.platform === "linux";

  /**
   * Resolves native user data directory per OS conventions:
   * - Linux: $XDG_CONFIG_HOME/decompflow or ~/.config/decompflow
   * - Windows: %APPDATA%\DecompFlow
   * - macOS: ~/Library/Application Support/DecompFlow
   */
  public static getUserDataDir(): string {
    if (this.isWindows) {
      const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
      return path.join(appData, "DecompFlow");
    }

    if (this.isMac) {
      return path.join(os.homedir(), "Library", "Application Support", "DecompFlow");
    }

    // Linux & BSDs: adhere to XDG Base Directory specification
    const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
    return path.join(xdgConfig, "decompflow");
  }

  public static getWorkspaceFile(): string {
    return path.join(this.getUserDataDir(), "workspace.json");
  }

  public static ensureUserDataDir(): string {
    const dir = this.getUserDataDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Enriches process.env.PATH on macOS and Linux with standard bin locations
   * so that GUI-launched Electron processes reliably discover node, npx, python, java, etc.
   */
  public static ensurePathEnv(): void {
    if (this.isWindows) {
      return;
    }

    const currentPath = process.env.PATH || "";
    const existingDirs = new Set(currentPath.split(path.delimiter).filter(Boolean));

    const candidateDirs = [
      "/opt/homebrew/bin",
      "/opt/homebrew/sbin",
      "/usr/local/bin",
      "/usr/local/sbin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
      path.join(os.homedir(), ".local", "bin"),
      path.join(os.homedir(), ".cargo", "bin"),
    ];

    // Check for NVM paths
    const nvmDir = path.join(os.homedir(), ".nvm", "versions", "node");
    if (fs.existsSync(nvmDir)) {
      try {
        const versions = fs.readdirSync(nvmDir);
        for (const v of versions) {
          candidateDirs.unshift(path.join(nvmDir, v, "bin"));
        }
      } catch {
        // ignore
      }
    }

    const added: string[] = [];
    for (const dir of candidateDirs) {
      if (fs.existsSync(dir) && !existingDirs.has(dir)) {
        existingDirs.add(dir);
        added.push(dir);
      }
    }

    if (added.length > 0) {
      process.env.PATH = [...added, currentPath].join(path.delimiter);
    }
  }

  /**
   * Adjusts executable commands and args for Windows/POSIX compatibility.
   * On Windows: substitutes npx -> npx.cmd, npm -> npm.cmd, python3 -> python.
   */
  public static normalizeCommand(command: string, args: string[] = []): { command: string; args: string[] } {
    let resolvedCmd = command;
    const resolvedArgs = [...args];

    if (this.isWindows) {
      const lower = command.toLowerCase();
      if (lower === "npx") {
        resolvedCmd = "npx.cmd";
      } else if (lower === "npm") {
        resolvedCmd = "npm.cmd";
      } else if (lower === "python3") {
        // Check if python3 exists on windows; if not, use python
        resolvedCmd = "python";
      }
    }

    return {
      command: resolvedCmd,
      args: resolvedArgs,
    };
  }

  /**
   * Fast non-blocking TCP socket check to test local external MCP endpoints.
   */
  public static checkPort(host: string, port: number, timeoutMs = 350): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  /**
   * Auto-scans system for installed runtimes, decompilers and external tool bridges.
   */
  public static async detectSystemBinaries(): Promise<SystemPathsInfo> {
    this.ensurePathEnv();

    const findInPath = (binName: string): string | null => {
      try {
        const cmd = this.isWindows ? `where ${binName}` : `which ${binName}`;
        const out = execSync(cmd, { stdio: ["pipe", "pipe", "ignore"], encoding: "utf-8" }).trim();
        return out.split("\n")[0].trim() || null;
      } catch {
        return null;
      }
    };

    const nodePath = findInPath(this.isWindows ? "node.exe" : "node") || process.execPath;
    const pythonPath =
      findInPath(this.isWindows ? "python.exe" : "python3") ||
      findInPath("python") ||
      null;
    const javaPath = findInPath(this.isWindows ? "java.exe" : "java");

    // Tier 1 Fast Triage Tools: Capa & Radare2/Rizin
    const capaPath = findInPath(this.isWindows ? "capa.exe" : "capa");
    const r2Path =
      findInPath(this.isWindows ? "r2.exe" : "r2") ||
      findInPath(this.isWindows ? "rizin.exe" : "rizin") ||
      null;

    // Mobile Decompiler: Jadx
    const jadxPath =
      findInPath(this.isWindows ? "jadx.bat" : "jadx") ||
      findInPath(this.isWindows ? "jadx-gui.bat" : "jadx-gui") ||
      null;

    // Check external MCP endpoints: IDA Pro (:13337) and Binary Ninja (:13338)
    const [idaProMcp, binjaMcp] = await Promise.all([
      this.checkPort("127.0.0.1", 13337),
      this.checkPort("127.0.0.1", 13338),
    ]);

    // Scan for Ghidra installations
    let ghidraPath: string | null = null;
    const ghidraCandidates: string[] = [];

    if (this.isWindows) {
      const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
      const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
      ghidraCandidates.push(
        path.join(programFiles, "ghidra"),
        path.join(programFilesX86, "ghidra"),
        "C:\\ghidra"
      );
    } else if (this.isMac) {
      ghidraCandidates.push(
        "/Applications/ghidra.app",
        "/Applications/Ghidra.app",
        "/opt/homebrew/Caskroom/ghidra"
      );
    } else {
      ghidraCandidates.push(
        "/opt/ghidra",
        "/usr/share/ghidra",
        path.join(os.homedir(), "ghidra")
      );
    }

    for (const cand of ghidraCandidates) {
      if (fs.existsSync(cand)) {
        ghidraPath = cand;
        break;
      }
    }

    // Check REA agents presence
    let reaAvailable = false;
    try {
      const reaCheckCmd = this.isWindows ? "where rea.cmd" : "which rea";
      execSync(reaCheckCmd, { stdio: ["pipe", "pipe", "ignore"] });
      reaAvailable = true;
    } catch {
      // If rea global not installed, npx -y rea-agents can fetch it on-demand
      reaAvailable = Boolean(findInPath(this.isWindows ? "npx.cmd" : "npx"));
    }

    return {
      nodePath,
      pythonPath,
      javaPath,
      ghidraPath,
      capaPath,
      r2Path,
      jadxPath,
      idaProMcp,
      binjaMcp,
      reaAvailable,
    };
  }
}
