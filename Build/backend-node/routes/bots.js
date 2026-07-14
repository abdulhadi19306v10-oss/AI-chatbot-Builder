// routes/bots.js — CRUD for bots + document upload/delete
const router = require('express').Router();
const multer = require('multer');
const pool = require('../db');
const { requireAuth } = require('../auth');
const { processDocument } = require('../ingest');

// ponytail: memory storage — no disk write needed since we process in-memory then store text in DB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Verify bot belongs to the authenticated user. Attaches bot to req.bot.
async function ownBot(req, res, next) {
  const { rows } = await pool.query(
    'SELECT * FROM bots WHERE id=$1 AND user_id=$2',
    [req.params.id, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Bot not found' });
  req.bot = rows[0];
  next();
}

// GET /bots
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, avatar, color, welcome_msg, status, bot_token, created_at FROM bots WHERE user_id=$1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(rows);
});

// POST /bots
router.post('/', requireAuth, async (req, res) => {
  const { name, avatar, color, welcome_msg } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO bots (user_id, name, avatar, color, welcome_msg) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, name, avatar || null, color || '#6366f1', welcome_msg || 'Hi! How can I help you today?']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /bots/:id
router.put('/:id', requireAuth, ownBot, async (req, res) => {
  const { name, avatar, color, welcome_msg, status } = req.body;
  const { rows } = await pool.query(
    `UPDATE bots SET
       name        = COALESCE($1, name),
       avatar      = COALESCE($2, avatar),
       color       = COALESCE($3, color),
       welcome_msg = COALESCE($4, welcome_msg),
       status      = COALESCE($5, status)
     WHERE id=$6 AND user_id=$7 RETURNING *`,
    [name, avatar, color, welcome_msg, status, req.params.id, req.userId]
  );
  res.json(rows[0]);
});

// DELETE /bots/:id
router.delete('/:id', requireAuth, ownBot, async (req, res) => {
  await pool.query('DELETE FROM bots WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
  res.json({ status: 'deleted' });
});

// POST /bots/:id/documents
router.post('/:id/documents', requireAuth, ownBot, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['pdf', 'docx', 'txt'].includes(ext)) return res.status(400).json({ error: 'Only pdf, docx, txt supported' });

  try {
    const { rows } = await pool.query(
      "INSERT INTO documents (bot_id, filename) VALUES ($1,$2) RETURNING *",
      [req.bot.id, req.file.originalname]
    );
    const doc = rows[0];

    // Fire-and-forget background processing; do not await
    processDocument(doc.id, req.bot.id, req.file.buffer, req.file.originalname)
      .catch(e => console.error('[ingest background]', e));

    res.status(202).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /bots/:id/documents
router.get('/:id/documents', requireAuth, ownBot, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, filename, embedding_status, created_at FROM documents WHERE bot_id=$1 ORDER BY created_at DESC',
    [req.bot.id]
  );
  res.json(rows.map(r => ({ id: r.id, filename: r.filename, status: r.embedding_status, created_at: r.created_at })));
});

// DELETE /bots/:id/documents/:doc_id
router.delete('/:id/documents/:doc_id', requireAuth, ownBot, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id FROM documents WHERE id=$1 AND bot_id=$2',
    [req.params.doc_id, req.bot.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Document not found' });

  // Chunks deleted via CASCADE
  await pool.query('DELETE FROM documents WHERE id=$1', [req.params.doc_id]);
  res.json({ status: 'deleted' });
});

// GET /bots/:id/embed-snippet
router.get('/:id/embed-snippet', requireAuth, ownBot, (req, res) => {
  const origin = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
  const snippet = `<script src="${origin}/widget/widget.js" data-bot-token="${req.bot.bot_token}" defer></script>`;
  res.json({ snippet, bot_token: req.bot.bot_token });
});

module.exports = router;
