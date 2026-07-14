# System logic — detailed spec

## 1. Data model

```
businesses
  id, name, email, plan_id, cancelled_at, created_at

plans
  id, name, max_bots, daily_message_limit, price

bots
  id, business_id, name, personality_prompt, language_mode
  ('auto' | 'fixed:<lang_code>'), widget_config (jsonb), status
  ('training' | 'active' | 'paused'), created_at

documents
  id, bot_id, filename, file_type ('pdf'|'docx'|'txt'),
  file_size, storage_path, status ('pending'|'processing'|
  'ready'|'failed'), error_message, uploaded_at

chunks
  id, document_id, bot_id, content, embedding (vector),
  token_count, chunk_index

visitors
  id, bot_id, fingerprint_hash, first_seen, last_seen

conversations
  id, bot_id, visitor_id, started_at, ended_at, was_fallback

messages
  id, conversation_id, role ('visitor'|'bot'), content,
  confidence_score, retrieved_chunk_ids, created_at

leads
  id, bot_id, conversation_id, name, email, phone, message,
  captured_at

usage_daily
  id, bot_id, visitor_id, date, message_count
```

## 2. Document training pipeline

Implemented directly in FastAPI, no orchestration framework — each step below is a plain Python function called in sequence.

Trigger: file upload completes → status set `pending` → background task queued.

Steps, in order:
1. Validate file type (pdf/docx/txt). Reject others immediately, set `failed`.
2. Extract raw text (PyPDF2 for PDF, python-docx for DOCX, direct read for TXT).
3. Clean text: strip repeated whitespace, page headers/footers (PDF only), null bytes.
4. Chunk text: 500 tokens per chunk, 50 token overlap between consecutive chunks. Overlap prevents context loss at chunk boundaries.
5. Generate embedding per chunk via `text-embedding-3-small`. Batch requests, max 100 chunks per API call.
6. Insert chunks into `chunks` table with `document_id`, `bot_id`, embedding vector.
7. Set document `status = ready`. On any step failure, set `status = failed`, store `error_message`, do not partially insert chunks (wrap steps 4-6 in a transaction).
8. Bot only queries chunks where parent document `status = ready`.

Re-training on document delete: delete all `chunks` rows where `document_id` matches. No orphaned vectors.

## 3. Widget runtime — session logic

