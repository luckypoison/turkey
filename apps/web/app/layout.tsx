import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "./LocaleContext";
import { HistoryProvider } from "./HistoryContext";
import { WorkspaceModalProvider } from "./WorkspaceModalContext";
import { Nav } from "./Nav";
import { Sidebar } from "./Sidebar";
import { WorkspaceModal } from "./WorkspaceModal";

export const metadata: Metadata = {
  title: "Turkey — Developer workflow assistant",
  description: "Context aggregation and task breakdown",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <WorkspaceModalProvider>
            <HistoryProvider>
              <div className="layout">
                <Nav />
                <div className="shell">
                  <Sidebar />
                  <main className="main">{children}</main>
                </div>
                <WorkspaceModal />
              </div>
            </HistoryProvider>
          </WorkspaceModalProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
