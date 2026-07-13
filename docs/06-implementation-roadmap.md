# Aspedan AI Platform

# Implementation Roadmap & Task List

Version: 1.0

Status: Living document — update as tasks complete

Last updated: 2026-07-13 (sections 3-4 completed)

---

# Purpose

This document tracks concrete implementation tasks against the architecture defined in
`00-product-specification.md` through `05-agent-runtime-and-orchestration.md`. It is the
working task list for building the platform incrementally, one vertical slice at a time.

---

# Legend

- [x] Done
- [ ] Not started
- [~] In progress / partially done

---

# 0. Repository Health (baseline fixes)

The workspace had never been fully verified end to end. Before any feature work, these
pre-existing issues were found and fixed so `typecheck`, `build`, `test`, and `lint` pass
across `ai-core`, `providers`, `shared`, and `gateway`:

- [x] `ai-core/shared/providers` tsconfig.json set `module: commonjs` while inheriting
      `moduleResolution: nodenext` from `tsconfig.base.json` (TS5110, invalid combination).
      Fixed by aligning `module: nodenext`.
- [x] `tsconfig.spec.json` in each of the three libs didn't reference `tsconfig.lib.json`,
      so composite builds failed with TS6307 as soon as a spec file imported non-spec source.
      Fixed by adding the project reference.
- [x] `apps/gateway/eslint.config.mjs` imported `../eslint.config.mjs` (one level up) instead
      of `../../eslint.config.mjs` (repo root) — `gateway:lint` couldn't resolve the module.
- [x] `ai-core/tsconfig.lib.json`, `providers/tsconfig.lib.json`, and `shared/tsconfig.lib.json`
      all pointed `outDir` at the same absolute folder (`dist/out-tsc`), causing declaration
      file collisions (TS5055/TS6377) the moment one project referenced another via
      `nx sync`. Fixed by namespacing each project's output folder.
- [x] Ran `nx sync` to add the missing TS project reference from `providers` to `ai-core`.

**Verification:** `pnpm nx run-many -t typecheck,build,test,lint --projects=ai-core,providers,shared,gateway` passes clean.

## Two more baseline bugs found while wiring the Gateway (2026-07-13)

- [x] `@nx/esbuild:esbuild`'s build target runs its own internal type-check pass by
      default (`skipTypeCheck: false`), separate from the dedicated `typecheck` Nx target.
      As soon as `apps/gateway` had its first cross-lib imports (the chat/agent plugins),
      this internal pass broke with `TS6307` errors that the real `tsc --build` (the
      `typecheck` target) does **not** produce — confirmed by running `tsc --build` directly
      with zero errors. Root cause: `@nx/esbuild`'s `normalizeOptions` forces
      `skipTypeCheck: false` whenever it detects `declaration: true` OR `composite: true`
      in the resolved tsconfig (`tsConfig.options.composite` is `true` here via
      `tsconfig.base.json`), regardless of what you pass in. Fixed by explicitly setting
      both `"declaration": false` and `"skipTypeCheck": true` in `gateway`'s (and `cli`'s)
      build options — the dedicated `typecheck` target still catches real type errors.
- [x] Every app's `tsconfig.app.json` had `outDir: "../../dist/out-tsc"` (unnamespaced),
      the same collision class as the libs bug above but one level up — once two apps
      both have a `src/main.ts`, their declaration outputs would collide. Fixed by
      namespacing to `../../dist/out-tsc/<app-name>` for both `gateway` and `cli`.

## Known repo quirk (not a bug, just worth knowing)

Vitest spec files in this workspace must **not** explicitly `import { describe, it, expect, vi } from 'vitest'`.
The deprecated `nxViteTsPaths` plugin (from `@nx/vite`) mishandles resolving the bare `'vitest'`
specifier when Nx invokes the `test` target, and the run crashes with
`TypeError: Cannot read properties of undefined (reading 'config')`. Rely on the Vitest
globals (`globals: true` is already set in every `vitest.config.mts`) instead — this matches
the convention already used in `shared/src/lib/shared.spec.ts`.

