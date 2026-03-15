/**
 * Shared config: API keys and options stored in a local JSON file.
 * Used by CLI and Web (API routes).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_DIR_ENV = "TURKEY_CONFIG_DIR";
const CONFIG_FILENAME = "config.json";

function getConfigDir(): string {
  if (process.env[CONFIG_DIR_ENV]) return process.env[CONFIG_DIR_ENV]!;
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const base = process.platform === "win32" ? process.env.APPDATA ?? home : join(home, ".config");
  return join(base, "turkey");
}

export function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILENAME);
}

export type ConfigData = Record<string, string>;

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function loadConfig(): ConfigData {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    const out: ConfigData = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveConfig(data: ConfigData): void {
  ensureConfigDir();
  writeFileSync(getConfigPath(), JSON.stringify(data, null, 2), "utf-8");
}

export function setConfigKey(key: string, value: string): ConfigData {
  const data = loadConfig();
  data[key] = value;
  saveConfig(data);
  return data;
}

export function getConfigKey(key: string): string | undefined {
  return loadConfig()[key];
}

export function unsetConfigKey(key: string): ConfigData {
  const data = loadConfig();
  delete data[key];
  saveConfig(data);
  return data;
}

export function listConfigKeys(): Array<{ key: string; masked: string }> {
  const data = loadConfig();
  return Object.entries(data).map(([key, value]) => ({
    key,
    masked: value.length <= 8 ? "****" : value.slice(0, 4) + "***" + value.slice(-4),
  }));
}

export function applyConfigToEnv(): void {
  const data = loadConfig();
  for (const [key, value] of Object.entries(data)) {
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}
