/**
 * Task breakdown: given aggregated context and a goal, call LLM to produce subtasks.
 * Core does not depend on a specific LLM; caller injects LLMAdapter.
 */

import type { AggregatedContext, TaskBreakdown, SubTask, LLMAdapter } from "./types";

const BREAKDOWN_SYSTEM = `You are a developer workflow assistant. Given "context" and "goal", break the goal into executable subtasks.
Return valid JSON only, no other text. Format: { "goal": "short goal summary", "tasks": [ { "id": "t1", "title": "subtask title", "description": "optional", "estimatedMinutes": 30, "priority": "high"|"medium"|"low", "dependencies": [] } ] }`;

function buildBreakdownPrompt(context: AggregatedContext, userGoal: string): string {
  const contextBlob = context.sources
    .map((s) => `[${s.type}] ${s.title}\n${s.body ?? ""}`)
    .join("\n\n---\n\n");
  return `## Context\n${contextBlob}\n\n## Goal\n${userGoal}\n\nReturn subtasks as JSON only:`;
}

function parseBreakdownResponse(raw: string, goal: string): TaskBreakdown {
  const trimmed = raw.replace(/^```json?\s*|\s*```$/g, "").trim();
  let data: { goal?: string; tasks?: SubTask[] };
  try {
    data = JSON.parse(trimmed) as { goal?: string; tasks?: SubTask[] };
  } catch {
    throw new Error("LLM response is not valid JSON; cannot parse task breakdown.");
  }
  const tasks = (data.tasks ?? []).map((t, i) => ({
    id: t.id ?? `t${i + 1}`,
    title: t.title ?? "Unnamed task",
    description: t.description,
    estimatedMinutes: t.estimatedMinutes,
    priority: t.priority ?? "medium",
    dependencies: t.dependencies ?? [],
  }));
  return {
    goal: data.goal ?? goal,
    tasks,
    breakdownAt: new Date().toISOString(),
  };
}

export async function breakdownTasks(
  context: AggregatedContext,
  userGoal: string,
  llm: LLMAdapter
): Promise<TaskBreakdown> {
  const prompt = buildBreakdownPrompt(context, userGoal);
  const response = await llm.complete(prompt, { system: BREAKDOWN_SYSTEM });
  return parseBreakdownResponse(response, userGoal);
}
