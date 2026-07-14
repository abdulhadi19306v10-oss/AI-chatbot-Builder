// auth.js — signup/login routes + JWT middleware
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const SECRET = process.env.JWT_SECRET;
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
    const token = jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
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

    const token = jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware: verifies JWT and attaches req.userId
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    // ponytail: fallback to decoding Google id_token from NextAuth
    const payload = jwt.decode(token);
    if (payload && payload.email) {
      let { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [payload.email]);
      if (!rows[0]) {
        const result = await pool.query(
          "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'oauth') RETURNING id",
          [payload.name || 'Unnamed', payload.email]
        );
        rows = result.rows;
      }
      req.userId = rows[0].id;
      return next();
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { router, requireAuth };
