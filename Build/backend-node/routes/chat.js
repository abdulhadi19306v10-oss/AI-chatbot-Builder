// routes/chat.js — public chat endpoint + lead capture
// POST /chat/:bot_token/message — no auth, rate-limited at app level
const router = require('express').Router();

// GET /chat/:bot_token/config - public config for widget load
router.get('/:bot_token/config', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT name, avatar, color, welcome_msg FROM bots WHERE bot_token=$1 AND status != 'paused'",
      [req.params.bot_token]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Bot not active or not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});
const pool = require('../db');
const { geminiEmbedding, geminiChat } = require('../gemini');

// Tuned for gemini-embedding-2 which typically produces lower cosine similarities than all-MiniLM
const SIMILARITY_THRESHOLD = 0.30;
const TOP_K = 5;
const FALLBACK_MSG = "I don't have enough information to answer that. Please leave your details and we'll get back to you.";

async function localizedFallback(visitorMessage) {
  const prompt = `The following message is from a website visitor: "${visitorMessage}"
Reply with ONLY a short, friendly message (max 2 sentences) in the same language as that message, telling them you don't have enough information to answer their question and asking for their name and email so someone can follow up. Do not include any explanation, just the message itself.`;
  try {
    const localized = await geminiChat([{ role: 'user', content: prompt }]);
    return localized.trim();
  } catch (e) {
    console.error('[fallback localization]', e);
    return FALLBACK_MSG; // fall back to the English default if the localization call itself fails
  }
}

router.post('/:bot_token/message', async (req, res) => {
  const { session_id, message } = req.body;
  if (!session_id || !message) return res.status(400).json({ error: 'session_id and message required' });

  // Resolve bot by public token (never exposes internal UUID to callers)
  const { rows: botRows } = await pool.query(
    "SELECT id, welcome_msg FROM bots WHERE bot_token=$1 AND status != 'paused'",
    [req.params.bot_token]
  );
  if (!botRows[0]) return res.status(404).json({ error: 'Bot not found or not active' });
  const bot = botRows[0];

  // Upsert conversation by (bot_id, session_id)
  let conv;
  const { rows: convRows } = await pool.query(
    'SELECT id FROM conversations WHERE bot_id=$1 AND session_id=$2',
    [bot.id, session_id]
  );
  if (convRows[0]) {
    conv = convRows[0];
  } else {
    const { rows } = await pool.query(
      'INSERT INTO conversations (bot_id, session_id) VALUES ($1,$2) RETURNING id',
      [bot.id, session_id]
    );
    conv = rows[0];
  }

  // Save user message
  await pool.query(
    'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)',
    [conv.id, 'user', message]
  );

  try {
    // 1. Embed the user query
    const [queryEmbedding] = await geminiEmbedding([message]);
    const embeddingStr = JSON.stringify(queryEmbedding);

    // 2. Cosine similarity search: top-5 chunks above threshold
    // pgvector cosine_distance = 1 - cosine_similarity, so distance < (1 - threshold)
    const distanceThreshold = 1 - SIMILARITY_THRESHOLD;
    const { rows: chunks } = await pool.query(
      `SELECT content, 1 - (embedding <=> $1::vector) AS similarity
       FROM chunks
       WHERE bot_id = $2
         AND 1 - (embedding <=> $1::vector) > $3
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      [embeddingStr, bot.id, SIMILARITY_THRESHOLD, TOP_K]
    );

    // 3. Zero chunks above threshold → skip LLM, go straight to fallback
    if (chunks.length === 0) {
      const fallbackContent = await localizedFallback(message);
      await pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)',
        [conv.id, 'bot', fallbackContent]
      );
      await pool.query('UPDATE conversations SET resolved=false WHERE id=$1', [conv.id]);
      return res.json({ type: 'fallback', content: fallbackContent });
    }

    // 4. Build context and call LLM
    const context = chunks.map(c => c.content).join('\n\n');
    const systemPrompt = `You are a helpful assistant. Answer the user's question using ONLY the provided context below.
Always reply in the same language the visitor's question was asked in, regardless of what language the context is written in.
If the context does not contain the answer, reply with the exact string NO_MATCH and nothing else.
IMPORTANT: Do not mention the context in your reply. Just give a direct answer in a natural, complete sentence.

CONTEXT:
${context}`;

    const reply = await geminiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    // 5. Confidence check — exact string match
    if (reply.trim() === 'NO_MATCH') {
      const fallbackContent = await localizedFallback(message);
      await pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)',
        [conv.id, 'bot', fallbackContent]
      );
      return res.json({ type: 'fallback', content: fallbackContent });
    }

    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)',
      [conv.id, 'bot', reply]
    );
    await pool.query('UPDATE conversations SET resolved=true WHERE id=$1', [conv.id]);
    res.json({ type: 'answer', content: reply });

  } catch (e) {
    console.error('[chat]', e);
    res.status(500).json({ error: 'Server error during RAG pipeline' });
  }
});

// POST /chat/:bot_token/leads — lead capture from widget after fallback
router.post('/:bot_token/leads', async (req, res) => {
  const { session_id, name, email, message } = req.body;
  if (!session_id || !name || !email) return res.status(400).json({ error: 'session_id, name, email required' });

  const { rows: botRows } = await pool.query('SELECT id FROM bots WHERE bot_token=$1', [req.params.bot_token]);
  if (!botRows[0]) return res.status(404).json({ error: 'Bot not found' });
  const bot = botRows[0];

  const { rows: convRows } = await pool.query(
    'SELECT id FROM conversations WHERE bot_id=$1 AND session_id=$2',
    [bot.id, session_id]
  );
  const conv = convRows[0] || null;

  await pool.query(
    'INSERT INTO leads (bot_id, email, name, conversation_id, message) VALUES ($1,$2,$3,$4,$5)',
    [bot.id, email, name, conv?.id || null, message || null]
  );

  res.json({ status: 'captured' });
});

module.exports = router;
