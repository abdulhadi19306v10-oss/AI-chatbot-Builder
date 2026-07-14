require('dotenv').config();
const { geminiEmbedding } = require('./gemini');
const pool = require('./db');
async function run() {
  const [emb] = await geminiEmbedding(['What is the refund policy?']);
  const {rows} = await pool.query('SELECT content, 1 - (embedding <=> $1::vector) AS similarity FROM chunks ORDER BY similarity DESC LIMIT 5', [JSON.stringify(emb)]);
  console.log(rows.map(r => r.similarity));
  process.exit(0);
}
run();
