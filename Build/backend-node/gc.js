// gc.js — Garbage Collection scheduled jobs
// ponytail: minimalist node-cron setup sharing db pool, no extra worker process needed (YAGNI)

const cron = require('node-cron');
const pool = require('./db');

async function reapStuckDocuments() {
  try {
    const res = await pool.query(`
      UPDATE documents
      SET embedding_status = 'failed'
      WHERE embedding_status = 'processing'
        AND created_at < NOW() - INTERVAL '1 hour'
    `);
    if (res.rowCount > 0) {
      console.log(`[gc] reaped ${res.rowCount} stuck documents`);
    }
  } catch (e) {
    console.error('[gc] failed to reap stuck documents:', e.message);
  }
}

async function cleanupFailedDocuments() {
  try {
    const res = await pool.query(`
      DELETE FROM documents
      WHERE embedding_status = 'failed'
        AND created_at < NOW() - INTERVAL '30 days'
    `);
    if (res.rowCount > 0) {
      console.log(`[gc] cleaned up ${res.rowCount} failed documents`);
    }
  } catch (e) {
    console.error('[gc] failed to cleanup failed documents:', e.message);
  }
}

async function pruneOldConversations() {
  try {
    const configuredDays = process.env.CONVERSATION_RETENTION_DAYS;
    const days = configuredDays === undefined ? 90 : Number(configuredDays);
    if (!Number.isSafeInteger(days) || days < 1) {
      throw new Error('CONVERSATION_RETENTION_DAYS must be a positive integer');
    }
    const res = await pool.query(
      `DELETE FROM conversations WHERE started_at < NOW() - ($1 * INTERVAL '1 day')`,
      [days]
    );
    if (res.rowCount > 0) {
      console.log(`[gc] purged ${res.rowCount} conversations older than ${days} days`);
    }
  } catch (e) {
    console.error('[gc] failed to prune old conversations:', e.message);
  }
}

function startGC() {
  // Job 1: Stuck reaper — every hour ('0 * * * *')
  cron.schedule('0 * * * *', reapStuckDocuments);

  // Job 2: Failed doc cleanup — daily ('0 0 * * *')
  cron.schedule('0 0 * * *', cleanupFailedDocuments);

  // Job 3: Conversation retention — daily ('0 0 * * *')
  cron.schedule('0 0 * * *', pruneOldConversations);

  console.log('[gc] Scheduled garbage collection jobs (stuck reaper hourly, cleanup/retention daily)');
}

module.exports = {
  startGC,
  reapStuckDocuments,
  cleanupFailedDocuments,
  pruneOldConversations
};
