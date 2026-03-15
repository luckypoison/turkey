/**
 * LLM package types. Re-exports core LLMAdapter so CLI/Web depend on one place.
 */

export type { LLMAdapter } from "@turkey/core";

export type LLMProvider = "kimi" | "qwen" | "openai";

export interface LLMProviderConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

/** Options passed when creating an adapter (per-provider or unified). */
export interface LLMAdapterOptions {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}
