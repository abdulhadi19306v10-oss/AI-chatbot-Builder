// test-gc-prereq.js — Verify GC prerequisites manually
require('dotenv').config();
const pool = require('./db');
const { pruneOldConversations } = require('./gc');

async function runTest() {
  console.log('Starting verification test...');
  try {
    // 1. Get or create a bot
    const botRes = await pool.query('SELECT id FROM bots LIMIT 1');
    let botId;
    if (botRes.rows[0]) {
      botId = botRes.rows[0].id;
      console.log(`Using existing bot ID: ${botId}`);
    } else {
      // Create user if not exists
      let userRes = await pool.query('SELECT id FROM users LIMIT 1');
      let userId;
      if (!userRes.rows[0]) {
        const u = await pool.query(
          "INSERT INTO users (name, email, password_hash) VALUES ('Test User', 'test-gc@example.com', 'hash') RETURNING id"
        );
        userId = u.rows[0].id;
      } else {
        userId = userRes.rows[0].id;
      }
      const b = await pool.query(
        "INSERT INTO bots (user_id, name) VALUES ($1, 'Test Bot') RETURNING id",
        [userId]
      );
      botId = b.rows[0].id;
      console.log(`Created test bot ID: ${botId}`);
    }

    // 2. Create a test conversation with started_at far in the past to trigger GC
    const convRes = await pool.query(
      `INSERT INTO conversations (bot_id, session_id, started_at) 
       VALUES ($1, 'test-session-123', NOW() - INTERVAL '100 days') 
       RETURNING id`,
      [botId]
    );
    const conversationId = convRes.rows[0].id;
    console.log(`Created test conversation ID: ${conversationId} (started 100 days ago)`);

    // 3. Create a lead referencing that conversation with a message
    const leadRes = await pool.query(
      `INSERT INTO leads (bot_id, email, name, conversation_id, message) 
       VALUES ($1, 'lead@example.com', 'John Doe', $2, 'How do I install this?') 
       RETURNING id`,
      [botId, conversationId]
    );
    const leadId = leadRes.rows[0].id;
    console.log(`Created lead ID: ${leadId} referencing conversation`);

    // 4. Set retention to 90 days and trigger conversation pruning
    process.env.CONVERSATION_RETENTION_DAYS = '90';
    console.log('Running pruneOldConversations()...');
    await pruneOldConversations();

    // 5. Verify conversation is deleted
    const convCheck = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (convCheck.rows.length === 0) {
      console.log('✅ Conversation successfully pruned.');
    } else {
      console.error('❌ Conversation was NOT pruned!');
    }

    // 6. Verify lead survived and conversation_id is NULL, and message is preserved
    const leadCheck = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadCheck.rows.length === 0) {
      console.error('❌ Lead was deleted!');
    } else {
      const lead = leadCheck.rows[0];
      if (lead.conversation_id === null) {
        console.log('✅ Lead conversation_id was set to NULL (ON DELETE SET NULL works).');
      } else {
        console.error(`❌ Lead conversation_id is still ${lead.conversation_id}!`);
      }
      if (lead.message === 'How do I install this?') {
        console.log(`✅ Lead message was preserved: "${lead.message}".`);
      } else {
        console.error(`❌ Lead message mismatch: "${lead.message}"`);
      }
    }

    // Cleanup the lead
    await pool.query('DELETE FROM leads WHERE id = $1', [leadId]);
    console.log('Cleanup complete.');

  } catch (e) {
    console.error('Test failed with error:', e);
  } finally {
    await pool.end();
  }
}

runTest();
