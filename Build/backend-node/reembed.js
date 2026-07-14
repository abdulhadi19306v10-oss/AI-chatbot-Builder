require('dotenv').config();
const pool = require('./db');
const { geminiEmbedding } = require('./gemini');
const { encode, decode } = require('./tokenizer');
const CHUNK_SIZE = 500;
const OVERLAP = 50;
async function run() {
  try {
    const {rows} = await pool.query('SELECT id, bot_id, content FROM documents WHERE content IS NOT NULL');
    for (const doc of rows) {
      console.log('Processing', doc.id);
      await pool.query('DELETE FROM chunks WHERE document_id=$1', [doc.id]);
      const tokens = encode(doc.content);
      const chunks = [];
      let i = 0;
      while (i < tokens.length) {
        chunks.push(decode(tokens.slice(i, i + CHUNK_SIZE)));
        i += CHUNK_SIZE - OVERLAP;
      }
      if (chunks.length === 0) continue;
      const BATCH = 100;
      for (let b = 0; b < chunks.length; b += BATCH) {
        const batch = chunks.slice(b, b + BATCH);
        const embeddings = await geminiEmbedding(batch);
        for (let j = 0; j < batch.length; j++) {
          await pool.query('INSERT INTO chunks (document_id, bot_id, content, embedding, chunk_index) VALUES ($1,$2,$3,$4,$5)', [doc.id, doc.bot_id, batch[j], JSON.stringify(embeddings[j]), b + j]);
        }
      }
      console.log('Done', doc.id);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
