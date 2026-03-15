/**
 * Context aggregation: collect from multiple sources and normalize into AggregatedContext.
 * Concrete sources (GitHub, Jira, etc.) are injected by the caller; core only aggregates.
 */

import type { ContextSource, AggregatedContext, AggregatorConfig } from "./types";

export interface ContextFetcher {
  fetch(config: AggregatorConfig): Promise<ContextSource[]>;
}

/** Merge results from multiple fetchers into one AggregatedContext */
export async function aggregateContext(
  fetchers: ContextFetcher[],
  config: AggregatorConfig
): Promise<AggregatedContext> {
  const results = await Promise.all(fetchers.map((f) => f.fetch(config)));
  const sources = results.flat();
  return {
    sources,
    aggregatedAt: new Date().toISOString(),
  };
}
