// index.js — Express app entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { router: authRouter } = require('./auth');
const botsRouter = require('./routes/bots');
const chatRouter = require('./routes/chat');
const analyticsRouter = require('./routes/analytics');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Rate limit only the public chat endpoint — no auth and no per-user cap otherwise
// ponytail: only apply where it's needed
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 30,               // 30 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

// Serve widget static files (widget.js, iframe.html, demo.html)
app.use('/widget', express.static(path.join(__dirname, 'widget')));

app.use('/auth', authRouter);
app.use('/bots', botsRouter);
app.use('/bots', analyticsRouter);
app.use('/chat', chatLimiter, chatRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
