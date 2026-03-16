"use client";

import { useLocale } from "./LocaleContext";

export default function HomePage() {
  const { t } = useLocale();

  return (
    <>
      <h1>{t("home.title")}</h1>
      <p className="subtitle">{t("home.subtitle")}</p>

      <section className="card">
        <h2>Workspace-driven Flow</h2>
        <p>
          Click <strong>+ Add workspace</strong> in the left sidebar. A popup will open where you can
          add one or more sources and generate the report when sources are enough.
        </p>
      </section>
    </>
  );
}
