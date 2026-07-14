# Frontend UI checklist

Give this to the CLI agent to check against the current codebase. For each item, report: Done / Partial / Missing, plus what's missing if not Done.

## 1. Login / Register
- [ ] `/login` page exists with email + password fields
- [ ] `/register` page exists with name + email + password fields
- [ ] Form submits to `POST /auth/login` / `POST /auth/signup`
- [ ] On success, JWT cookie is set and user redirected to bot list
- [ ] On failure, error message shown (wrong password, email already registered, etc.)
- [ ] Logged-out users are redirected to `/login` when visiting protected pages
- [ ] "Continue with Google" button present on both login and register pages
- [ ] Clicking it starts the Google OAuth flow, redirects to Google's consent screen
- [ ] On successful Google auth, a `users` row is created (if new) or matched (if existing) by Google account, JWT cookie set, redirected to bot list
- [ ] A user who signed up with Google can log back in with Google and lands in the same account (not a duplicate)
- [ ] A user who signed up with email/password can also link/use Google if it matches the same email (or is clearly kept separate — confirm which behavior was implemented)

## 2. Bot list + create form
- [ ] Page lists all bots belonging to the logged-in user (`GET /bots`)
- [ ] Each bot shows at least name, avatar, status
- [ ] "Create bot" button/form exists, submits to `POST /bots`
- [ ] New bot appears in the list after creation without a manual refresh
- [ ] Clicking a bot navigates to its setup/detail page

## 3. Bot Setup (name, avatar, color, welcome message)
- [ ] Form fields exist for: name, avatar (upload or picker), color (picker), welcome message (text)
- [ ] Changes save via `PUT /bots/:id`
- [ ] Saved values persist after page reload (confirms they're actually being read back from the DB, not just held in local state)
- [ ] Some visible confirmation on save (toast, saved indicator, etc.)

## 4. Knowledge base upload (drag-drop)
- [ ] Drag-and-drop file zone exists, not just a plain file input
- [ ] Accepts PDF, DOCX, TXT — rejects other types with a clear message
- [ ] Upload submits to `POST /bots/:id/documents`
- [ ] Shows upload/processing status (matches `documents.embedding_status`: pending/processing/ready/failed)
- [ ] Uploaded documents list on the page, each deletable (`DELETE /bots/:id/documents/:doc_id`)
- [ ] Deleting a document updates the list without a manual refresh

## 5. Chat History & Conversations
- [ ] Page lists conversations for a bot (`GET /bots/:id/conversations`)
- [ ] Each conversation shows session info, resolved/unresolved status
- [ ] Clicking a conversation shows its full message thread (user + bot messages, in order)
- [ ] Unresolved (fallback-triggered) conversations are visually distinguishable from resolved ones

## 6. Analytics (conversations, resolution rate)
- [ ] Page exists at a dedicated analytics route
- [ ] Chart showing conversations per day (`GET /bots/:id/analytics`)
- [ ] Resolution rate shown (resolved vs unresolved ratio)
- [ ] Chart renders with real data, not placeholder/mock data

## 7. Embed Code Page
- [ ] Page shows the actual embed script tag for the selected bot, using `bot_token` (not internal `bot_id`)
- [ ] "Copy snippet" button copies the exact script tag to clipboard
- [ ] Some visible confirmation on copy (toast, button state change, etc.)

## 8. Website Embed: Floating Chat Widget (pure JS, no framework)
- [ ] Widget is a single compiled JS file, no React/framework dependency
- [ ] Loads via `<script src="..." data-bot-token="...">` and renders inside an iframe
- [ ] Floating chat bubble UI, opens/closes on click
- [ ] Sends messages to `POST /chat/:bot_token/message`, no auth required
- [ ] Displays bot replies in the conversation thread
- [ ] On fallback (`NO_MATCH`), shows the lead capture form inline (name, email, message)
- [ ] Widget uses the bot's configured avatar/color/welcome message from setup, not hardcoded defaults
- [ ] Tested loading on an actual external page (not just localhost), via ngrok or similar

---

Report back per numbered section — which are Done, which are Partial (and what's missing specifically), which are entirely Missing.
