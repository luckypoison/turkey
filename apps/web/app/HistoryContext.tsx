"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type HistoryItem = {
  id: string;
  createdAt: string;
  types: string[];
  snippet: string;
  report?: string;
};

type HistoryContextValue = {
  items: HistoryItem[];
  addItem: (item: Omit<HistoryItem, "id" | "createdAt">) => void;
};

const HistoryContext = createContext<HistoryContextValue | null>(null);

const STORAGE_KEY = "turkey_history_v1";

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<HistoryItem, "id" | "createdAt">) => {
      const now = new Date();
      const historyItem: HistoryItem = {
        id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now.toISOString(),
        ...item,
      };
      setItems((prev) => [historyItem, ...prev].slice(0, 100));
    },
    []
  );

  return (
    <HistoryContext.Provider value={{ items, addItem }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return ctx;
}

