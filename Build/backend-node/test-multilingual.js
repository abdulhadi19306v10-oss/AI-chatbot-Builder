// test-multilingual.js — Verify multilingual RAG responses and localized fallbacks
require('dotenv').config();
const { URL } = require('url');
const pool = require('./db');
const { geminiEmbedding } = require('./gemini');

const dbUrl = process.env.DATABASE_URL || '';
const optIn = process.env.I_AM_SURE_I_WANT_TO_RUN_THIS_TEST === 'true';
const isTestEnv = process.env.APP_ENV === 'test';
const apiBaseUrl = process.env.CHAT_API_BASE_URL || 'http://localhost:8000';

let isTestDb = false;
try {
  const parsed = new URL(dbUrl);
  const hostname = parsed.hostname;
  const dbname = parsed.pathname ? parsed.pathname.replace(/^\//, '').split('?')[0] : '';
  
  const allowedHostnames = ['localhost', '127.0.0.1', 'ep-twilight-surf-azli3hmh.c-3.ap-southeast-1.aws.neon.tech'];
  const isAllowedHost = allowedHostnames.includes(hostname);
  const isTestDbName = dbname === 'test' || dbname.startsWith('test_') || dbname.endsWith('_test') || dbname === 'neondb_test';
  
  isTestDb = isAllowedHost && isTestDbName;
} catch (err) {
  isTestDb = false;
}

if (!isTestDb || !optIn || !isTestEnv) {
  console.error('❌ Error: Enforcing strict safety checks.');
  console.error('To run this test, you must be in a test environment (APP_ENV=test), use a test database (localhost or named test_*/*_test), AND set I_AM_SURE_I_WANT_TO_RUN_THIS_TEST=true.');
  console.error('Ensure that the backend process is started using the identical DATABASE_URL.');
  process.exit(1);
}

async function runTest() {
  console.log(`Starting multilingual RAG and localized fallback verification test against backend: ${apiBaseUrl}...`);

  // 0. Backend test mode health check
  console.log(`Checking backend test mode at ${apiBaseUrl}...`);
  try {
    const healthRes = await fetch(`${apiBaseUrl}/auth/test-last-token?email=healthcheck`);
    if (!healthRes.ok) {
      throw new Error(`Health check failed: status ${healthRes.status}. Make sure the target backend is running with APP_ENV=test!`);
    }
    const healthData = await healthRes.json();
    if (!healthData || !healthData.hasOwnProperty('token')) {
      throw new Error(`Health check failed: Response did not contain 'token'. Make sure the target backend is in test mode.`);
    }
    console.log('✅ Success: Target backend is confirmed to be running in test mode.');
  } catch (err) {
    console.error(`❌ Health Check Error: Cannot confirm test mode at target backend: ${apiBaseUrl}`);
    console.error(err.message);
    process.exit(1);
  }

  let testFailed = false;
  let botId = null;
  let docId = null;
  let botToken = null;

  try {
    // 1. Create a test user
    await pool.query("DELETE FROM users WHERE email = 'multi-test@example.com'");
    const userRes = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ('Multilingual Tester', 'multi-test@example.com', 'hash') RETURNING id"
    );
    const userId = userRes.rows[0].id;

    // 2. Create a test bot
    const botRes = await pool.query(
      "INSERT INTO bots (user_id, name, status, welcome_msg) VALUES ($1, 'Multilingual Tester', 'active', 'Hola') RETURNING id, bot_token",
      [userId]
    );
    botId = botRes.rows[0].id;
    botToken = botRes.rows[0].bot_token;
    console.log(`Created test bot: ${botId} (token: ${botToken})`);

    // 3. Create a test document
    const docRes = await pool.query(
      "INSERT INTO documents (bot_id, filename, content, embedding_status) VALUES ($1, 'multi-test.txt', 'Document', 'ready') RETURNING id",
      [botId]
    );
    docId = docRes.rows[0].id;

    // 4. Create and embed test chunks
    const chunkA = "Nuestra política de devolución permite devoluciones dentro de los 30 días."; // Spanish
    const chunkB = "Our standard shipping takes 3 to 5 business days."; // English

    const [embA, embB] = await geminiEmbedding([chunkA, chunkB]);

    await pool.query(
      "INSERT INTO chunks (document_id, bot_id, content, embedding, chunk_index) VALUES ($1, $2, $3, $4::vector, 0)",
      [docId, botId, chunkA, JSON.stringify(embA)]
    );
    await pool.query(
      "INSERT INTO chunks (document_id, bot_id, content, embedding, chunk_index) VALUES ($1, $2, $3, $4::vector, 1)",
      [docId, botId, chunkB, JSON.stringify(embB)]
    );
    console.log('Test chunks and embeddings inserted.');

    // 5. Test Case 1: Same language query matching same language context (Spanish -> Spanish)
    console.log('\n--- Test Case 1: Spanish Query matching Spanish Context ---');
    const res1 = await fetch(`${apiBaseUrl}/chat/${botToken}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'test-session-123', message: '¿Cuál es la política de devolución?' })
    });
    const data1 = await res1.json();
    console.log('Response:', data1);
    if (res1.ok && data1.type === 'answer' && data1.content.toLowerCase().includes('30')) {
      console.log('✅ Success: Replied with matched Spanish context correctly.');
    } else {
      console.error('❌ Failure: Spanish-to-Spanish query failed.');
      testFailed = true;
    }

    // 6. Test Case 2: Cross-lingual query (Spanish Query matching English Context)
    console.log('\n--- Test Case 2: Spanish Query matching English Context ---');
    const res2 = await fetch(`${apiBaseUrl}/chat/${botToken}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'test-session-123', message: '¿Cuánto tiempo toma el envío estándar?' })
    });
    const data2 = await res2.json();
    console.log('Response:', data2);
    const lowerContent2 = data2.content.toLowerCase();
    const containsEnglishKeywords = lowerContent2.includes('standard') || lowerContent2.includes('shipping') || lowerContent2.includes('business');
    if (res2.ok && data2.type === 'answer' && (lowerContent2.includes('3') || lowerContent2.includes('5')) && !containsEnglishKeywords) {
      console.log('✅ Success: Spanish query matched English context and replied with a Spanish answer.');
    } else {
      console.error('❌ Failure: Cross-lingual query did not retrieve the context, was not in Spanish, or contained English keywords.');
      testFailed = true;
    }

    // 7. Test Case 3: Localized Fallback message (Spanish Query with no match)
    console.log('\n--- Test Case 3: Spanish Query falling back (localized response) ---');
    const res3 = await fetch(`${apiBaseUrl}/chat/${botToken}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'test-session-123', message: '¿Cuál es el sentido de la vida?' })
    });
    const data3 = await res3.json();
    console.log('Response:', data3);
    const lowerContent3 = data3.content.toLowerCase();
    const hasEnglishFallbackWords = lowerContent3.includes('information') || lowerContent3.includes('details');
    // Ensure the message is in Spanish (e.g. should contain words like "información", "datos", "correo", "nombre", "contacto" or similar)
    const isSpanishFallback = lowerContent3.includes('información') || lowerContent3.includes('informacion') || lowerContent3.includes('nombre') || lowerContent3.includes('correo') || lowerContent3.includes('email');
    if (res3.ok && data3.type === 'fallback' && isSpanishFallback && !hasEnglishFallbackWords) {
      console.log('✅ Success: Received localized fallback message in Spanish.');
    } else {
      console.error('❌ Failure: Fallback was not localized correctly or did not return in Spanish.');
      testFailed = true;
    }

  } catch (e) {
    console.error('Test failed with error:', e);
    testFailed = true;
  } finally {
    // Cleanup test bot, document, and chunks
    if (botId) {
      try {
        await pool.query('DELETE FROM bots WHERE id = $1', [botId]);
        await pool.query("DELETE FROM users WHERE email = 'multi-test@example.com'");
        console.log('\nCleanup complete.');
      } catch (cleanupErr) {
        testFailed = true;
        console.error('Failed to cleanup test bot:', cleanupErr.message);
      }
    }
    await pool.end();
    if (testFailed) {
      process.exit(1);
    } else {
      console.log('Verification completed successfully.');
    }
  }
}

runTest();
