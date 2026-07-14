# Tech stack — AI chatbot platform MVP

Constraints: Python team, 17-day timeline, no budget constraint.

## Backend
**FastAPI**
Python-native. Async support handles concurrent chat requests. Native OpenAI SDK compatibility. Fastest path for Python team in 17 days.

## Database
**PostgreSQL + pgvector extension**
Single database for relational data (users, bots, chats, leads) and vector embeddings. No separate vector DB to provision, secure, or sync in 17 days.

## LLM
**OpenAI GPT-4o**
Faster and cheaper than GPT-4, sufficient quality for FAQ/support use case. `text-embedding-3-small` for embeddings — low cost, fast, adequate accuracy for document retrieval.

## RAG orchestration
**Hand-rolled (no framework)**
Chunking, embedding, and pgvector similarity search written directly in FastAPI — roughly 100 lines. Dropped LangChain: its abstraction layers cost more debugging time than they save once the exact pipeline is known, and a coding CLI removes the time advantage a framework would have given.

## Background jobs
**FastAPI BackgroundTasks**
No Celery, no Redis, no separate worker process. Document processing and email sends run as background tasks within the same app. Removes infra setup time. Revisit only if job volume grows post-MVP.

## Frontend (dashboard)
**Next.js + TypeScript + Tailwind CSS**
Fastest React setup with built-in routing, SSR, and API routes. Tailwind removes CSS decision time.

## Embed widget
**Vanilla JavaScript, single compiled file**
No framework dependency. Loads on any client website via one `<script>` tag with zero conflict risk.

## Auth
**Self-built — email/password + JWT**
`passlib[bcrypt]` for password hashing, `python-jose` for JWT issuance/verification, both in FastAPI. Token stored in an httpOnly cookie, checked on protected routes via a `get_current_user` dependency. Dropped Clerk after deployment auth failures (env/JWKS/interop issues between Next.js middleware and FastAPI token verification) — self-built version removed the failure point entirely rather than debugging it, and took one day to implement. Tradeoff accepted: password reset, email verification, and OAuth (e.g. "Sign in with Google") are not included and would need to be built separately if needed later.

## File storage
**Local disk for now, Cloudflare R2 later**
Uploaded documents currently written to local filesystem under `uploads/{bot_id}/{document_id}-{filename}`. Accessed only through three functions (`upload_document`, `get_document`, `delete_document`) — rest of the app never touches the filesystem directly. R2 deferred until deployment; swapping the internals of those three functions to boto3/R2 calls at that point requires no changes elsewhere in the codebase.

## Email
**Resend**
Simple API, fast integration, reliable delivery for missed-chat notifications.

## Hosting
**Local (Docker) for now, Railway later**
Currently self-hosted: Postgres via Docker (`pgvector/pgvector:pg16` image), FastAPI and Next.js run locally. ngrok used only when testing the embed widget on a real external site. Railway remains the deploy target once 24/7 availability is needed — no architecture changes required to switch.

## Analytics
**Hand-rolled (Postgres events table)**
Events logged to a plain `events` table (`event_name`, `bot_id`, `metadata`, `created_at`), queried directly for the dashboard. Dropped PostHog: no separate vendor, no data leaving your DB, and the actual need for MVP is simple counts, not a full analytics platform.

## Realtime
**Server-Sent Events (SSE)**
Streams GPT-4o responses token-by-token to the widget. Simpler than WebSockets — one-directional stream is all a chatbot reply needs.

---

## Final stack

| Layer | Choice |
|---|---|
| Backend | FastAPI |
| Database | PostgreSQL + pgvector |
| LLM | OpenAI GPT-4o + text-embedding-3-small |
| RAG | LangChain |
| Jobs | FastAPI BackgroundTasks |
| Frontend | Next.js + TypeScript + Tailwind |
| Widget | Vanilla JS |
| Auth | Self-built (JWT) |
| Storage | Cloudflare R2 |
| Email | Resend |
| Hosting | Railway |
| Analytics | PostHog |
| Realtime | SSE |

Every choice removes setup time or infra decisions to fit the 17-day window. No component here requires provisioning beyond signing up for an account and adding an API key.
