# Aspedan AI Platform

# Running & Usage Guide

Version: 1.0

Status: Living document

Last updated: 2026-07-13

---

# Purpose

This document explains how to build, run, and actually use the platform (Gateway API and
CLI) day to day. For what's implemented vs. still stubbed, see
`docs/06-implementation-roadmap.md`.

---

# 1. Prerequisites

- Node.js 22 LTS
- pnpm (`pnpm --version` to confirm it's installed)
- A reachable Ollama server (or an OpenAI API key) — see `.env` setup below

---

# 2. One-time setup

```sh
pnpm install
cp .env.example .env
```

Edit `.env`:

```sh
AI_PROVIDER=ollama                      # or "openai"

OLLAMA_BASE_URL=http://<your-ollama-host>:11434
OLLAMA_DEFAULT_MODEL=qwen3:8b           # must support tool calling for /agent to work

# Only needed if AI_PROVIDER=openai (or you want it as a fallback)
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Optional
RAG_EMBEDDING_MODEL=nomic-embed-text:latest   # defaults to this if unset
GATEWAY_API_KEY=                              # leave empty during local dev
HOST=localhost
PORT=3000
```

`.env` is gitignored — never commit it. `.env.example` is the template that's safe to
commit (no real hostnames/keys).

---

# 3. Building

```sh
pnpm nx run-many -t build --projects=gateway,cli
```

Or build everything (all 10 projects, including verification):

```sh
pnpm nx run-many -t typecheck,build,test,lint
```

---

# 4. Running the Gateway

```sh
node dist/gateway/main.js
```

You should see:

```
[ ready ] http://localhost:3000
```

For active development (rebuild on change), use Nx's serve target instead of running the
built output directly:

```sh
pnpm nx serve gateway
```

**A gateway instance is running right now** at `http://localhost:3000` (started for you
in this session) — you can try the examples below immediately.

## Stopping it

Find and stop the Node process, e.g. on Windows:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'dist\\gateway\\main\.js' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

---

# 5. Gateway API Reference

All endpoints accept/return JSON. If `GATEWAY_API_KEY` is set in `.env`, every request
except `/health` must include header `x-api-key: <your key>`.

## `GET /health`

```sh
curl http://localhost:3000/health
```

```json
{ "status": "ok", "version": "0.1" }
```

## `POST /chat` — send a chat message

```sh
curl -X POST http://localhost:3000/chat \
  -H "content-type: application/json" \
  -d '{
    "conversationId": "my-session-1",
    "message": "Hello, who are you?"
  }'
```

Fields:
- `conversationId` (required) — any string; reuse it to keep conversation history across
  calls (in-memory only — lost on gateway restart)
- `message` (required)
- `model` (optional) — defaults to `OLLAMA_DEFAULT_MODEL` / provider default
- `ragEnabled` (optional, default `false`) — see below

Response:
```json
{ "conversationId": "my-session-1", "reply": "..." }
```

## `POST /rag/index` — index a document for retrieval

```sh
curl -X POST http://localhost:3000/rag/index \
  -H "content-type: application/json" \
  -d '{
    "documentId": "my-doc-1",
    "text": "Put any text here — a paragraph, a README, a policy doc, etc.",
    "metadata": { "source": "example" }
  }'
```

Response: `{ "documentId": "my-doc-1", "chunkCount": 1 }`

The index is **in-memory** — it resets when the gateway restarts, and it's shared across
all conversations (not scoped per-document-set yet).

## `POST /chat` with RAG — retrieval-augmented answers

Once you've indexed something, ask about it with `ragEnabled: true`:

```sh
curl -X POST http://localhost:3000/chat \
  -H "content-type: application/json" \
  -d '{
    "conversationId": "rag-session-1",
    "message": "What does my indexed document say about X?",
    "ragEnabled": true
  }'
```

Without `ragEnabled: true`, the model only sees the conversation — no retrieval happens,
even if documents are indexed.

## `POST /agent` — goal + tool-calling agent

```sh
curl -X POST http://localhost:3000/agent \
  -H "content-type: application/json" \
  -d '{
    "goal": "What is (17 * 23) + 5? Use the calculator tool and give me just the number."
  }'
```

Response includes both the final answer and every tool call the agent made along the way:
```json
{
  "finalMessage": "396",
  "steps": [
    { "toolName": "calculator", "input": { "expression": "(17 * 23) + 5" }, "output": { "success": true, "output": 396 } }
  ]
}
```

Tools currently available to the agent: `calculator`, `current-time`. The model you
configure must support tool calling (Ollama's `qwen3:8b` does; check `qwen3:8b`'s
`capabilities` via `GET /api/tags` on your Ollama server if using a different model).

---

# 6. Using the CLI

```sh
node dist/cli/main.js models
node dist/cli/main.js chat "Reply with exactly the word: pong"
node dist/cli/main.js chat "What's 2+2?" --model qwen3:8b --conversation my-cli-session
```

**Note:** each CLI invocation is a fresh process — `--conversation` only gives continuity
if you're somehow reusing the same process; separate `node dist/cli/main.js chat ...` calls
do **not** share history. There's no `ai` shell alias set up yet — invoke via
`node dist/cli/main.js <command>`.

---

# 7. Environment Variables Reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `AI_PROVIDER` | no | `ollama` | `ollama` or `openai` |
| `OLLAMA_BASE_URL` | if using ollama | `http://localhost:11434` | Ollama server address |
| `OLLAMA_DEFAULT_MODEL` | no | `qwen3:8b` | default chat model |
| `OPENAI_API_KEY` | if using openai | — | OpenAI (or compatible) API key |
| `OPENAI_BASE_URL` | no | `https://api.openai.com/v1` | override for OpenAI-compatible servers (vLLM, etc.) |
| `OPENAI_DEFAULT_MODEL` | no | `gpt-4o-mini` | default OpenAI model |
| `RAG_EMBEDDING_MODEL` | no | `nomic-embed-text:latest` | embedding model for `/rag/index` and `ragEnabled` chat |
| `GATEWAY_API_KEY` | no | unset (auth disabled) | if set, required as `x-api-key` header on every route except `/health` |
| `HOST` | no | `localhost` | gateway bind host |
| `PORT` | no | `3000` | gateway port |

---

# 8. Known Limitations (see `06-implementation-roadmap.md` for full detail)

- Conversation memory, tool runtime, and the RAG vector store are all **in-memory only** —
  everything resets on gateway restart. No PostgreSQL/Redis/Mongo backing yet.
- Agent Runtime is single-agent only — no multi-agent orchestration.
- Auth is a single shared API key — no RBAC/SSO/OIDC.
- Only two tools exist (`calculator`, `current-time`) — no filesystem/git/docker/Azure
  DevOps tools yet.

---

End of Document
