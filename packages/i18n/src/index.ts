/**
 * Shared i18n for Turkey. Used by CLI and (later) Web.
 * English is the default/primary language.
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const defaultLocale = "en";
export type Locale = "en" | "zh";

const supportedLocales: Locale[] = ["en", "zh"];
const __dirname = dirname(fileURLToPath(import.meta.url));

const messages: Record<Locale, Record<string, unknown>> = {} as Record<
  Locale,
  Record<string, unknown>
>;

function loadLocale(locale: Locale): Record<string, unknown> {
  if (messages[locale]) return messages[locale] as Record<string, unknown>;
  const path = join(__dirname, "locales", `${locale}.json`);
  const raw = readFileSync(path, "utf-8");
  messages[locale] = JSON.parse(raw) as Record<string, unknown>;
  return messages[locale] as Record<string, unknown>;
}

/** Resolve locale from env or flag; falls back to defaultLocale. */
export function resolveLocale(locale?: string): Locale {
  const raw = (locale ?? process.env.LOCALE ?? defaultLocale).toLowerCase().slice(0, 2);
  return supportedLocales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;
}

/**
 * Get a nested value by dot path, e.g. "cli.aggregate.description".
 * Supports placeholders like {count} — pass replacements as second argument.
 */
export function t(
  key: string,
  locale: Locale = defaultLocale,
  replacements?: Record<string, string | number>
): string {
  const data = loadLocale(locale);
  const value = key.split(".").reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], data);
  let str = typeof value === "string" ? value : key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
