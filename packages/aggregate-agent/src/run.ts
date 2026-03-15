/**
 * Run the ReAct aggregate agent: process inputs with skills, then produce a Markdown report.
 */

import { applyConfigToEnv } from "@turkey/config";
import { getProviderConfig } from "@turkey/llm";
import type { AggregateInput, AggregateReportResult } from "./types";
import { createAggregateTools } from "./skills";

const SYSTEM_PROMPT = `You are an assistant that aggregates information from multiple inputs into one Markdown report.

You will receive a list of inputs. Each input has a type: "conversation" (text), "image" (URL or base64), or "url" (web page).
For each input:
- Use extract_from_conversation for text/conversation content.
- Use extract_from_image for image URLs or base64 image data.
- Use fetch_and_extract_url for web page URLs.

Process every input exactly once using the appropriate tool. After you have collected all extractions, produce a single Markdown report that:
1. Has a clear title (e.g. "Aggregate Report").
2. Has one section per input (e.g. "## Source 1 (conversation)", "## Source 2 (url)").
3. Summarizes the extracted information in each section.
4. Optionally ends with a "## Summary" that ties everything together.

Output only the final Markdown report as your last response, with no extra commentary.`;

function buildUserMessage(inputs: AggregateInput[]): string {
  const lines = inputs.map(
    (inp, i) => `- [${i + 1}] type: ${inp.type}, value: ${inp.type === "url" ? inp.value : inp.value.slice(0, 200) + (inp.value.length > 200 ? "..." : "")}`
  );
  return `Process the following ${inputs.length} input(s) and produce one Markdown report.\n\nInputs:\n${lines.join("\n")}\n\nUse the appropriate tool for each input, then write the final report.`;
}

export async function runAggregateReport(inputs: AggregateInput[]): Promise<AggregateReportResult> {
  if (inputs.length === 0) {
    return { report: "# Aggregate Report\n\nNo inputs provided." };
  }

  applyConfigToEnv();
  const config = getProviderConfig();

  const { ChatOpenAI } = await import("@langchain/openai");
  const { createReactAgent } = await import("@langchain/langgraph/prebuilt");
  const { HumanMessage } = await import("@langchain/core/messages");

  const llm = new ChatOpenAI({
    model: config.model,
    apiKey: config.apiKey,
    configuration: config.baseUrl ? { baseURL: config.baseUrl } : undefined,
    temperature: 0.2,
  });

  const tools = createAggregateTools(llm);
  const agent = createReactAgent({ llm, tools, prompt: SYSTEM_PROMPT });

  const stream = await agent.stream(
    { messages: [new HumanMessage(buildUserMessage(inputs))] },
    { streamMode: "values" }
  );

  let lastContent = "";
  for await (const chunk of stream) {
    const state = chunk as { messages?: Array<{ content?: string | unknown[] }> };
    const msgs = state.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (last?.content != null) {
      lastContent = typeof last.content === "string" ? last.content : String((last.content as unknown[])?.[0] ?? "");
    }
  }

  const report = lastContent.trim() || "# Aggregate Report\n\nNo content generated.";
  return { report };
}
