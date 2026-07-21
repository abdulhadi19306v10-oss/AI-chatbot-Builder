const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is required');

// Require an explicit target so this script never accidentally mutates production.
// Usage: BOTS_URL=http://localhost:3001/bots JWT_SECRET=... node test-backend.js
const botsUrl = process.env.BOTS_URL;
if (!botsUrl) throw new Error('BOTS_URL is required — set it to the /bots endpoint you want to test');

const token = jwt.sign(
  { email: 'test@example.com', name: 'Test User' },
  secret,
  { algorithm: 'HS256', expiresIn: '5m' }
);

fetch(botsUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ name: 'Test Bot via Script' })
})
.then(async res => {
  const result = { status: res.status, text: await res.text() };
  if (!res.ok) throw new Error(JSON.stringify(result));
  console.log(result);
})
.catch(error => {
  console.error(error);
  process.exitCode = 1;
});
