/**
 * Input types for the aggregate agent. User can supply multiple items.
 */

export type AggregateInputType = "conversation" | "image" | "url";

export interface AggregateInput {
  type: AggregateInputType;
  /** For conversation: raw text. For image: URL or base64 data URL. For url: the page URL. */
  value: string;
}

export interface AggregateReportResult {
  report: string;
  /** Markdown content. */
}

export type AggregateProgressEvent = {
  stage: string;
  message: string;
  ts: string;
};

export interface RunAggregateReportOptions {
  onProgress?: (event: AggregateProgressEvent) => void;
}
