/**
 * Skills (tools) for the aggregate agent. Each extracts useful information
 * from one type of input and returns a Markdown snippet.
 */

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const EXTRACT_SYSTEM = `You extract key information from the given content and return only a concise Markdown snippet (bullet points or short paragraphs). No preamble.`;

export function createExtractFromConversationTool(llm: BaseChatModel) {
  return tool(
    async ({ text }) => {
      const res = await llm.invoke([
        new SystemMessage(EXTRACT_SYSTEM),
        new HumanMessage(`Extract key information, decisions, and action items from this conversation:\n\n${text}`),
      ]);
      return typeof res.content === "string" ? res.content : String((res.content as unknown[])?.[0] ?? "");
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

export function createExtractFromImageTool(llm: BaseChatModel) {
  return tool(
    async ({ image_ref }) => {
      // image_ref can be URL or base64 data URL
      const isUrl = image_ref.startsWith("http") || image_ref.startsWith("data:");
      if (!isUrl) return "Invalid image reference: must be a URL or base64 data URL.";
      const res = await llm.invoke([
        new SystemMessage(EXTRACT_SYSTEM),
        new HumanMessage({
          content: [
            { type: "text", text: "Describe this image and extract any useful information (text, data, structure) as Markdown." },
            { type: "image_url", image_url: { url: image_ref } },
          ] as unknown as HumanMessage["content"],
        }),
      ]);
      return typeof res.content === "string" ? res.content : String((res.content as unknown[])?.[0] ?? "");
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

export function createFetchAndExtractUrlTool(llm: BaseChatModel) {
  return tool(
    async ({ url }) => {
      let text: string;
      try {
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
      } catch (e) {
        return `Error fetching URL: ${e instanceof Error ? e.message : String(e)}`;
      }
      const res = await llm.invoke([
        new SystemMessage(EXTRACT_SYSTEM),
        new HumanMessage(`Extract key information from this web page content (URL: ${url}):\n\n${text}`),
      ]);
      return typeof res.content === "string" ? res.content : String((res.content as unknown[])?.[0] ?? "");
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

export function createAggregateTools(llm: BaseChatModel) {
  return [
    createExtractFromConversationTool(llm),
    createExtractFromImageTool(llm),
    createFetchAndExtractUrlTool(llm),
  ];
}
