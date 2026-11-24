import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SystemEnvManager } from "../utils/system.js";

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport?: "stdio" | "sse";
  enabled?: boolean;
}

export interface McpConfigFile {
  mcpServers: Record<string, McpServerConfig>;
}

export interface ToolCallResult {
  content?: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  [key: string]: unknown;
}

export type DetectedTargetType = "electron_bundle" | "binary" | "mobile" | "web" | "source";

export function detectTargetType(target: string): DetectedTargetType {
  const trimmed = (target || "").trim();
  if (!trimmed) return "source";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return "web";
  }

  // Check ASAR or JS bundle
  const lower = trimmed.toLowerCase();
  if (
    lower.endsWith(".asar") ||
    lower.endsWith(".bundle.js") ||
    lower.endsWith(".min.js") ||
    lower.endsWith(".chunk.js")
  ) {
    return "electron_bundle";
  }

  // Mobile Android / Java packages
  const mobileExtensions = [".apk", ".dex", ".jar", ".aab"];
  if (mobileExtensions.some((ext) => lower.endsWith(ext))) {
    return "mobile";
  }

  // Binary extensions
  const binaryExtensions = [
    ".exe", ".elf", ".so", ".dylib", ".dll", ".bin", ".out", ".node"
  ];
  if (binaryExtensions.some((ext) => lower.endsWith(ext))) {
    return "binary";
  }

  // Check filesystem if exists
  if (fs.existsSync(trimmed)) {
    try {
      const stat = fs.statSync(trimmed);
      if (stat.isDirectory()) {
        // Check if it's an Electron app directory
        if (
          fs.existsSync(path.join(trimmed, "resources/app.asar")) ||
          fs.existsSync(path.join(trimmed, "app.asar"))
        ) {
          return "electron_bundle";
        }
        const pkgJson = path.join(trimmed, "package.json");
        if (fs.existsSync(pkgJson)) {
          const content = fs.readFileSync(pkgJson, "utf-8");
          if (content.includes('"electron"') || content.includes('"@electron/')) {
            return "electron_bundle";
          }
        }
        return "source";
      }

      // Check file magic numbers for binary formats
      const fd = fs.openSync(trimmed, "r");
      const buffer = Buffer.alloc(4);
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);

      // ELF: 0x7F 'E' 'L' 'F'
      if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
        return "binary";
      }
      // PE (MZ): 0x4D 0x5A
      if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
        return "binary";
      }
      // Mach-O: 0xFE 0xED 0xFA 0xCE / 0xCF or 0xCA 0xFE 0xBA 0xBE
      if (
        (buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa) ||
        (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed) ||
        (buffer[0] === 0xca && buffer[1] === 0xfe && buffer[2] === 0xba && buffer[3] === 0xbe)
      ) {
        return "binary";
      }
    } catch {
      // ignore
    }
  }

  if (trimmed.includes("sample_bin") || trimmed.includes("bin/")) {
    return "binary";
  }

  return "source";
}

export function findProjectRoot(startDir: string = process.cwd()): string {
  // First check startDir and its parents
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (
      fs.existsSync(path.join(curr, "config/mcp-servers.json")) ||
      fs.existsSync(path.join(curr, "skills"))
    ) {
      return curr;
    }
    curr = path.dirname(curr);
  }

  // Second check module directory and its parents (relative to client.js / dist / src)
  try {
    const modDir = path.dirname(fileURLToPath(import.meta.url));
    let modCurr = modDir;
    while (modCurr !== path.dirname(modCurr)) {
      if (
        fs.existsSync(path.join(modCurr, "config/mcp-servers.json")) ||
        fs.existsSync(path.join(modCurr, "skills"))
      ) {
        return modCurr;
      }
      modCurr = path.dirname(modCurr);
    }
  } catch {}

  // Fallback to /home/dropt1m/DecompFlow if exists
  if (fs.existsSync("/home/dropt1m/DecompFlow/config/mcp-servers.json")) {
    return "/home/dropt1m/DecompFlow";
  }

  return process.cwd();
}

interface ActiveClientEntry {
  client: Client;
  transport: StdioClientTransport;
  lastUsed: number;
  idleTimer?: NodeJS.Timeout;
}

export class McpClientManager {
  private configPath: string;
  private projectRoot: string;
  private config: McpConfigFile | null = null;
  private activeClients = new Map<string, ActiveClientEntry>();
  public idleTimeoutMs: number = 120000; // 2 minutes auto-unload idle timer

  constructor(customConfigPath?: string) {
    SystemEnvManager.ensurePathEnv();
    this.projectRoot = findProjectRoot();
    if (customConfigPath) {
      this.configPath = path.resolve(customConfigPath);
    } else {
      const candidatePaths = [
        path.resolve(this.projectRoot, "config/mcp-servers.json"),
        path.resolve(process.cwd(), "config/mcp-servers.json"),
        path.resolve(process.cwd(), "mcp-servers.json"),
      ];
      this.configPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
    }
  }

