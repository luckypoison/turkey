/**
 * Unified factory: create an LLM adapter by provider name (from env or argument).
 */

import type { LLMAdapter } from "@turkey/core";
import type { LLMProvider, LLMAdapterOptions } from "./types";
import { resolveProvider } from "./resolve";
import { createChatCompletionAdapter } from "./base";
import { createKimiAdapter } from "./kimi";
import { createQwenAdapter } from "./qwen";
import { createOpenAIAdapter } from "./openai";

/**
 * Create an LLM adapter for the given provider (default: kimi).
 * Provider can be set via argument or env TURKEY_LLM_PROVIDER / LLM_PROVIDER.
 */
export function createLLMAdapter(
  provider?: LLMProvider | string,
  options?: LLMAdapterOptions
): LLMAdapter {
  const p = resolveProvider(provider as string);
  if (p === "qwen") return createQwenAdapter(options);
  if (p === "openai") return createOpenAIAdapter(options);
  return createKimiAdapter(options);
}
