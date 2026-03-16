#!/usr/bin/env bun
/**
 * Turkey CLI: context aggregation and task breakdown.
 * Future Web will reuse @turkey/core; this package is CLI-only.
 */

import {
  applyConfigToEnv,
  getConfigPath,
  getConfigKey,
  listConfigKeys,
  setConfigKey,
  unsetConfigKey,
} from "./config.js";
applyConfigToEnv();

import { Command } from "commander";
import {
  aggregateContext,
  breakdownTasks,
  type ContextFetcher,
  type AggregatedContext,
  type AggregatorConfig,
} from "@turkey/core";
import { resolveLocale, t, type Locale } from "@turkey/i18n";
import { createLLMAdapter } from "@turkey/llm";

// Example: static context fetcher (replace with GitHub/Jira etc. later)
const staticFetcher: ContextFetcher = {
  async fetch() {
    return [
      {
        id: "1",
        type: "issue",
        title: "Example: user login flow improvements",
        body: "Support remember-me and add security checks.",
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

async function runAggregate(fetchers: ContextFetcher[], config: AggregatorConfig): Promise<AggregatedContext> {
  const startedAt = Date.now();
  console.log("[cli:aggregate] start, fetchers:", fetchers.length);
  const ctx = await aggregateContext(fetchers, config);
  console.log("[cli:aggregate] done in", Date.now() - startedAt, "ms, sources:", ctx.sources.length);
  return ctx;
}

async function runBreakdown(context: AggregatedContext, goal: string, locale: Locale): Promise<void> {
  console.log("[cli:breakdown] start, goal:", goal, "sources:", context.sources.length);
  const startedAt = Date.now();
  const llm = createLLMAdapter();
  const result = await breakdownTasks(context, goal, llm);
  console.log("[cli:breakdown] LLM finished in", Date.now() - startedAt, "ms, tasks:", result.tasks.length);
  const priorityKey = (p: string) => `cli.task.priority${p.charAt(0).toUpperCase() + p.slice(1)}`;
  console.log("\n" + t("cli.breakdown.labelGoal", locale) + ":", result.goal);
  console.log("\n" + t("cli.breakdown.labelSubtasks", locale) + ":");
  result.tasks.forEach((task) => {
    const priorityLabel = t(priorityKey(task.priority ?? "medium"), locale);
    const timeStr = task.estimatedMinutes ? " " + t("cli.task.minutes", locale, { minutes: task.estimatedMinutes }) : "";
    console.log(`  [${priorityLabel}] ${task.title}${timeStr}`);
    if (task.description) console.log(`      ${task.description}`);
  });
}

// Resolve locale early so help text and output use it (from --locale or LOCALE env)
const localeFromArgv =
  process.argv.includes("--locale") && process.argv[process.argv.indexOf("--locale") + 1]
    ? process.argv[process.argv.indexOf("--locale") + 1]
    : undefined;
let locale: Locale = resolveLocale(localeFromArgv ?? process.env.LOCALE);

const program = new Command();

program
  .name(t("cli.name", locale))
  .description(t("cli.description", locale))
  .version(t("cli.version", locale))
  .option("-l, --locale <locale>", "Locale: en (default) or zh", (v) => {
    locale = resolveLocale(v);
    return locale;
  });

program
  .command("aggregate")
  .description(t("cli.aggregate.description", locale))
  .action(async () => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    const ctx = await runAggregate([staticFetcher], {});
    console.log(t("cli.aggregate.sourcesCount", locale, { count: ctx.sources.length }));
    ctx.sources.forEach((s) =>
      console.log("  -", t("cli.aggregate.sourceItem", locale, { type: s.type, title: s.title }))
    );
  });

program
  .command("breakdown")
  .description(t("cli.breakdown.description", locale))
  .argument("<goal>", t("cli.breakdown.goalArg", locale))
  .action(async (goal: string) => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    const ctx = await runAggregate([staticFetcher], {});
    await runBreakdown(ctx, goal, locale);
  });

const configCmd = program
  .command("config")
  .description(t("cli.config.description", locale));

configCmd
  .command("set")
  .description(t("cli.config.set.description", locale))
  .argument("<key>", t("cli.config.set.keyArg", locale))
  .argument("<value>", t("cli.config.set.valueArg", locale))
  .action((key: string, value: string) => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    setConfigKey(key, value);
    console.log(t("cli.config.set.success", locale, { key }));
  });

configCmd
  .command("get")
  .description(t("cli.config.get.description", locale))
  .argument("<key>", t("cli.config.get.keyArg", locale))
  .option("--show", t("cli.config.showFlag", locale))
  .action((key: string, opts: { show?: boolean }) => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    const value = getConfigKey(key);
    if (value === undefined) {
      console.log(t("cli.config.get.notSet", locale, { key }));
      return;
    }
    const display = opts.show ? value : value.slice(0, 4) + "***" + value.slice(-4);
    console.log(t("cli.config.get.value", locale, { key, value: display }));
  });

configCmd
  .command("list")
  .description(t("cli.config.list.description", locale))
  .action(() => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    const keys = listConfigKeys();
    if (keys.length === 0) {
      console.log(t("cli.config.list.empty", locale));
      return;
    }
    console.log(t("cli.config.list.header", locale));
    keys.forEach(({ key, masked }) => console.log(`  ${key}=${masked}`));
  });

configCmd
  .command("unset")
  .description(t("cli.config.unset.description", locale))
  .argument("<key>", t("cli.config.unset.keyArg", locale))
  .action((key: string) => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    unsetConfigKey(key);
    console.log(t("cli.config.unset.success", locale, { key }));
  });

configCmd
  .command("path")
  .description(t("cli.config.pathDescription", locale))
  .action(() => {
    locale = resolveLocale(program.opts().locale ?? process.env.LOCALE);
    console.log(t("cli.config.path", locale, { path: getConfigPath() }));
  });

program.parse();
