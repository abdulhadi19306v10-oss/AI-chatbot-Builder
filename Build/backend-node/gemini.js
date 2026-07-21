// gemini.js — OpenAI-compatible client pointed at Gemini endpoints
// Using the openai Node SDK as instructed (Gemini's OpenAI-compatible endpoint).
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || 'missing_key',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// Embed one or more text strings using text-embedding-004 (768-dim output)
// Returns array of float arrays, one per input string.
async function geminiEmbedding(texts) {
  // Gemini embedding via OpenAI compat: one call per text (no batch endpoint exposed in this compat layer)
  const results = await Promise.all(
    texts.map(t =>
      client.embeddings.create({ model: 'gemini-embedding-2', dimensions: 768, input: t })
        .then(r => r.data[0].embedding)
    )
  );
  return results;
}

// Non-streaming chat completion
async function geminiChat(messages) {
  const resp = await client.chat.completions.create({
    model: 'gemini-3.5-flash',
    messages,
  });
  return resp.choices[0].message.content;
}

module.exports = { geminiEmbedding, geminiChat };
