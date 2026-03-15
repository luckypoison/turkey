/**
 * Kimi (Moonshot) LLM adapter.
 */

import type { LLMAdapter } from "@turkey/core";
import { createChatCompletionAdapter } from "./base";
import type { LLMProviderConfig, LLMAdapterOptions } from "./types";

const DEFAULT_BASE_URL = "https://api.moonshot.cn/v1";
const DEFAULT_MODEL = "moonshot-v1-8k";
const ENV_KEYS = ["KIMI_API_KEY", "MOONSHOT_API_KEY"];

function getApiKey(options?: LLMAdapterOptions): string {
  if (options?.apiKey?.trim()) return options.apiKey!.trim();
  for (const key of ENV_KEYS) {
    const v = process.env[key];
    if (v?.trim()) return v.trim();
  }
  return "";
}

export function getKimiConfig(options?: LLMAdapterOptions): LLMProviderConfig {
  const baseUrl =
    options?.baseUrl ??
    process.env.KIMI_API_BASE ??
    process.env.MOONSHOT_API_BASE ??
    DEFAULT_BASE_URL;
  const model =
    options?.model ??
    process.env.KIMI_MODEL ??
    process.env.MOONSHOT_MODEL ??
    DEFAULT_MODEL;
  const apiKey = getApiKey(options);
  return { baseUrl, model, apiKey };
}

export function createKimiAdapter(options?: LLMAdapterOptions): LLMAdapter {
  return createChatCompletionAdapter(getKimiConfig(options));
}
