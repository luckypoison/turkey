import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "./LocaleContext";
import { Nav } from "./Nav";

export const metadata: Metadata = {
  title: "Turkey — Developer workflow assistant",
  description: "Context aggregation and task breakdown",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <div className="layout">
            <Nav />
            <main className="main">{children}</main>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
