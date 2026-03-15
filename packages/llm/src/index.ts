/**
 * @turkey/llm — LLM adapters for Kimi, Qwen, and OpenAI.
 * Used by CLI and Web; implements @turkey/core LLMAdapter interface.
 */

export type { LLMAdapter, LLMProvider, LLMProviderConfig, LLMAdapterOptions } from "./types";
export { resolveProvider, getProviderConfig } from "./resolve";
export { createLLMAdapter } from "./create";
export { createKimiAdapter, getKimiConfig } from "./kimi";
export { createQwenAdapter, getQwenConfig } from "./qwen";
export { createOpenAIAdapter, getOpenAIConfig } from "./openai";