---

# 1. Structural Decision — Resolved 2026-07-13

`docs/02-folder-structure.md` mandates an `apps/` + `libs/` layout. Migrated to match it:

- [x] Deleted the orphaned draft files in `libs/ai-core/src` and `libs/providers/src` (the
      original `AIProvider` interface + stub `OllamaProvider` — never registered as Nx
      projects, superseded by the real implementation below).
- [x] Moved `ai-core/`, `providers/`, `shared/` from the repo root into `libs/ai-core`,
      `libs/providers`, `libs/shared` (via `git mv`, history preserved).
- [x] Fixed every relative path affected by the extra directory depth: `tsconfig.json`
      `extends`, `tsconfig.lib.json`/`tsconfig.spec.json` `outDir`, `vitest.config.mts`
      `cacheDir`/`reportsDirectory`, `eslint.config.mjs` import, and each `project.json`
      (`sourceRoot`, `main`, `tsConfig`, `assets`).
- [x] Updated root `tsconfig.base.json` path mappings (`@org/ai-core`, `@org/providers`,
      `@org/shared`) and root `tsconfig.json` project references to point at `libs/*`.
- [x] Stopped the Nx daemon before the `git mv` of `src/` directories — it was holding
      directory handles and caused `EPERM`/"Permission denied" on Windows mid-move.
- [x] `nx show projects` now returns `["providers","ai-core","gateway","shared"]` — all
      four are properly registered from their `libs/`/`apps/` locations.
- [x] `libs/agents`, `libs/config`, `libs/mcp`, `libs/memory`, `libs/prompts`, `libs/rag`,
      `libs/tools` remain empty `.gitkeep` placeholders for future modules (section 4).

**Verification:** `pnpm nx run-many -t typecheck,build,test,lint --projects=ai-core,providers,shared,gateway`
passes clean from the new layout, and the live Ollama smoke test (chat with `qwen3:8b`)
was re-run successfully against `libs/providers/src/index.ts` after the move.

---

# 2. Provider Layer — done today

Implements `01-system-architecture.md` § Provider Architecture / Provider Factory.

- [x] `AIProvider` domain contract moved to `ai-core` (`chat`, `listModels`, `health`, `name`)
- [x] Domain-specific errors: `ProviderUnavailableError`, `ProviderRequestError`,
      `ProviderConfigurationError` (per `03-coding-standards.md` — no generic `throw new Error`)
- [x] `OllamaProvider` — real implementation against the Ollama HTTP API
      (`/api/chat` non-streaming, `/api/tags` for models/health)
- [x] `OpenAIProvider` — real implementation against the OpenAI Chat Completions API
      (`/chat/completions`, `/models`), with an overridable `baseUrl` so it also works
      against any OpenAI-compatible server (vLLM, llama.cpp, etc.)
- [x] `ProviderFactory.create()` / `ProviderFactory.fromEnv()` — centralized provider
      creation, selected via `AI_PROVIDER` env var, per "Provider creation must be
      centralized" rule
- [x] `.env` / `.env.example` — `AI_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_DEFAULT_MODEL`,
      `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_DEFAULT_MODEL`. `.env` is gitignored.
- [x] Unit tests for all three (`ollama.provider.spec.ts`, `openai.provider.spec.ts`,
      `provider-factory.spec.ts`) using mocked `fetch`
- [x] **Live smoke test against your real Docker Ollama** (`10.10.10.40:11434`): confirmed
      `listModels()`, `health()`, and `chat()` all work — got a real reply from `qwen3:8b`.
- [ ] OpenAI path has **not** been smoke-tested against a real API key (none provided yet) —
      only unit-tested with mocked `fetch`. Do this once you have a key you want to use.
