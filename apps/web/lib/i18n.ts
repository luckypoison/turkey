import en from "@/lib/locales/en.json";
import zh from "@/lib/locales/zh.json";

export type Locale = "en" | "zh";

const messages: Record<Locale, Record<string, unknown>> = { en, zh };

export function t(key: string, locale: Locale, replacements?: Record<string, string | number>): string {
  const parts = key.split(".");
  let value: unknown = messages[locale];
  for (const p of parts) {
    value = (value as Record<string, unknown>)?.[p];
  }
  let str = typeof value === "string" ? value : key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
