// routes/analytics.js — GET /bots/:id/conversations + GET /bots/:id/analytics
// Analytics computed via direct SQL aggregates — no event log needed.
const router = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../auth');

// Reuse ownBot guard (copy from bots.js — ponytail: small enough to inline, no shared util)
async function ownBot(req, res, next) {
  const { rows } = await pool.query(
    'SELECT id FROM bots WHERE id=$1 AND user_id=$2',
    [req.params.id, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Bot not found' });
  req.botId = rows[0].id;
  next();
}

// GET /bots/:id/conversations
router.get('/:id/conversations', requireAuth, ownBot, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.session_id, c.started_at, c.resolved,
            COUNT(m.id) AS message_count
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.bot_id = $1
     GROUP BY c.id
     ORDER BY c.started_at DESC
     LIMIT 100`,
    [req.botId]
  );
  res.json(rows);
});

// GET /bots/:id/conversations/:convId
router.get('/:id/conversations/:convId', requireAuth, ownBot, async (req, res) => {
  const { rows: convs } = await pool.query(
    'SELECT id, session_id, started_at, resolved FROM conversations WHERE id=$1 AND bot_id=$2',
    [req.params.convId, req.botId]
  );
  if (!convs[0]) return res.status(404).json({ error: 'Conversation not found' });

  const { rows: messages } = await pool.query(
    'SELECT role, content, created_at FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC',
    [convs[0].id]
  );
  
  res.json({ conversation: convs[0], messages });
});

// GET /bots/:id/analytics
router.get('/:id/analytics', requireAuth, ownBot, async (req, res) => {
  const [totalConvos, resolvedConvos, totalMessages, totalLeads, last7Days] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM conversations WHERE bot_id=$1', [req.botId]),
    pool.query('SELECT COUNT(*) FROM conversations WHERE bot_id=$1 AND resolved=true', [req.botId]),
    pool.query("SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.bot_id=$1 AND m.role='bot'", [req.botId]),
    pool.query('SELECT COUNT(*) FROM leads WHERE bot_id=$1', [req.botId]),
    pool.query(
      `SELECT DATE(started_at) AS day, COUNT(*) AS conversations
       FROM conversations WHERE bot_id=$1 AND started_at >= NOW() - INTERVAL '7 days'
       GROUP BY day ORDER BY day`,
      [req.botId]
    ),
  ]);

  res.json({
    total_conversations: parseInt(totalConvos.rows[0].count),
    resolved_conversations: parseInt(resolvedConvos.rows[0].count),
    total_bot_messages: parseInt(totalMessages.rows[0].count),
    total_leads: parseInt(totalLeads.rows[0].count),
    last_7_days: last7Days.rows,
  });
});

module.exports = router;