- [x] **Tool-calling support added to the domain model** (2026-07-13): `ChatMessage` gained
      `toolCalls`, `ChatRequest` gained `tools`, `ChatResponse` gained `toolCalls`. Both
      providers map to/from the real wire formats — verified by hand against the actual
      Ollama API via `curl` first (Ollama returns `tool_calls[].function.arguments` as a
      real object; OpenAI returns it as a **JSON-encoded string** that must be parsed).
      `embed()` was also added to `AIProvider` (used by RAG below) and live-verified against
      `nomic-embed-text:latest` (768-dim vectors).

---

# 3. Vertical Slice — Done 2026-07-13

Goal achieved: `Client → Gateway route → Application service → ProviderFactory → Provider →
model → response`, per the layering in `01-system-architecture.md`.

- [x] `ChatService` (`libs/chat`, Application layer) — appends the user message to
      `ConversationMemory`, sends the full history to the `AIProvider`, appends the reply,
      returns it. Unit-tested (4 tests) with a fake in-memory provider.
- [x] `POST /chat` route in `apps/gateway` — Zod-validated (`conversationId`, `message`,
      optional `model`), delegates to `fastify.chatService` (decorated by a plugin, not
      constructed in the route — keeps the route free of business/provider logic per
      `01-system-architecture.md`).
