// run-migration.js — one-shot: reads migrate.sql and runs it against DATABASE_URL
// Usage: node run-migration.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf-8');

(async () => {
  try {
    await pool.query(sql);
    console.log('✅ Migration complete');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
