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
  const body = await request.json();
  const goal = body?.goal as string | undefined;
  if (!goal?.trim()) {
    return NextResponse.json(
      { error: "Missing goal" },
      { status: 400 }
    );
  }
  applyConfigToEnv();
  const context = await aggregateContext([staticFetcher], {});
  const llm = createLLMAdapter();
  const result = await breakdownTasks(context, goal.trim(), llm);
  return NextResponse.json(result);
}
