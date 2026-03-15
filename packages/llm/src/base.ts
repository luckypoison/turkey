/**
 * Shared OpenAI-compatible chat completion adapter.
 * All providers (Kimi, Qwen, OpenAI) use the same HTTP request/response shape.
 */

import type { LLMAdapter } from "@turkey/core";

export interface ChatCompletionConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function createChatCompletionAdapter(config: ChatCompletionConfig): LLMAdapter {
  const { baseUrl, model, apiKey } = config;
  return {
    async complete(prompt: string, opts?: { system?: string }): Promise<string> {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(opts?.system ? [{ role: "system" as const, content: opts.system }] : []),
            { role: "user" as const, content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LLM API error ${res.status}: ${err}`);
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (content == null) throw new Error("LLM returned empty content");
      return content;
    },
  };
}
