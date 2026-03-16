"use client";

import { useHistory } from "./HistoryContext";
import { useLocale } from "./LocaleContext";
import { useWorkspaceModal } from "./WorkspaceModalContext";

export function Sidebar() {
  const { items } = useHistory();
  const { openModal } = useWorkspaceModal();
  const { t } = useLocale();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Workspaces</h2>
        <button
          type="button"
          className="sidebar-add"
          onClick={openModal}
        >
          + Add workspace
        </button>
      </div>
      <div className="sidebar-history">
        <h3 className="sidebar-section-title">History</h3>
        {items.length === 0 ? (
          <p className="sidebar-empty">No history yet. Generate a report to see it here.</p>
        ) : (
          <ul>
            {items.map((item) => {
              const date = new Date(item.createdAt);
              const label = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              return (
                <li key={item.id}>
                  <div className="sidebar-history-title">{label}</div>
                  <div className="sidebar-history-meta">
                    {item.types.join(", ")}
                  </div>
                  <div className="sidebar-history-snippet">
                    {item.snippet}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

