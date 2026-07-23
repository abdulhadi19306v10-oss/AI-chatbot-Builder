-- Migration: old schema → new schema
-- Re-runnable: uses IF EXISTS / IF NOT EXISTS throughout
-- Run against your Postgres instance before starting the Node backend.

-- ─── 0. Extensions ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. Drop old tables (only the ones being replaced) ───────────────────────
-- Reverse FK order to avoid constraint errors.
DROP TABLE IF EXISTS events        CASCADE;
DROP TABLE IF EXISTS usage_daily   CASCADE;
DROP TABLE IF EXISTS leads         CASCADE;  -- will be recreated below
DROP TABLE IF EXISTS messages      CASCADE;  -- will be recreated below
DROP TABLE IF EXISTS conversations CASCADE;  -- will be recreated below
DROP TABLE IF EXISTS chunks        CASCADE;  -- will be recreated below
DROP TABLE IF EXISTS documents     CASCADE;  -- will be recreated below
DROP TABLE IF EXISTS visitors      CASCADE;
DROP TABLE IF EXISTS bots          CASCADE;  -- will be recreated below
DROP TABLE IF EXISTS businesses    CASCADE;
DROP TABLE IF EXISTS plans         CASCADE;

-- ─── 2. New tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  onboarding_completed_at TIMESTAMPTZ NULL,
  onboarding_step       INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar      TEXT,
  color       TEXT DEFAULT '#6366f1',
  welcome_msg TEXT DEFAULT 'Hi! How can I help you today?',
  status      TEXT NOT NULL DEFAULT 'training', -- 'training' | 'active' | 'paused'
  bot_token   TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id           UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  filename         TEXT NOT NULL,
  content          TEXT,                       -- raw extracted text, stored for re-processing
  embedding_status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'processing'|'ready'|'failed'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ponytail: text-embedding-004 outputs 768 dims
CREATE TABLE IF NOT EXISTS chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  bot_id        UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  embedding     vector(768) NOT NULL,
  chunk_index   INT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id     UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,                  -- client-generated, no persistent visitor row
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,             -- 'user' | 'bot'
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id          UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bots_user        ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_bot         ON documents(bot_id);
CREATE INDEX IF NOT EXISTS idx_chunks_bot       ON chunks(bot_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc       ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_convos_bot       ON conversations(bot_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv    ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_bot        ON leads(bot_id);
-- IVFFlat index for cosine similarity on chunk embeddings
-- Build after data is loaded; lists=100 is fine for small corpora.
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Onboarding migrations for existing users
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;

-- ponytail: Ensure existing leads table gets the message column and updated constraint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_conversation_id_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

