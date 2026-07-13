# Aspedan AI Platform

# Implementation Roadmap & Task List

Version: 1.0

Status: Living document — update as tasks complete

Last updated: 2026-07-13

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

---

# 3. Next: Complete the Vertical Slice

Goal: a real chat request flows `Client → Gateway route → Application service →
ProviderFactory → Provider → model → response`, per the layering in
`01-system-architecture.md`.

- [ ] `ChatService` (Application layer) — orchestrates a chat request using the
      `AIProvider` returned by `ProviderFactory`; this is where request validation
      (Zod) and any future memory/RAG injection will hook in
- [ ] `POST /chat` route in `apps/gateway` (Presentation layer) — validates input,
      delegates to `ChatService`, streams or returns the response; no business logic
      in the route itself
- [ ] Wire `apps/gateway/src/main.ts` to load `.env` (`process.loadEnvFile()`, Node 22
      native) so `ProviderFactory.fromEnv()` picks up real config when the gateway runs
- [ ] End-to-end manual test: `curl` the running gateway and get a real model reply

---

# 4. Future Roadmap (per `00-product-specification.md` module list)

Rough dependency order — each builds on the vertical slice above:

- [ ] **Memory** — conversation history, short/long-term memory (needed before RAG and
      Agent Runtime are useful)
- [ ] **RAG** — chunking, embeddings (you already have `nomic-embed-text` loaded and
      reachable), vector store, retrieval, context injection
- [ ] **Agent Runtime** — orchestrator + agent lifecycle per
      `05-agent-runtime-and-orchestration.md`; depends on Memory + Tool Runtime existing
- [ ] **Tool Runtime** — sandboxed tool execution (filesystem, git, docker, Azure DevOps, ...)
- [ ] **Observability** — structured logging (Pino), tracing, token usage / cost tracking
- [ ] **Auth** — API keys / JWT for the Gateway
- [ ] **CLI** (`apps/cli`) — currently just a `.gitkeep`

---

# Open Questions For You

1. When you get an OpenAI API key, want me to run the live smoke test the same way I did
   for Ollama?
2. Priority for section 3 (vertical slice) vs jumping straight to Memory/RAG — my
   recommendation is still finishing the vertical slice first so every later module has a
   working request path to hang off of.

---

End of Document
