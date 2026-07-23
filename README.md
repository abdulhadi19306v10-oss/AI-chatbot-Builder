# 🤖 Custom RAG AI Chatbot Builder Platform

🔗 **Live Application**: [ai-chatbot-builder-ten.vercel.app](https://ai-chatbot-builder-ten.vercel.app/)

A production-ready, multi-tenant software platform that enables businesses to build, train, and deploy custom AI assistants onto their websites via a simple embedded widget script. The platform handles the entire Retrieval-Augmented Generation (RAG) pipeline, from document parsing and custom tokenized chunking to vector search and AI response generation.

---

## 🏗️ Architecture & RAG Pipeline

The platform uses a modular, decoupled architecture with a React-based Next.js frontend, an Express Node.js backend, and a PostgreSQL database extending the `pgvector` capabilities for low-latency vector similarity operations.

```mermaid
graph TD
    %% Styling
    classDef primary fill:#1FA391,stroke:#167A6D,stroke-width:2px,color:#fff;
    classDef secondary fill:#2d3748,stroke:#1a202c,stroke-width:2px,color:#fff;
    classDef db fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#fff;
    classDef ai fill:#b794f4,stroke:#805ad5,stroke-width:2px,color:#fff;

    User([User Widget]) --->|1. Message| Backend[Express Backend]:::primary
    Backend --->|2. Embed Query| GeminiEmbed[Gemini Embedding API]:::ai
    GeminiEmbed --->|3. 768-dim Vector| Backend
    Backend --->|4. Cosine Distance Search| DB[(Postgres + pgvector)]:::db
    DB --->|5. Top-K Context Chunks| Backend
    Backend --->|6. RAG Prompt Context| GeminiChat[Gemini 3.5 Flash]:::ai
    GeminiChat --->|7. Contextual Reply| Backend
    Backend --->|8. JSON Response| User

    %% Sub-pipelines
    Admin([Admin Portal]) --->|Upload PDF/DOCX/TXT| Backend
    Backend --->|Asynchronous Processing| Ingest[Ingestion Pipeline]:::primary
    Ingest --->|GPT-4 Tiktoken Tokenizer| Chunking[Chunking & Overlap]:::primary
    Chunking --->|Vector Embedding| GeminiEmbed
    Chunking --->|Save Chunks & Vectors| DB
```

---

## 🌟 Core Features

### 1. Advanced Ingestion & Tokenized Chunking
* **Multi-Format Parsing**: Extracts text dynamically from uploaded `PDF`, `DOCX`, and `TXT` files in-memory using `pdf-parse` and `mammoth` (avoiding local storage clutter).
* **Tiktoken In-House Tokenization**: Uses standard `cl100k_base` (GPT-4 compatible) tokenizer dynamically on the client server to split documents into precise chunks of `500 tokens` with a `50 token overlap` for semantic continuity.

### 2. High-Performance RAG Pipeline
* **Gemini Embedding Vectors**: Generates 768-dimensional vector representations of text chunks using `gemini-embedding-2` / `text-embedding-004`.
* **Fast Vector Similarity Search**: Stores embeddings in a PostgreSQL table via `pgvector`. Employs Cosine Distance operator (`<=>`) supported by an `IVFFlat` index (`lists = 100`) for near-instant retrieval.
* **Smart Fallback System**: Implements a confidence check. If cosine similarity drops below `0.30`, or the LLM returns a `NO_MATCH` signal, the widget triggers a custom fallback message and displays a **lead generation capture form** automatically.

### 3. Embeddable Web Widget
* **Seamless Script Embed**: Clients copy a single snippet `<script src=".../widget/widget.js" data-bot-token="..."></script>` to mount the bot inside any HTML page.
* **Isolated IFrame Sandboxing**: The widget runs inside an isolated iframe, ensuring client website styles or scripts never collide with the chat interface.

### 4. Admin Management Dashboard
* **Dynamic Configuration**: Customize bot appearance, welcome messages, widget colors, status (`active`/`paused`), and custom avatars.
* **Analytics Panel**: Live visualization of metrics including Total Conversations, Resolved Queries, Bot Messages Sent, and Total Leads Captured.
* **Conversations Inspector**: Inspect past session logs and messages history to identify knowledge gaps.

### 5. Premium UI/UX Design
* **Polished Aesthetics**: Sleek modern layout supporting smooth Dark and Light modes using CSS variables and Tailwind.
* **Micro-Animations**: Animated state toggles and transitions powered by `gsap` (GreenSock) and `animejs`.
* **Interactive Onboarding Tour**: Integrated onboarding guide powered by `react-joyride` to seamlessly walk new users through the setup.

### 6. Automated Garbage Collection
* **Stuck Reaper Pruning:** Hourly job to identify and clean up stuck database training processes or ingestions.
* **Retention Cleanup:** Daily job that prunes conversations older than a configured number of days (safeguarded against negative numbers and invalid integers via environment configuration `CONVERSATION_RETENTION_DAYS`).

### 7. Secure Password Reset Flow
* **Token Hashing:** Uses `crypto` SHA-256 to hash reset tokens before storing them in the database to prevent database leakage exploits.
* **Atomic Transaction Safety:** Checks out a dedicated database connection client to run the reset updates atomically, claiming the token in the first query to avoid concurrent double-use replays.
* **Double Validation:** Strict minimum 8-character password length checks enforced both client-side and server-side.
* **API Rate Limiting:** Endpoint rate limiting (max 5 requests/hour per IP) to prevent spam.

### 8. Multilingual RAG & Fallbacks
* **Cross-Language Query Matching:** The RAG system instructs Gemini to answer in the visitor's query language, even if the database knowledge context is written in English or another language.
* **Dynamic Localized Fallbacks:** On match failure (zero chunks or LLM `NO_MATCH`), the bot generates a dynamic, context-aware fallback message in the user's language using Gemini, prompting for contact details.

---

## 🛠️ Technology Stack

### Frontend (Admin & Portal)
* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript
* **Animations**: GSAP, AnimeJS
* **Onboarding**: React Joyride
* **Authentication**: NextAuth (Credentials and Google OAuth Providers) using custom standard signed JWTs

### Backend (Node API Server)
* **Framework**: Node.js & Express
* **Ingestion Engines**: Multer, PDF-Parse, Mammoth
* **Tokenizer**: `js-tiktoken`
* **SDK Client**: OpenAI SDK (pointed at Gemini Beta endpoints)
* **Database Driver**: `pg` (node-postgres)

### Database & Vector Storage
* **DB Instance**: PostgreSQL (with `pgvector` and `uuid-ossp` extensions)
* **Index**: Cosine distance similarity operator index

---

## 📋 Environment Configuration

Create a `.env` in the root folder, and a `.env.local` inside `Build/frontend/`:

```env
# Gemini API Keys
GEMINI_API_KEY="your_gemini_api_key"

# Database Connection (Postgres Vector DB URL)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth Config (Frontend)
NEXTAUTH_SECRET="your_long_random_jwt_secret"
NEXTAUTH_URL="http://localhost:3000"

# Google Auth Credentials (for OAuth Login)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Backend Target URL
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

---

## 🚀 Local Installation & Setup

### 1. Install Dependencies
```bash
# Frontend setup
cd Build/frontend
npm install

# Backend setup
cd ../backend-node
npm install
```

### 2. Run Database Migrations
Deploy the database schema, including the PostgreSQL `vector` extension and table creation:
```bash
cd ../backend-node
npm run migrate
```

### 3. Startup the Services
Use the root runner helper script to start the local services:
```bash
cd ../..
python run.py
```
This boots the database container, spins up the Node API backend on `http://localhost:8000`, and starts the Next.js admin dashboard on `http://localhost:3000`.

---

## 🧪 Automated Testing

Run the backend validation test suites to verify system functionality and safety guards:

```bash
cd Build/backend-node

# 1. Password Reset Integration Tests
# Requires setting database connection, APP_ENV=test, and the explicit override opt-in
$env:DATABASE_URL="postgresql://neondb_owner:npg_7jRxChIm8WBL@ep-twilight-surf-azli3hmh.c-3.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require"
$env:I_AM_SURE_I_WANT_TO_RUN_THIS_TEST="true"
$env:APP_ENV="test"
node test-password-reset.js

# 2. Multilingual RAG & Localized Fallback Tests
# Runs Spanish matching queries, cross-lingual context generation, and localized fallbacks
$env:DATABASE_URL="postgresql://neondb_owner:npg_7jRxChIm8WBL@ep-twilight-surf-azli3hmh.c-3.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require"
$env:I_AM_SURE_I_WANT_TO_RUN_THIS_TEST="true"
$env:APP_ENV="test"
node test-multilingual.js
```
