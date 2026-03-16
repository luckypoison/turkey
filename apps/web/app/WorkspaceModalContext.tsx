"use client";

import { createContext, useContext, useState } from "react";

type WorkspaceModalContextValue = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const WorkspaceModalContext = createContext<WorkspaceModalContextValue | null>(null);

export function WorkspaceModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <WorkspaceModalContext.Provider
      value={{
        isOpen,
        openModal: () => setIsOpen(true),
        closeModal: () => setIsOpen(false),
      }}
    >
      {children}
    </WorkspaceModalContext.Provider>
  );
}

export function useWorkspaceModal() {
  const ctx = useContext(WorkspaceModalContext);
  if (!ctx) throw new Error("useWorkspaceModal must be used within WorkspaceModalProvider");
  return ctx;
}

