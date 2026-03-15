# Turkey

Developer workflow assistant: **context aggregation and task breakdown**. CLI and Web share the same core, config, and LLM packages.

## Tech stack (CLI + future Web)

| Layer | Choice | Notes |
|-------|--------|--------|
| **Runtime** | Bun | Fast, native TS; works with Node ecosystem |
| **Language** | TypeScript | Shared types across core, CLI, and Web |
| **Structure** | Monorepo (workspaces) | `packages/core` = logic only; `packages/cli` / future `apps/web` = I/O and UI |
| **CLI** | Commander | Stable, easy to add subcommands |
| **Web** | Next.js 14 (App Router) | Same features as CLI: config, aggregate, breakdown; uses `@turkey/core`, `@turkey/config`, `@turkey/llm` |

## Internationalization (i18n)

- **Primary language**: English. All code, comments, and default UI strings are in English.
- **Supported locales**: `en` (default), `zh` (中文).
- **Usage**:
  - CLI: `--locale zh` or `-l zh`, or set env `LOCALE=zh`.
  - Locale affects command descriptions and all output (e.g. "Goal" vs "目标", "Subtasks" vs "子任务").
- **Adding locales**: Edit or add JSON under `packages/i18n/src/locales/` (e.g. `en.json`, `zh.json`). Use dot-keys like `cli.aggregate.description`. The shared `@turkey/i18n` package is used by CLI and can be used by the future Web app for consistent copy.

## Directory structure

```
turkey/
├── package.json
├── tsconfig.json
├── packages/
│   ├── core/           # Shared: types, aggregate, breakdown, LLMAdapter interface
│   │   └── src/
│   ├── i18n/           # Shared: locale files (en, zh), t(), resolveLocale()
│   │   └── src/
│   ├── llm/            # Shared: LLM adapters (Kimi, Qwen, OpenAI) for CLI & Web
│   │   └── src/
│   │       ├── types.ts
│   │       ├── base.ts
│   │       ├── kimi.ts
│   │       ├── qwen.ts
│   │       ├── openai.ts
│   │       ├── resolve.ts
│   │       ├── create.ts
│   │       └── index.ts
│   ├── config/         # Shared: config file (API keys) for CLI & Web
│   │   └── src/
│   ├── aggregate-agent/  # ReAct agent: multi-type inputs → skills + LLM → Markdown report (LangGraph)
│   │   └── src/
│   │       ├── types.ts   # AggregateInput (conversation | image | url)
│   │       ├── skills.ts  # Tools: extract_from_conversation, extract_from_image, fetch_and_extract_url
│   │       └── run.ts     # createReactAgent + stream, returns report
│   └── cli/            # CLI entry, depends on @turkey/core, @turkey/config, @turkey/i18n, @turkey/llm
│       └── src/
└── apps/
    └── web/            # Next.js app: config, aggregate, breakdown (en/zh)
        ├── app/
        │   ├── api/    # config, aggregate, breakdown routes
        │   ├── config/
        │   └── page.tsx
        └── lib/
```

## Usage

```bash
# From repo root
bun install

# Aggregate context only (example static data for now)
bun run cli aggregate

# Break down into subtasks (requires OPENAI_API_KEY)
OPENAI_API_KEY=sk-xxx bun run cli breakdown "Complete user login flow improvements"

# Configure API keys (stored in ~/.config/turkey/config.json; used by aggregate/breakdown)
bun run cli config set OPENAI_API_KEY sk-xxx
bun run cli config set GITHUB_TOKEN ghp_xxx
bun run cli config list
bun run cli config path

# Web app (same features: config, aggregate, breakdown; en/zh)
bun run dev:web
# Then open http://localhost:3000

# Use Chinese for CLI output and help
bun run cli --locale zh aggregate
LOCALE=zh bun run cli breakdown "完成用户登录流程优化"
```

## Config (API keys)

API keys and options can be stored in a local config file so you don’t need to pass them via env every time. They are used for aggregation (e.g. GitHub, Jira) and for the LLM (e.g. OpenAI).

- **Config file**: `~/.config/turkey/config.json` (or `%APPDATA%/turkey/config.json` on Windows). Override with `TURKEY_CONFIG_DIR`.
- **Commands**:
  - `turkey config set <key> <value>` — set a key (e.g. `KIMI_API_KEY`, `DASHSCOPE_API_KEY`, `OPENAI_API_KEY`, `TURKEY_LLM_PROVIDER`, `GITHUB_TOKEN`)
  - `turkey config get <key>` — show value (masked); use `--show` to reveal
  - `turkey config list` — list all keys (values masked)
  - `turkey config unset <key>` — remove a key
  - `turkey config path` — print config file path
- **Priority**: Environment variables override config. So `OPENAI_API_KEY` in env is used before the value in config.

## LLM configuration

The `breakdown` command uses an LLM from the shared **@turkey/llm** package (Kimi, Qwen, OpenAI). The same package can be used by the future Web app. Provider defaults to **Kimi** and can be switched to **Qwen** or **OpenAI**.

- **Provider**: set `TURKEY_LLM_PROVIDER` or `LLM_PROVIDER` to `kimi` (default), `qwen`, or `openai`. Can also be set in config.
- **Kimi (default)**  
  - API key: `KIMI_API_KEY` or `MOONSHOT_API_KEY`  
  - Base URL: `KIMI_API_BASE` or `MOONSHOT_API_BASE` (default `https://api.moonshot.cn/v1`)  
  - Model: `KIMI_MODEL` or `MOONSHOT_MODEL` (default `moonshot-v1-8k`)
- **Qwen**  
  - API key: `DASHSCOPE_API_KEY` or `QWEN_API_KEY`  
  - Base URL: `QWEN_API_BASE` or `DASHSCOPE_API_BASE` (default `https://dashscope.aliyuncs.com/compatible-mode/v1`)  
  - Model: `QWEN_MODEL` or `DASHSCOPE_MODEL` (default `qwen-turbo`)
- **OpenAI**  
  - API key: `OPENAI_API_KEY`  
  - Base URL: `OPENAI_API_BASE` (default `https://api.openai.com/v1`)  
  - Model: `OPENAI_MODEL` (default `gpt-4o-mini`)

## Aggregate report (ReAct agent)

The **Aggregate context** flow supports multiple input types and produces a single **Markdown report**:

- **Input types**: `conversation` (text), `image` (URL or base64), `url` (web page).
- **Process**: A **ReAct agent** (LangGraph `createReactAgent`) chooses which **skill** to run for each input, then synthesizes one report. Skills use the same LLM (Kimi/Qwen/OpenAI from config) to extract information.
- **Stack**: `@turkey/aggregate-agent` uses **LangChain** (`@langchain/core`, `@langchain/openai`) and **LangGraph** (`@langchain/langgraph` prebuilt `createReactAgent`). The chat model is created from `@turkey/llm` provider config (base URL + API key).

Web: add one or more inputs (type + value) on the home page and click **Generate report** to run the agent and see the Markdown output.

## Web app

The app in `apps/web` implements the same features as the CLI:

- **Config** (`/config`): Add/remove API keys (same file as CLI: `~/.config/turkey/config.json`). Shows config file path and masked list.
- **Aggregate** (home): Add multiple inputs (conversation, image URL, or page URL); **Generate report** runs the ReAct agent and shows the Markdown report.
- **Breakdown** (home): Enter a goal, run to get subtasks (uses LLM; reads API keys from config or env).

Run with `bun run dev:web` from the repo root, then open http://localhost:3000. Use the nav to switch between Home and Config; use the locale switcher (EN / 中文) for language.
