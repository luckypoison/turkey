/**
 * OpenAI LLM adapter.
 */

import type { LLMAdapter } from "@turkey/core";
import { createChatCompletionAdapter } from "./base";
import type { LLMProviderConfig, LLMAdapterOptions } from "./types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const ENV_KEYS = ["OPENAI_API_KEY"];

function getApiKey(options?: LLMAdapterOptions): string {
  if (options?.apiKey?.trim()) return options.apiKey!.trim();
  for (const key of ENV_KEYS) {
    const v = process.env[key];
    if (v?.trim()) return v.trim();
  }
  return "";
}

export function getOpenAIConfig(options?: LLMAdapterOptions): LLMProviderConfig {
  const baseUrl =
    options?.baseUrl ?? process.env.OPENAI_API_BASE ?? DEFAULT_BASE_URL;
  const model = options?.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const apiKey = getApiKey(options);
  return { baseUrl, model, apiKey };
}

export function createOpenAIAdapter(options?: LLMAdapterOptions): LLMAdapter {
  return createChatCompletionAdapter(getOpenAIConfig(options));
}
