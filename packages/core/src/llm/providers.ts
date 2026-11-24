import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { findProjectRoot } from "../mcp/client.js";

export interface LlmProviderPreset {
  id: string;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  supportedModels: string[];
  envKeyName: string;
  isLocal?: boolean;
}

export const LLM_PROVIDER_PRESETS: Record<string, LlmProviderPreset> = {
  openai: {
    id: "openai",
    name: "OpenAI Cloud",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    supportedModels: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"],
    envKeyName: "OPENAI_API_KEY",
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek AI",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    supportedModels: ["deepseek-chat", "deepseek-reasoner"],
    envKeyName: "DEEPSEEK_API_KEY",
  },
  qwen: {
    id: "qwen",
    name: "Qwen (DashScope)",
    defaultBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen2.5-coder-32b-instruct",
    supportedModels: [
      "qwen-max",
      "qwen2.5-coder-32b-instruct",
      "qwen2.5-coder-72b-instruct",
      "qwq-32b-preview",
    ],
    envKeyName: "DASHSCOPE_API_KEY",
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA NIM",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "nvidia/nemotron-4-34b-instruct",
    supportedModels: [
      "nvidia/nemotron-4-34b-instruct",
      "meta/llama-3.3-70b-instruct",
      "deepseek-ai/deepseek-r1",
    ],
    envKeyName: "NVIDIA_API_KEY",
  },
  meta: {
    id: "meta",
    name: "Meta Llama (Groq)",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    supportedModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
    ],
    envKeyName: "GROQ_API_KEY",
  },
  ollama: {
    id: "ollama",
    name: "Ollama (Local / Offline)",
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    defaultModel: "qwen2.5-coder",
    supportedModels: ["qwen2.5-coder", "llama3.3", "deepseek-r1:8b"],
    envKeyName: "OLLAMA_API_KEY",
    isLocal: true,
  },
  lmstudio: {
    id: "lmstudio",
    name: "LM Studio (Local / Offline)",
    defaultBaseUrl: "http://127.0.0.1:1234/v1",
    defaultModel: "deepseek-coder",
    supportedModels: ["deepseek-coder", "qwen2.5-coder"],
    envKeyName: "LMSTUDIO_API_KEY",
    isLocal: true,
  },
};

export interface ResolvedLlmConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  apiKeys: Record<string, string>;
}

export function sanitizeReasoningOutput(raw: string): {
  reasoningTree?: string;
  cleanJson: string;
} {
  let reasoningTree: string | undefined = undefined;
  let clean = raw.trim();

  // 1. Extract and strip <think>...</think>
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const match = clean.match(thinkRegex);
  if (match) {
    reasoningTree = match[1].trim();
    clean = clean.replace(thinkRegex, "").trim();
  } else if (clean.includes("<think>")) {
    const parts = clean.split("<think>");
    if (parts.length > 1) {
      reasoningTree = parts[1].replace(/<\/think>/i, "").trim();
      clean = parts[0].trim();
    }
  }

  // 2. If response wrapped in markdown block ```json ... ``` or ``` ... ```
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fenceMatch = clean.match(fenceRegex);
  if (fenceMatch) {
    clean = fenceMatch[1].trim();
  } else {
    // If there's leading non-JSON text before '{'
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      if (firstBrace > 0 && !reasoningTree) {
        reasoningTree = clean.substring(0, firstBrace).trim();
      }
      clean = clean.substring(firstBrace, lastBrace + 1).trim();
    }
  }

  return { reasoningTree, cleanJson: clean };
}

export function resolveLlmConfig(override?: Partial<ResolvedLlmConfig>): ResolvedLlmConfig {
  const root = findProjectRoot();
  const yamlPath = path.join(root, "config/decompflow.yaml");
  let cfg: any = {};
  if (fs.existsSync(yamlPath)) {
    try {
      cfg = yaml.parse(fs.readFileSync(yamlPath, "utf-8")) || {};
    } catch {}
  }

  const llm = cfg.llm || {};
  const provider = override?.provider || process.env.DECOMPFLOW_LLM_PROVIDER || llm.provider || "openai";
  const preset = LLM_PROVIDER_PRESETS[provider] || LLM_PROVIDER_PRESETS.openai;

  // Stored multi-provider api keys from decompflow.yaml
  const apiKeys: Record<string, string> = {
    openai: process.env.OPENAI_API_KEY || llm.api_keys?.openai || (provider === "openai" ? llm.apiKey : "") || "",
    deepseek: process.env.DEEPSEEK_API_KEY || llm.api_keys?.deepseek || (provider === "deepseek" ? llm.apiKey : "") || "",
    qwen: process.env.DASHSCOPE_API_KEY || llm.api_keys?.qwen || (provider === "qwen" ? llm.apiKey : "") || "",
    nvidia: process.env.NVIDIA_API_KEY || llm.api_keys?.nvidia || (provider === "nvidia" ? llm.apiKey : "") || "",
    meta: process.env.GROQ_API_KEY || llm.api_keys?.meta || (provider === "meta" ? llm.apiKey : "") || "",
    ollama: process.env.OLLAMA_API_KEY || llm.api_keys?.ollama || "ollama",
    lmstudio: process.env.LMSTUDIO_API_KEY || llm.api_keys?.lmstudio || "lm-studio",
    ...(llm.api_keys || {}),
  };

  let apiKey = override?.apiKey || apiKeys[provider] || process.env[preset.envKeyName] || "";
  if (preset.isLocal && !apiKey) {
    apiKey = provider === "ollama" ? "ollama" : "lm-studio";
  }

  const isSameProvider = provider === (llm.provider || "openai");
  let baseUrl = override?.baseUrl || (isSameProvider ? (llm.base_url || process.env.OPENAI_BASE_URL) : undefined) || preset.defaultBaseUrl;
  let model = override?.model || (isSameProvider ? (llm.model || process.env.OPENAI_MODEL) : undefined) || preset.defaultModel;

  return {
    provider,
    model,
    baseUrl,
    apiKey,
    temperature: override?.temperature ?? (llm.temperature ?? 0.1),
    apiKeys,
  };
}

export async function testLlmConnection(
  provider: string,
  config?: { baseUrl?: string; apiKey?: string; model?: string }
): Promise<{ success: boolean; latencyMs?: number; error?: string; modelUsed?: string }> {
  const resolved = resolveLlmConfig({
    provider,
    baseUrl: config?.baseUrl,
    apiKey: config?.apiKey,
    model: config?.model,
  });

  const start = Date.now();
  try {
    const url = `${resolved.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolved.apiKey || "dummy"}`,
      },
      body: JSON.stringify({
        model: resolved.model,
        messages: [{ role: "user", content: "Ping" }],
        max_tokens: 2,
      }),
    });

    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { success: true, latencyMs, modelUsed: resolved.model };
    }

    const errText = await res.text();
    return {
      success: false,
      latencyMs,
      error: `HTTP ${res.status}: ${errText.slice(0, 150)}`,
      modelUsed: resolved.model,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      latencyMs,
      error: err.message || String(err),
      modelUsed: resolved.model,
    };
  }
}
