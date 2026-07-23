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
         onboarding_completed_at = CASE WHEN $1::boolean THEN $2 ELSE onboarding_completed_at END,
         onboarding_step = CASE WHEN $3::boolean THEN $4::int ELSE onboarding_step END
       WHERE id = $5`,
      [hasCompletedAt, onboarding_completed_at ?? null, hasStep, onboarding_step ?? null, req.userId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Rate limiter for forgot-password: max 5 requests per hour per IP
// ponytail: minimalist rate limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "If that email is registered, a reset link has been sent." },
});

// POST /auth/forgot-password
let lastTestToken = null;

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;
  const genericResponse = { message: "If that email is registered, a reset link has been sent." };
  
  if (!email) return res.json(genericResponse);

  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      await pool.query(
        "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
        [user.id, tokenHash]
      );

      // Store in test hook if test environment
      if (process.env.APP_ENV === 'test') {
        lastTestToken = token;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[auth] Reset link: ${frontendUrl}/reset-password?token=${token}`);
      } else {
        console.log(`[auth] Reset link generated for user: ${email.trim().toLowerCase()} (token redacted in production)`);
      }
    }

    res.json(genericResponse);
  } catch (e) {
    console.error('[auth] forgot-password error:', e);
    // ponytail: return same generic response on error to avoid email leakage
    res.json(genericResponse);
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  const genericError = "This reset link is invalid or has expired.";

  if (!token || !new_password) {
    return res.status(400).json({ error: "Token and new password are required" });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Hash the new password before checking connection out of pool (save CPU work on connected client)
    const hash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update user's password and invalidate all outstanding tokens for this user in a transaction
    // ponytail: check out a single client connection from the pool to guarantee atomicity of the transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Claim the token atomically inside the transaction to prevent replay race conditions
      const { rows } = await client.query(
        `UPDATE password_resets SET used = true
         WHERE token_hash = $1 AND used = false AND expires_at > NOW()
         RETURNING id, user_id`,
        [tokenHash]
      );
      const reset = rows[0];

      if (!reset) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: genericError });
      }

      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, reset.user_id]);
      await client.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [reset.user_id]);
      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK').catch(() => {});
      throw txError;
    } finally {
      client.release();
    }

    res.json({ success: true, message: "Password reset successful." });
  } catch (e) {
    console.error('[auth] reset-password error:', e);
    res.status(500).json({ error: "Server error" });
  }
});

// Test endpoint to fetch the last generated test token in test environment
if (process.env.APP_ENV === 'test') {
  router.get('/test-last-token', (req, res) => {
    res.json({ token: lastTestToken });
  });
}

module.exports = { router, requireAuth };
