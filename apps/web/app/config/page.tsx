"use client";

import { useState, useEffect } from "react";
import { useLocale } from "../LocaleContext";

type ConfigKey = { key: string; masked: string };

export default function ConfigPage() {
  const { t } = useLocale();
  const [configPath, setConfigPath] = useState<string | null>(null);
  const [keys, setKeys] = useState<ConfigKey[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPath() {
    try {
      const res = await fetch("/api/config/path");
      const data = await res.json();
      setConfigPath(data.path ?? null);
    } catch {
      setConfigPath(null);
    }
  }

  async function loadKeys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPath();
    loadKeys();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || newValue === "") return;
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), value: newValue }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewKey("");
      setNewValue("");
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(key: string) {
    setError(null);
    try {
      const res = await fetch(`/api/config?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <h1>{t("config.title")}</h1>
      {configPath && (
        <p className="config-path">
          <strong>{t("config.pathLabel")}:</strong> {configPath}
        </p>
      )}

      <form onSubmit={handleAdd} className="card">
        <h2>{t("config.add")}</h2>
        <div className="form-row">
          <label>{t("config.setKey")}</label>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. OPENAI_API_KEY"
          />
        </div>
        <div className="form-row">
          <label>{t("config.setValue")}</label>
          <input
            type="password"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Your API key"
          />
        </div>
        <div className="flex">
          <button type="submit" disabled={!newKey.trim() || newValue === ""}>
            {t("config.add")}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </form>

      <section className="card">
        <h2>{t("config.listHeader")}</h2>
        {loading ? (
          <p>{t("home.loading")}</p>
        ) : keys.length === 0 ? (
          <p>{t("config.empty")}</p>
        ) : (
          <div className="config-list">
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value (masked)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map(({ key, masked }) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{masked}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(key)}
                      >
                        {t("config.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