  public loadConfig(): McpConfigFile {
    if (this.config) {
      return this.config;
    }

    if (!fs.existsSync(this.configPath)) {
      throw new Error(`MCP configuration file not found at: ${this.configPath}`);
    }

    const raw = fs.readFileSync(this.configPath, "utf-8");
    try {
      this.config = JSON.parse(raw) as McpConfigFile;
      return this.config;
    } catch (err) {
      throw new Error(`Failed to parse MCP configuration from ${this.configPath}: ${err}`);
    }
  }

  public scheduleIdleTimeout(serverName: string, entry?: ActiveClientEntry) {
    const targetEntry = entry || this.activeClients.get(serverName);
    if (!targetEntry) return;
    if (targetEntry.idleTimer) {
      clearTimeout(targetEntry.idleTimer);
    }
    targetEntry.idleTimer = setTimeout(() => {
      console.log(`[MCP Manager] Server "${serverName}" idle for ${this.idleTimeoutMs / 1000}s, unloading process to free memory...`);
      this.closeServer(serverName);
    }, this.idleTimeoutMs);
    if (targetEntry.idleTimer.unref) {
      targetEntry.idleTimer.unref();
    }
  }

  public async getClient(serverName: string): Promise<Client> {
    if (this.activeClients.has(serverName)) {
      const entry = this.activeClients.get(serverName)!;
      entry.lastUsed = Date.now();
      this.scheduleIdleTimeout(serverName, entry);
      return entry.client;
    }

    const config = this.loadConfig();
    const serverCfg = config.mcpServers?.[serverName];

    if (!serverCfg) {
      throw new Error(
        `MCP server "${serverName}" is not configured in ${this.configPath}. Available: ${Object.keys(
          config.mcpServers || {}
        ).join(", ")}`
      );
    }

    if (serverCfg.enabled === false) {
      throw new Error(`MCP server "${serverName}" is explicitly disabled in configuration`);
    }

    const normalized = SystemEnvManager.normalizeCommand(serverCfg.command, serverCfg.args || []);
    console.log(`[MCP Manager] Lazy-spawning server "${serverName}": ${normalized.command} ${normalized.args.join(" ")}`);

    const client = new Client(
      {
        name: "decompflow-client",
        version: "0.2.0",
      },
      {
        capabilities: {},
      }
    );

    const env: Record<string, string> = {};
    for (const [key, val] of Object.entries(process.env)) {
      if (val !== undefined) env[key] = val;
    }
    if (serverCfg.env) {
      Object.assign(env, serverCfg.env);
    }

    const transportParams: any = {
      command: normalized.command,
      args: normalized.args,
      env,
      cwd: this.projectRoot,
      windowsHide: true,
    };

    const transport = new StdioClientTransport(transportParams);

    try {
      await client.connect(transport);
      const entry: ActiveClientEntry = { client, transport, lastUsed: Date.now() };
      this.scheduleIdleTimeout(serverName, entry);
      this.activeClients.set(serverName, entry);
      return client;
    } catch (error) {
      try {
        await transport.close();
      } catch {
        // ignore
      }
      throw new Error(`Failed to initialize connection to MCP server "${serverName}": ${error}`);
    }
  }

  public async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown> = {}
  ): Promise<ToolCallResult> {
    const client = await this.getClient(serverName);
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    return result as ToolCallResult;
  }

  public async listTools(serverName: string) {
    const client = await this.getClient(serverName);
    return await client.listTools();
  }

  public async testConnection(serverName: string): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      const client = await this.getClient(serverName);
      await client.listTools();
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public async testAllConnections(): Promise<Record<string, { success: boolean; latencyMs?: number; error?: string }>> {
    const config = this.loadConfig();
    const results: Record<string, { success: boolean; latencyMs?: number; error?: string }> = {};
    const serverNames = Object.keys(config.mcpServers || {});

    for (const name of serverNames) {
      results[name] = await this.testConnection(name);
    }
    return results;
  }

  public async closeServer(serverName: string): Promise<void> {
    const entry = this.activeClients.get(serverName);
    if (!entry) return;
    if (entry.idleTimer) {
      clearTimeout(entry.idleTimer);
    }
    this.activeClients.delete(serverName);
    try {
      await entry.transport.close();
      console.log(`[MCP Manager] Closed and released process for server "${serverName}"`);
    } catch (err) {
      console.warn(`[MCP Manager] Error closing transport for server "${serverName}":`, err);
    }
  }

  public async closeAll(): Promise<void> {
    const names = Array.from(this.activeClients.keys());
    for (const name of names) {
      await this.closeServer(name);
    }
  }
}

export const defaultMcpManager = new McpClientManager();
