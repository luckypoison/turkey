"use client";

import Link from "next/link";
import { useLocale } from "./LocaleContext";

export function Nav() {
  const { locale, setLocale, t } = useLocale();
  return (
    <nav>
      <Link href="/">{t("nav.home")}</Link>
      <Link href="/config">{t("nav.config")}</Link>
      <div className="locale-switch">
        <button
          type="button"
          className={locale === "en" ? "active" : ""}
          onClick={() => setLocale("en")}
        >
          EN
        </button>
        <button
          type="button"
          className={locale === "zh" ? "active" : ""}
          onClick={() => setLocale("zh")}
        >
          中文
        </button>
      </div>
    </nav>
  );
}
