import { NextRequest, NextResponse } from "next/server";
import { applyConfigToEnv } from "@turkey/config";
import { aggregateContext, breakdownTasks, type ContextFetcher } from "@turkey/core";
import { createLLMAdapter } from "@turkey/llm";

const staticFetcher: ContextFetcher = {
  async fetch() {
    return [
      {
        id: "1",
        type: "issue",
        title: "Example: user login flow improvements",
        body: "Support remember-me and add security checks.",
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const body = await request.json();
  const goal = body?.goal as string | undefined;
  if (!goal?.trim()) {
    console.log("[api/breakdown] missing goal");
    return NextResponse.json(
      { error: "Missing goal" },
      { status: 400 }
    );
  }
  console.log("[api/breakdown] start, goal:", goal);
  applyConfigToEnv();
  console.log(
    "[api/breakdown] env applied, provider:",
    process.env.TURKEY_LLM_PROVIDER ?? process.env.LLM_PROVIDER ?? "default"
  );
  const context = await aggregateContext([staticFetcher], {});
  console.log("[api/breakdown] aggregated sources:", context.sources.length);
  const llm = createLLMAdapter();
  const result = await breakdownTasks(context, goal.trim(), llm);
  console.log(
    "[api/breakdown] done in",
    Date.now() - startedAt,
    "ms, tasks:",
    result.tasks.length
  );
  return NextResponse.json(result);
}
