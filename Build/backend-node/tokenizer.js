// tokenizer.js — lightweight GPT-4 tokenizer via js-tiktoken (no Python, no extra processes)
// Provides encode/decode used by ingest.js for the 500/50 chunking.
// ponytail: using js-tiktoken directly, no wrapper class needed

let enc;

function getEnc() {
  if (!enc) {
    // lazy-load so startup isn't blocked
    const { getEncoding } = require('js-tiktoken');
    enc = getEncoding('cl100k_base');
  }
  return enc;
}

function encode(text) {
  return Array.from(getEnc().encode(text));
}

function decode(tokens) {
  return getEnc().decode(tokens);
}

module.exports = { encode, decode };
