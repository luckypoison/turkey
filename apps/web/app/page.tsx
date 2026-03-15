"use client";

import { useState } from "react";
import { useLocale } from "./LocaleContext";

type AggregateInputItem = { type: "conversation" | "image" | "url"; value: string };
type SubTask = {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: string;
};

export default function HomePage() {
  const { t } = useLocale();
  const [aggregateInputs, setAggregateInputs] = useState<AggregateInputItem[]>([
    { type: "conversation", value: "" },
  ]);
  const [report, setReport] = useState<string | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [aggregateError, setAggregateError] = useState<string | null>(null);

  const [goal, setGoal] = useState("");
  const [breakdownResult, setBreakdownResult] = useState<{
    goal: string;
    tasks: SubTask[];
  } | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  function addAggregateInput() {
    setAggregateInputs((prev) => [...prev, { type: "conversation", value: "" }]);
  }
  function updateAggregateInput(i: number, field: "type" | "value", v: string) {
    setAggregateInputs((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: v };
      return next;
    });
  }
  function removeAggregateInput(i: number) {
    setAggregateInputs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function runAggregateReport() {
    const inputs = aggregateInputs.filter((i) => i.value.trim());
    if (inputs.length === 0) {
      setAggregateError("Add at least one input with a value.");
      return;
    }
    setAggregateError(null);
    setAggregateLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/aggregate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setReport(data.report ?? "");
    } catch (e) {
      setAggregateError(e instanceof Error ? e.message : String(e));
    } finally {
      setAggregateLoading(false);
    }
  }

  async function runBreakdown() {
    if (!goal.trim()) return;
    setBreakdownError(null);
    setBreakdownLoading(true);
    setBreakdownResult(null);
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json();
      setBreakdownResult({ goal: data.goal, tasks: data.tasks ?? [] });
    } catch (e) {
      setBreakdownError(e instanceof Error ? e.message : String(e));
    } finally {
      setBreakdownLoading(false);
    }
  }

  const priorityClass = (p?: string) => {
    if (p === "high") return "badge-high";
    if (p === "low") return "badge-low";
    return "badge-medium";
  };

  return (
    <>
      <h1>{t("home.title")}</h1>
      <p className="subtitle">{t("home.subtitle")}</p>

      <section className="card">
        <h2>{t("home.aggregate")}</h2>
        <p>{t("home.aggregateDesc")}</p>
        <div className="form-row">
          {aggregateInputs.map((inp, i) => (
            <div key={i} className="aggregate-row">
              <select
                value={inp.type}
                onChange={(e) => updateAggregateInput(i, "type", e.target.value)}
                aria-label={t("home.inputType")}
              >
                <option value="conversation">{t("home.inputTypeConversation")}</option>
                <option value="image">{t("home.inputTypeImage")}</option>
                <option value="url">{t("home.inputTypeUrl")}</option>
              </select>
              <input
                value={inp.value}
                onChange={(e) => updateAggregateInput(i, "value", e.target.value)}
                placeholder={inp.type === "url" ? "https://..." : inp.type === "image" ? "Image URL or base64" : "Paste conversation or text"}
                aria-label={t("home.inputValue")}
              />
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeAggregateInput(i)}
                disabled={aggregateInputs.length <= 1}
                title={aggregateInputs.length <= 1 ? "" : "Remove"}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex">
          <button type="button" onClick={addAggregateInput}>
            {t("home.addInput")}
          </button>
          <button onClick={runAggregateReport} disabled={aggregateLoading}>
            {aggregateLoading ? t("home.loading") : t("home.generateReport")}
          </button>
        </div>
        {aggregateError && <p className="error-msg">{aggregateError}</p>}
        {report !== null && (
          <div className="report-output">
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "1rem", padding: "1rem", background: "#27272a", borderRadius: "8px", fontSize: "0.875rem", maxHeight: "400px", overflow: "auto" }}>
              {report}
            </pre>
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t("home.breakdown")}</h2>
        <p>{t("home.breakdownDesc")}</p>
        <div className="form-row">
          <label htmlFor="goal">{t("home.goalLabel")}</label>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t("home.goalPlaceholder")}
          />
        </div>
        <button onClick={runBreakdown} disabled={breakdownLoading || !goal.trim()}>
          {breakdownLoading ? t("home.loading") : t("home.run")}
        </button>
        {breakdownError && (
          <p className="error-msg">{breakdownError}</p>
        )}
        {breakdownResult && (
          <>
            <p><strong>{t("home.goalLabel")}:</strong> {breakdownResult.goal}</p>
            <p>{t("home.subtasksLabel")}:</p>
            <ul className="tasks-list">
              {breakdownResult.tasks.map((task) => (
                <li key={task.id}>
                  <span className={priorityClass(task.priority)}>
                    {task.priority ?? "medium"}
                  </span>{" "}
                  {task.title}
                  {(task.estimatedMinutes ?? task.description) && (
                    <div className="task-meta">
                      {task.estimatedMinutes != null &&
                        `~${task.estimatedMinutes} min`}
                      {task.description && ` · ${task.description}`}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
