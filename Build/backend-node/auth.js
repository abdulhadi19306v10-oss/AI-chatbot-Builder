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

module.exports = { router, requireAuth };
