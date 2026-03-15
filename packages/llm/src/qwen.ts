/**
 * Qwen (DashScope) LLM adapter.
 */

import type { LLMAdapter } from "@turkey/core";
import { createChatCompletionAdapter } from "./base";
import type { LLMProviderConfig, LLMAdapterOptions } from "./types";

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen-turbo";
const ENV_KEYS = ["DASHSCOPE_API_KEY", "QWEN_API_KEY"];

function getApiKey(options?: LLMAdapterOptions): string {
  if (options?.apiKey?.trim()) return options.apiKey!.trim();
  for (const key of ENV_KEYS) {
    const v = process.env[key];
    if (v?.trim()) return v.trim();
  }
  return "";
}

export function getQwenConfig(options?: LLMAdapterOptions): LLMProviderConfig {
  const baseUrl =
    options?.baseUrl ??
    process.env.QWEN_API_BASE ??
    process.env.DASHSCOPE_API_BASE ??
    DEFAULT_BASE_URL;
  const model =
    options?.model ??
    process.env.QWEN_MODEL ??
    process.env.DASHSCOPE_MODEL ??
    DEFAULT_MODEL;
  const apiKey = getApiKey(options);
  return { baseUrl, model, apiKey };
}

export function createQwenAdapter(options?: LLMAdapterOptions): LLMAdapter {
  return createChatCompletionAdapter(getQwenConfig(options));
}
