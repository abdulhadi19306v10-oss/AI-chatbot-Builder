# AI Chatbot Builder

A modern, fast, and feature-rich AI Chatbot Builder that allows you to upload documents and train a custom AI assistant, ready to be embedded into any website via an iframe widget.

## 🚀 Tech Stack
- **Frontend**: Next.js 16 (App Router), React, Vanilla CSS, NextAuth (Google OAuth)
- **Backend**: Node.js, Express, pg
- **Database**: PostgreSQL with `pgvector` for similarity search
- **AI/Embeddings**: Gemini API for both embeddings and conversational generation

## 📂 Project Structure
- `Build/frontend/`: Next.js web application
- `Build/backend-node/`: Express backend and document processing pipeline
- `run.py`: Convenient startup script to boot the backend, frontend, and database container simultaneously.

## 📋 Prerequisites
- Node.js 18+
- Python 3.11+ (for run.py)

## 🛠️ Getting Started

### 1. Install Dependencies
**Frontend:**
```bash
cd Build/frontend
npm install
```

**Backend:**
```bash
cd Build/backend-node
npm install
```

### 2. Environment Variables
Create a `.env.local` file inside `Build/frontend` (and `.env` in the root) with the following variables:
```env
# Gemini API Key for AI generation
GEMINI_API_KEY="your_gemini_key"

# Google Auth (NextAuth)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
NEXTAUTH_SECRET="any_random_string"
NEXTAUTH_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://neondb_owner:npg_7jRxChIm8WBL@ep-twilight-surf-azli3hmh.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

### 4. Run the Application
From the root folder, run one of the startup scripts depending on how you want to test:

**Localhost only (Default):**
```bash
python run.py
```
This script will start the db, Node.js backend on `8000`, and Next.js frontend on `3000`. Access at `http://localhost:3000`.

## 🌐 Embedding the Bot
Once you have trained your bot by uploading documents via the Dashboard, you can embed it into any HTML website using the provided script tag. (Manage your bot in the dashboard to copy the specific widget script).
