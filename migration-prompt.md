# Migration prompt — backend rewrite (Python/FastAPI → Node.js/Express) + schema simplification

Paste this into the CLI coding agent. This is a migration on an existing, tested project — not a fresh build. Do not touch the frontend or widget code.

---

## Context

The current project has a working, tested FastAPI (Python) backend and a PostgreSQL + pgvector database. The RAG pipeline, auth flow, and chat logic have already been validated against real test documents and known-good answers. This is a migration, not a rewrite from scratch — the goal is to reproduce the same validated behavior in a different language, not redesign it.

## What stays untouched — do not modify

- `frontend/` — Next.js dashboard, already JavaScript/TypeScript, has no dependency on backend language
- `widget/` — vanilla JS embed widget, already framework-free
- Do not change any UI, routing, or client-side logic in either of the above

## What changes

### 1. Backend language: Python/FastAPI → Node.js/Express

This is a full rewrite of the `backend/` directory, not a line-by-line translation. Re-implement the same logic idiomatically in Node — do not attempt to mechanically port Python syntax to JavaScript.

Stack for the new backend:
- Node.js + Express
- `pg` or `node-postgres` for database access (or an ORM if preferred — keep it simple given the schema size)
- `bcrypt` for password hashing
- `jsonwebtoken` for JWT issuance/verification
- `pdf-parse` for PDF text extraction, `mammoth` for DOCX
- Google Gemini SDK or the OpenAI Node SDK pointed at Gemini's OpenAI-compatible endpoint (`base_url: https://generativelanguage.googleapis.com/v1beta/openai/`) — `gemini-2.5-flash` for chat, `text-embedding-004` for embeddings

### 2. Schema: simplify to the new table set

Old schema (drop these tables, migrate any data worth keeping into the new structure first if this is a real dataset, not just test data):
```
plans, businesses, visitors, usage_daily, events
```

New schema:
```sql
users (id, name, email, password_hash, created_at)
bots (id, user_id, name, avatar, color, welcome_msg, status, bot_token, created_at)
documents (id, bot_id, filename, content, embedding_status, created_at)
chunks (id, document_id, bot_id, content, embedding vector, chunk_index)
conversations (id, bot_id, session_id, started_at, resolved boolean)
messages (id, conversation_id, role, content, created_at)
leads (id, bot_id, email, name, conversation_id, created_at)
```

Notes on the change:
- `businesses` → `users`, same role, renamed and simplified (no `plan_id`/`cancelled_at`)
- `bots` gains `avatar`, `color`, `welcome_msg`, `bot_token` (public identifier, separate from internal `id` — used in the public chat URL so the real primary key never appears client-side)
- `documents` drops `file_type`/`file_size`/`storage_path` fields that aren't essential, keeps `embedding_status`
- `chunks` is kept even though not on the originating spec sheet — required for the RAG retrieval step to function at all, treat as necessary infrastructure
- `visitors` is dropped — sessions now tracked by an in-memory client-generated `session_id`, no persistent visitor identity across visits
- `usage_daily`/`plans` dropped — no rate limiting or plan enforcement in this schema. Add a basic `express-rate-limit` on the public chat endpoint regardless, since it has no auth and no cap otherwise
- `events` dropped — analytics now computed via direct SQL aggregates over `conversations`/`messages`, no event log

Write this as a proper migration (not a manual schema edit) so it's re-runnable and reversible.

## What logic to preserve exactly — already validated, do not change these values

- Chunk size: 500 tokens, 50 token overlap
- Similarity threshold: cosine similarity > 0.75, top 5 chunks
- Zero chunks above threshold → skip the LLM call entirely, go straight to fallback
- Confidence check: system prompt instructs the model to reply with the exact string `NO_MATCH` if the context doesn't contain the answer; response equal to `NO_MATCH` triggers fallback, anything else is treated as a real answer
- Fallback behavior: static message + lead capture form triggered in the widget, never a hard error
- Multi-tenancy: every query scoped by `user_id` (directly or via `bot_id` join) — enforce as a required parameter on every data-access function, not left to per-route discipline

## Endpoints to implement

```
POST   /auth/signup
POST   /auth/login
GET    /bots
POST   /bots
PUT    /bots/:id
DELETE /bots/:id
POST   /bots/:id/documents
DELETE /bots/:id/documents/:doc_id
POST   /chat/:bot_token/message      (public, no auth)
GET    /bots/:id/conversations
GET    /bots/:id/analytics
GET    /bots/:id/embed-snippet
```

## Verification — manual, not automated by the agent

Testing will be done manually, not by the coding agent. The agent should stop and flag once the public chat endpoint (`POST /chat/:bot_token/message`) is working end to end with a test bot and at least one uploaded document — do not have the agent run its own test questions or self-declare correctness. Once flagged, testing will be done by hand using the same documents and questions validated on the old backend:
- LA County Customer Service Guide, IRS New Hire FAQ PDF
- Known-answer questions (e.g. "How many rings should I answer the phone within?" → within three rings)
- Known-fallback questions (e.g. "What's your refund policy?" → should trigger `NO_MATCH` and the lead form)

Do not proceed to auth/dashboard endpoints until this manual checkpoint is confirmed.

## Instructions to the agent

Start with the schema migration and confirm it runs cleanly against a fresh Postgres instance before writing any route logic. Then rebuild the endpoints in the order listed above. Reference the old FastAPI code only to understand what each endpoint needs to do — do not attempt to auto-translate it. Once the public chat endpoint is working with a test bot and at least one uploaded document, stop and report that it's ready for manual testing — do not run test questions yourself or claim it's verified.
