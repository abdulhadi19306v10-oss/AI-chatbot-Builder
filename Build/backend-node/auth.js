// auth.js — signup/login routes + JWT middleware
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: NEXTAUTH_SECRET or JWT_SECRET must be set in production');
}
const ACTUAL_SECRET = SECRET || 'fallback_secret_for_dev';
const SALT_ROUNDS = 10;

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hash]
    );
    const user = rows[0];
    // Token generation removed; NextAuth manages session.
    res.json({ user });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email, password required' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Return user object directly; NextAuth will issue its own JWT.
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware: verifies NextAuth JWT and attaches req.userId
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, ACTUAL_SECRET);
    if (!payload.email) return res.status(401).json({ error: 'Invalid token payload' });
    
    // Look up or auto-create user by email to ensure we have the DB integer ID.
    let { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [payload.email]);
    if (!rows[0]) {
      const result = await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'oauth') RETURNING id",
        [payload.name || 'Unnamed', payload.email]
      );
      rows = result.rows;
    }
    req.userId = rows[0].id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /auth/onboarding — fetch onboarding state
router.get('/onboarding', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT onboarding_completed_at, onboarding_step FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({
      onboarding_completed_at: rows[0].onboarding_completed_at,
      onboarding_step: rows[0].onboarding_step
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /auth/onboarding — update onboarding state (set step, complete or reset)
router.put('/onboarding', requireAuth, async (req, res) => {
  const hasCompletedAt = Object.prototype.hasOwnProperty.call(req.body, 'onboarding_completed_at');
  const hasStep = Object.prototype.hasOwnProperty.call(req.body, 'onboarding_step');
  const { onboarding_completed_at, onboarding_step } = req.body;
  try {
    await pool.query(
      `UPDATE users SET
         onboarding_completed_at = CASE WHEN $1 THEN $2 ELSE onboarding_completed_at END,
         onboarding_step = CASE WHEN $3 THEN $4 ELSE onboarding_step END
       WHERE id = $5`,
      [hasCompletedAt, onboarding_completed_at ?? null, hasStep, onboarding_step ?? null, req.userId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, requireAuth };
