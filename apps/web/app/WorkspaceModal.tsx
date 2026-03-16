"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLocale } from "./LocaleContext";
import { useHistory } from "./HistoryContext";
import { useWorkspaceModal } from "./WorkspaceModalContext";

type AggregateInputItem = { type: "conversation" | "image" | "url"; value: string };

export function WorkspaceModal() {
  const { isOpen, closeModal } = useWorkspaceModal();
  const { t } = useLocale();
  const { addItem } = useHistory();

  const [inputs, setInputs] = useState<AggregateInputItem[]>([{ type: "conversation", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);

  function addInput() {
    setInputs((prev) => [...prev, { type: "conversation", value: "" }]);
  }

  function updateInput(i: number, field: "type" | "value", v: string) {
    setInputs((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: v };
      return next;
    });
  }

  function removeInput(i: number) {
    setInputs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function generate() {
    const nonEmpty = inputs.filter((i) => i.value.trim());
    if (nonEmpty.length === 0) {
      setError("Add at least one source.");
      return;
    }
    setError(null);
    setLoading(true);
    setReport(null);
    setProgress([]);
    try {
      const res = await fetch("/api/aggregate-report/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: nonEmpty }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const pushProgress = (msg: string) =>
        setProgress((prev) => [...prev, msg].slice(-200));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let splitIdx: number;
        while ((splitIdx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, splitIdx);
          buffer = buffer.slice(splitIdx + 2);
          const lines = rawEvent.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          const event = eventLine?.replace(/^event:\s*/, "").trim();
          const dataText = dataLine?.replace(/^data:\s*/, "") ?? "{}";
          let payload: Record<string, unknown> = {};
          try {
            payload = JSON.parse(dataText) as Record<string, unknown>;
          } catch {
            payload = { message: dataText };
          }

          if (event === "progress" || event === "status") {
            const msg = String(payload.message ?? "");
            if (msg) pushProgress(msg);
          } else if (event === "report") {
            const output = String(payload.report ?? "");
            setReport(output);
            addItem({
              types: nonEmpty.map((i) => i.type),
              snippet: output.toString().split("\n").slice(0, 3).join(" ").slice(0, 160),
              report: output,
            });
          } else if (event === "error") {
            throw new Error(String(payload.message ?? "Unknown streaming error"));
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function close() {
    closeModal();
    setError(null);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t("home.aggregate")}</h2>
          <button type="button" className="modal-close" onClick={close}>
            ×
          </button>
        </div>
        <p>{t("home.aggregateDesc")}</p>
        <div className="form-row">
          {inputs.map((inp, i) => (
            <div key={i} className="aggregate-row">
              <select
                value={inp.type}
                onChange={(e) => updateInput(i, "type", e.target.value)}
                aria-label={t("home.inputType")}
              >
                <option value="conversation">{t("home.inputTypeConversation")}</option>
                <option value="image">{t("home.inputTypeImage")}</option>
                <option value="url">{t("home.inputTypeUrl")}</option>
              </select>
              <input
                value={inp.value}
                onChange={(e) => updateInput(i, "value", e.target.value)}
                placeholder={
                  inp.type === "url"
                    ? "https://..."
                    : inp.type === "image"
                      ? "Image URL or base64"
                      : "Paste conversation or text"
                }
                aria-label={t("home.inputValue")}
              />
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeInput(i)}
                disabled={inputs.length <= 1}
                title={inputs.length <= 1 ? "" : "Remove"}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex">
          <button type="button" onClick={addInput}>
            {t("home.addInput")}
          </button>
          <button type="button" onClick={generate} disabled={loading}>
            {loading ? t("home.loading") : t("home.generateReport")}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
        {progress.length > 0 && (
          <div className="progress-box">
            <div className="progress-title">Agent reasoning progress</div>
            <ul className="progress-list">
              {progress.map((line, idx) => (
                <li key={`${idx}-${line}`}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {report !== null && (
          <div className="report-pre markdown-output">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

