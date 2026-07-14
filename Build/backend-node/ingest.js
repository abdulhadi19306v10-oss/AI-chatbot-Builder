// ingest.js — text extraction, chunking (500 tok / 50 overlap), Gemini embeddings
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { encode, decode } = require('./tokenizer');
const pool = require('./db');
const { geminiEmbedding } = require('./gemini');

async function extractText(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (ext === 'txt') {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

// ponytail: exact values from validated Python backend — do not change
const CHUNK_SIZE = 500;
const OVERLAP = 50;

function chunkTokens(text) {
  const tokens = encode(text);
  const chunks = [];
  let i = 0;
  while (i < tokens.length) {
    chunks.push(decode(tokens.slice(i, i + CHUNK_SIZE)));
    i += CHUNK_SIZE - OVERLAP;
  }
  return chunks;
}

async function processDocument(docId, botId, buffer, filename) {
  await pool.query("UPDATE documents SET embedding_status='processing' WHERE id=$1", [docId]);

  try {
    const text = await extractText(buffer, filename);

    // Store raw text so it's available for re-processing without re-upload
    await pool.query('UPDATE documents SET content=$1 WHERE id=$2', [text, docId]);

    const chunks = chunkTokens(text);
    if (chunks.length === 0) throw new Error('No text extracted from document');

    // Gemini text-embedding-004: batch up to 100 at a time
    const BATCH = 100;
    for (let b = 0; b < chunks.length; b += BATCH) {
      const batch = chunks.slice(b, b + BATCH);
      const embeddings = await geminiEmbedding(batch);

      for (let i = 0; i < batch.length; i++) {
        await pool.query(
          'INSERT INTO chunks (document_id, bot_id, content, embedding, chunk_index) VALUES ($1,$2,$3,$4,$5)',
          [docId, botId, batch[i], JSON.stringify(embeddings[i]), b + i]
        );
      }
    }

    await pool.query("UPDATE documents SET embedding_status='ready' WHERE id=$1", [docId]);
    // Mark bot active once it has at least one ready doc
    await pool.query(
      "UPDATE bots SET status='active' WHERE id=$1 AND status='training'",
      [botId]
    );
  } catch (e) {
    console.error('[ingest]', e.message);
    await pool.query("UPDATE documents SET embedding_status='failed' WHERE id=$1", [docId]);
  }
}

module.exports = { processDocument };