On widget script load:
1. Read `bot_id` from script tag data attribute.
2. Generate or read `visitor_fingerprint` from browser localStorage (client-side widget only, not the dashboard app — separate constraint from admin panel's no-localStorage rule since this runs on third-party sites).
3. Call `POST /widget/session` with `bot_id` + fingerprint. Backend creates or fetches `visitors` row, returns `visitor_id` + bot's `widget_config` (colors, welcome message, flow steps).
4. Widget renders using returned config.

## 4. Message flow — RAG + confidence logic

On visitor sends message:
1. `POST /widget/message` with `bot_id`, `visitor_id`, `conversation_id` (null if new), message text.
2. Rate limit check first: query `usage_daily` for `(bot_id, visitor_id, today)`. Compare `message_count` against bot's plan `daily_message_limit`. If exceeded, return static rate-limit message, do not call OpenAI. Increment happens only after a successful reply (step 8).
3. If `conversation_id` null, create new `conversations` row.
4. Embed the visitor's message via `text-embedding-3-small`.
5. Vector search: pgvector cosine similarity against `chunks` where `bot_id` matches. Return top 5 chunks, threshold `similarity > 0.75`. Chunks below threshold excluded from results, not just deprioritized.
6. If zero chunks pass threshold → skip GPT-4o call entirely, go straight to fallback (step 9). Saves an LLM call when there is clearly no relevant material.
7. If chunks found: construct GPT-4o call —
   - System message: bot's `personality_prompt` + fixed instruction block: "Answer only using the provided context. If the context does not contain the answer, respond exactly with NO_MATCH."
   - Context: concatenated chunk contents, each tagged with source.
   - User message: visitor's question.
   - Language: if `language_mode = auto`, detect visitor's message language, instruct GPT-4o to reply in that language. If `fixed`, instruct GPT-4o to always reply in the configured language regardless of visitor's input language.
8. Parse GPT-4o response. If response text equals `NO_MATCH` → treat as low confidence, go to fallback (step 9). Otherwise: `confidence_score = 1`, save message, increment `usage_daily.message_count`, return reply to visitor.
9. Fallback: save message with `confidence_score = 0`, `was_fallback = true` on conversation, return static fallback message + trigger lead form display in widget UI. Do not increment `usage_daily` (rate limit only counts successful answers — fallbacks don't consume message quota, since visitor didn't get value).

Confidence is binary (`NO_MATCH` flag), not a numeric threshold from GPT-4o itself — GPT-4o does not reliably self-report calibrated confidence scores, so the design forces a deterministic signal (exact string match) instead of trusting a probability the model can't reliably produce.

## 5. Lead capture logic

Triggered only on fallback (step 9 above), never on confident answers — keeps the form from interrupting a working conversation.
1. Widget shows inline form: name, email, phone (optional), pre-filled message field with visitor's original unanswered question.
2. On submit: `POST /widget/lead` → insert `leads` row linked to `conversation_id`.
3. Background task fires: send email via Resend to business's registered email. Subject: bot name + "missed a question". Body: visitor's question + lead contact info + link to dashboard conversation view.
4. Widget shows confirmation message, conversation marked `ended_at = now()`.

## 6. Analytics events (internal `events` table)

`events` table: `id`, `event_name`, `bot_id`, `metadata` (jsonb), `created_at`. Written on the same DB connection as the request — no external call, no separate vendor.

Events logged:
- `bot_created`, `document_uploaded`, `document_training_failed`
- `conversation_started`, `message_sent` (metadata: `confidence_score`, `was_fallback`)
- `lead_captured`
- `plan_limit_warning_shown` (business-side, dashboard)
- `rate_limit_hit` (bot-side, per visitor)

Dashboard analytics views are plain SQL aggregates over this table (counts, group by day/bot), no separate query language or vendor dashboard needed.

## 7. Plan limit enforcement — soft warning logic

Checked on two triggers:
- Bot creation: if `business.bot_count >= plan.max_bots`, allow creation, set flag `over_limit = true` on business, trigger dashboard banner + one-time email.
- Daily cron: recompute `over_limit` flags for all businesses (covers cases like a plan downgrade). No blocking logic anywhere in the message or bot-creation path — `over_limit` is read-only, informational.

## 8. Data retention job

Daily scheduled task:
1. Query `businesses` where `cancelled_at IS NOT NULL AND cancelled_at < now() - interval '30 days'`.
2. For each: delete `leads`, `messages`, `conversations`, `chunks`, `documents`, `bots` scoped to that `business_id`, then delete the `businesses` row itself.
3. Deletion order respects foreign keys — children before parents.
4. Log deletion count for audit trail before purge (business name/id + timestamp only, not the deleted content).

## 9. Multi-tenancy enforcement

Every query at the data layer filters by `business_id` (via `bot_id` join where the table doesn't carry `business_id` directly). Enforced at the ORM/query-builder level with a mandatory scope, not left to per-endpoint discipline — every repository function takes `business_id` as a required first argument, making an unscoped query a compile-time/type error rather than a runtime bug.

## 10. Widget embed script logic

Script tag: `<script src="https://cdn.yourapp.com/widget.js" data-bot-id="xyz"></script>`
1. Script creates an `iframe`, loads widget UI inside it — isolates widget CSS/JS from host page's styles/scripts.
2. `postMessage` bridges communication between iframe and parent page only for resize events (widget height changes with conversation length).
3. Widget calls backend API directly from inside the iframe — no dependency on host page's network stack.