- [x] `apps/gateway/src/main.ts` loads `.env` via Node 22's native `process.loadEnvFile()`
      (guarded with `existsSync` so it doesn't crash when `.env` is absent, e.g. in CI).
- [x] **End-to-end verified against the real Gateway process** (`node dist/gateway/main.js`
      + `curl`): first turn replied "pong"; a follow-up turn in the same `conversationId`
      correctly recalled it — proving `ConversationMemory` actually persists context across
      requests, not just within a single call.
- [x] Input validation verified (empty `conversationId`/`message` → `400` with Zod's
      `fieldErrors`), and malformed JSON bodies are caught by a global error handler
      (see section 4 Observability) rather than crashing the process.

---

# 4. Platform Modules — Done 2026-07-13

All items below were built as real, working v1 increments (not full production-spec
versions — see the "Honest scope notes" under each) and verified against the actual Ollama
server, not just with mocks.

## Memory (`libs/memory`)
- [x] `ConversationMemory` — in-memory, keyed by `conversationId`, trims to the last N
      messages (default 50). 6 unit tests.
- **Honest scope note:** in-memory only — restarting the gateway loses all history.
  `01-system-architecture.md` lists PostgreSQL/MongoDB/Redis as future backends; that's not
  done. There's no `MemoryProvider` abstraction yet, just the one concrete class.

## RAG (`libs/rag`)
- [x] `chunkText()` — character-based chunking with configurable size/overlap.
- [x] `InMemoryVectorStore` — cosine-similarity search, no external vector DB.
- [x] `RagService` — indexes a document (chunk → embed → store) and retrieves the top-K
      most relevant chunks for a query (embed query → cosine search).
- [x] **Live-verified with real embeddings**: indexed three sentences via
      `nomic-embed-text:latest`, asked "what framework does the gateway use?", got back the
      correct chunk ("...uses Fastify for its gateway...") with a real cosine score.
- **Honest scope note:** not wired into the `/chat` route yet (no retrieval-augmented chat
  endpoint) and no document-ingestion route in the Gateway — it's a working library, not yet
  a Gateway-exposed feature. `libs/vector-store` as its own package (per
  `02-folder-structure.md`) wasn't split out; the store lives inside `libs/rag`.

## Tools (`libs/tools`)
- [x] `Tool` interface (`name`, `description`, `parameters` JSON schema, `execute()`) +
      `ToolRuntime` (register/list/execute, converts thrown errors into failed `ToolResult`s
      instead of crashing the caller).
- [x] Two real tools: `CalculatorTool` (arithmetic via a hand-written recursive-descent
      parser — no `eval`/`Function`, so no code-injection surface) and `CurrentTimeTool`.
- **Honest scope note:** none of the higher-value tools from `01-system-architecture.md`
  (Filesystem, Git, Docker, PostgreSQL, Azure DevOps, ...) exist yet — this is the runtime
  and pattern, with two safe example tools proving it end-to-end.

## Agent Runtime (`libs/agents`)
- [x] `AgentRuntime.run(model, goal)` — single-agent tool-calling loop: sends the goal +
      advertised tool definitions to the provider; if the model requests a tool call,
      executes it via `ToolRuntime` and feeds the result back as a `tool`-role message;
      repeats until the model returns a plain answer or `maxIterations` is hit
      (`AgentIterationLimitError`).
- [x] **Live-verified twice against real `qwen3:8b` tool-calling**: "(17 * 23) + 5" → the
      model called `calculator` with `"(17 * 23) + 5"` and correctly reported 396; "what
      time is it" → correctly called `current-time` and reported the real ISO timestamp.
- [x] `POST /agent` route in `apps/gateway`, same pattern as `/chat` (Zod validation,
      `fastify.agentRuntime` decorator, no business logic in the route).
- **Honest scope note:** single agent only — no multi-agent orchestration, no planner/
  specialized agents (`PlannerAgent`, `CodingAgent`, etc. from `01-system-architecture.md`),
  no persisted execution state/history (`05-agent-runtime-and-orchestration.md`'s
  `executionId`/state-tracking JSON isn't implemented). This is the execution loop, not the
  orchestrator.

## Observability
- [x] Fastify's built-in Pino logger was already structured (request id, method, url,
      status, response time) — confirmed via real request logs.
- [x] Added header redaction (`x-api-key`, `authorization`) so secrets never hit the logs.
- [x] Added a global error handler (`setErrorHandler`) — logs the full error server-side,
      but only ever returns a generic "Internal Server Error" to the client for 5xx (no
      stack traces leaked), verified by sending a malformed JSON body and inspecting both
      the HTTP response and the log line.
- **Honest scope note:** no tracing, no token-usage/cost tracking, no metrics endpoint —
  just logging and safe error responses.

## Auth
- [x] Simple API-key check (`GATEWAY_API_KEY` env var, `x-api-key` header) as a Fastify
      `onRequest` hook, skipping `/health`. If the env var is unset, the gateway logs a
      warning and allows all requests (dev-friendly default — confirmed in the smoke-test
      logs: `"GATEWAY_API_KEY is not set; all gateway requests are unauthenticated."`).
- **Honest scope note:** no RBAC, SSO, or OIDC (all listed as "Future" in
  `01-system-architecture.md` anyway) — single shared API key only.

## CLI (`apps/cli`)
- [x] Scaffolded as a real Nx app (it was previously just `.gitkeep`).
- [x] `ai chat <message> [--conversation <id>] [--model <name>]` and `ai models` — both
      **live-verified**: `models` printed the three real Ollama models; `chat "..."` got a
      real "pong" back.
- **Honest scope note:** each CLI invocation is a fresh process with its own
  `ConversationMemory`, so `--conversation` only gives continuity within a single shell
  session that reuses the same process — it does **not** persist across separate `ai chat`
  invocations. No `ai doctor` / `ai memory` / `ai index` commands yet (per
  `02-folder-structure.md`'s example list).

**Full verification:** `pnpm nx run-many -t typecheck,build,test,lint` passes clean across
all 10 projects (`ai-core`, `providers`, `shared`, `memory`, `chat`, `rag`, `tools`,
`agents`, `gateway`, `cli`).

---

# Open Questions For You

1. When you get an OpenAI API key, want me to run the live smoke test the same way I did
   for Ollama?
2. RAG isn't wired into `/chat` yet (no retrieval-augmented chat) — want that next, or
   prioritize something else (Memory persistence, more tools, multi-agent orchestration)?
3. `GATEWAY_API_KEY` is currently unset (auth disabled) — want me to set one in `.env` now
   that the auth check exists, or leave it open for local development?

---

End of Document
