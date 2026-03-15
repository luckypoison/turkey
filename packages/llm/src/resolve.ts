/**
 * Resolve provider from env and return unified config for that provider.
 */

import type { LLMProvider, LLMProviderConfig, LLMAdapterOptions } from "./types";
import { getKimiConfig } from "./kimi";
import { getQwenConfig } from "./qwen";
import { getOpenAIConfig } from "./openai";

const PROVIDER_ENV_VAR = "TURKEY_LLM_PROVIDER";
const PROVIDER_ENV_ALT = "LLM_PROVIDER";

export function resolveProvider(provider?: string): LLMProvider {
  const raw = (
    provider ??
    process.env[PROVIDER_ENV_VAR] ??
    process.env[PROVIDER_ENV_ALT] ??
    "kimi"
  ).toLowerCase();
  if (raw === "kimi" || raw === "qwen" || raw === "openai") return raw;
  return "kimi";
}

export function getProviderConfig(
  provider?: LLMProvider | string,
  options?: LLMAdapterOptions
): LLMProviderConfig {
  const p = resolveProvider(provider as string);
  if (p === "kimi") return getKimiConfig(options);
  if (p === "qwen") return getQwenConfig(options);
  return getOpenAIConfig(options);
}
