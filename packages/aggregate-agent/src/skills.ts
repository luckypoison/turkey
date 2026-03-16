/**
 * Skills (tools) for the aggregate agent. Each extracts useful information
 * from one type of input and returns a Markdown snippet.
 */

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { AggregateProgressEvent } from "./types";

const EXTRACT_SYSTEM = `You extract key information from the given content and return only a concise Markdown snippet (bullet points or short paragraphs). No preamble.`;

type ProgressHandler = (event: AggregateProgressEvent) => void;

function emitProgress(onProgress: ProgressHandler | undefined, stage: string, message: string) {
  if (!onProgress) return;
  onProgress({
    stage,
    message,
    ts: new Date().toISOString(),
  });
}

export function createExtractFromConversationTool(llm: BaseChatModel, onProgress?: ProgressHandler) {
  return tool(
    async ({ text }) => {
      const startedAt = Date.now();
      console.log("[tool:conversation] start, length:", text.length);
      emitProgress(onProgress, "tool", `extract_from_conversation start (len=${text.length})`);
      const res = await llm.invoke([
        new SystemMessage(EXTRACT_SYSTEM),
        new HumanMessage(`Extract key information, decisions, and action items from this conversation:\n\n${text}`),
      ]);
      const out =
        typeof res.content === "string" ? res.content : String((res.content as unknown[])?.[0] ?? "");
      console.log(
        "[tool:conversation] done in",
        Date.now() - startedAt,
        "ms, output length:",
        out.length
      );
      emitProgress(
        onProgress,
        "tool",
        `extract_from_conversation done in ${Date.now() - startedAt}ms (out=${out.length})`
      );
      return out;
    },
    {
      name: "extract_from_conversation",
      description: "Extract key information, decisions, and action items from a conversation or text. Use for type 'conversation'.",
      schema: z.object({
        text: z.string().describe("The conversation or text content"),
      }),
    }
  );
}

export function createExtractFromImageTool(llm: BaseChatModel, onProgress?: ProgressHandler) {
  return tool(
    async ({ image_ref }) => {
      // image_ref can be URL or base64 data URL
      const isUrl = image_ref.startsWith("http") || image_ref.startsWith("data:");
      if (!isUrl) return "Invalid image reference: must be a URL or base64 data URL.";
      const startedAt = Date.now();
      console.log("[tool:image] start, ref:", image_ref.slice(0, 100));
      emitProgress(onProgress, "tool", "extract_from_image start");
      const res = await llm.invoke([
        new SystemMessage(EXTRACT_SYSTEM),
        new HumanMessage({
          content: [
            { type: "text", text: "Describe this image and extract any useful information (text, data, structure) as Markdown." },
            { type: "image_url", image_url: { url: image_ref } },
          ] as unknown as HumanMessage["content"],
        }),
      ]);
      const out =
        typeof res.content === "string" ? res.content : String((res.content as unknown[])?.[0] ?? "");
      console.log(
        "[tool:image] done in",
        Date.now() - startedAt,
        "ms, output length:",
        out.length
      );
      emitProgress(
        onProgress,
        "tool",
        `extract_from_image done in ${Date.now() - startedAt}ms (out=${out.length})`
      );
      return out;
    },
    {
      name: "extract_from_image",
      description: "Extract information from an image. Input must be an image URL or base64 data URL. Use for type 'image'.",
      schema: z.object({
        image_ref: z.string().describe("Image URL or base64 data URL"),
      }),
    }
  );
}

export function createFetchAndExtractUrlTool(llm: BaseChatModel, onProgress?: ProgressHandler) {
  return tool(
    async ({ url }) => {
      let text: string;
      try {
        const startedFetch = Date.now();
        console.log("[tool:url] fetching:", url);
        emitProgress(onProgress, "tool", `fetch_and_extract_url fetching: ${url}`);
        const res = await fetch(url, { headers: { "User-Agent": "Turkey-Aggregate/1.0" } });
        if (!res.ok) return `Failed to fetch URL (${res.status}): ${url}`;
        const html = await res.text();
        // Strip HTML tags roughly (no full parser)
        text = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 30000);
        console.log(
          "[tool:url] fetched and normalized html, length:",
          text.length,
          "in",
          Date.now() - startedFetch,
          "ms"
        );
        emitProgress(
          onProgress,
          "tool",
          `fetch_and_extract_url fetched in ${Date.now() - startedFetch}ms (text=${text.length})`
        );
      } catch (e) {
        return `Error fetching URL: ${e instanceof Error ? e.message : String(e)}`;
      }
      const startedAt = Date.now();
      emitProgress(onProgress, "tool", "fetch_and_extract_url extracting with LLM");
      const res = await llm.invoke([
        new SystemMessage(EXTRACT_SYSTEM),
        new HumanMessage(`Extract key information from this web page content (URL: ${url}):\n\n${text}`),
      ]);
      const out =
        typeof res.content === "string" ? res.content : String((res.content as unknown[])?.[0] ?? "");
      console.log(
        "[tool:url] done in",
        Date.now() - startedAt,
        "ms, output length:",
        out.length
      );
      emitProgress(
        onProgress,
        "tool",
        `fetch_and_extract_url done in ${Date.now() - startedAt}ms (out=${out.length})`
      );
      return out;
    },
    {
      name: "fetch_and_extract_url",
      description: "Fetch a web page and extract key information. Use for type 'url'.",
      schema: z.object({
        url: z.string().url().describe("The URL of the web page"),
      }),
    }
  );
}

export function createAggregateTools(llm: BaseChatModel, onProgress?: ProgressHandler) {
  return [
    createExtractFromConversationTool(llm, onProgress),
    createExtractFromImageTool(llm, onProgress),
    createFetchAndExtractUrlTool(llm, onProgress),
  ];
}
