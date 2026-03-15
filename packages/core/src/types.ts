/**
 * Context aggregation and task breakdown — shared types.
 * Used by both CLI and future Web.
 */

/** A single context source (issue, PR, doc, etc.) */
export interface ContextSource {
  id: string;
  type: "issue" | "pr" | "doc" | "meeting" | "custom";
  title: string;
  body?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

/** Aggregated context (e.g. "today's context") */
export interface AggregatedContext {
  sources: ContextSource[];
  summary?: string;
  aggregatedAt: string;
}

/** A single subtask after breakdown */
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: "high" | "medium" | "low";
  dependencies?: string[]; // IDs of other SubTasks
}

/** Result of task breakdown */
export interface TaskBreakdown {
  goal: string;
  tasks: SubTask[];
  breakdownAt: string;
}

/** Aggregator config (tokens for GitHub, Jira, etc.) */
export interface AggregatorConfig {
  [key: string]: unknown;
}

/** LLM adapter: core does not depend on a specific provider; CLI/Web inject implementation */
export interface LLMAdapter {
  complete(prompt: string, options?: { system?: string }): Promise<string>;
}
