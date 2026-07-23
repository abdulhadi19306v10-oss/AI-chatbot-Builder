// test-password-reset.js — Verify password reset security and functionality
require('dotenv').config();
const { URL } = require('url');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('./db');

const optIn = process.env.I_AM_SURE_I_WANT_TO_RUN_THIS_TEST === 'true';

if (!optIn) {
  console.error('❌ Error: Enforcing strict safety checks.');
  console.error('This script modifies user passwords and deletes test user credentials.');
  console.error('To run this test, you must explicitly set I_AM_SURE_I_WANT_TO_RUN_THIS_TEST=true.');
  process.exit(1);
}

async function runTest() {
  console.log('Starting password reset verification test...');
  let testFailed = false;
  let testUserId = null;
  const testEmail = 'reset-test@example.com';
  const testPassword = 'original_password123';
  const newPassword = 'new_secure_password456';

  try {
    // 1. Create a test user
    // Clean up existing test user if any
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    
    const hash = await bcrypt.hash(testPassword, 10);
    const userRes = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ('Reset Tester', $1, $2) RETURNING id",
      [testEmail, hash]
    );
    testUserId = userRes.rows[0].id;
    console.log(`Created test user ID: ${testUserId}`);

    // 2. Request forgot password using local fetch
    console.log('Calling POST /auth/forgot-password...');
    const forgotRes = await fetch('http://localhost:8000/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    const forgotData = await forgotRes.json();
    console.log('Response body:', forgotData);
    
    // Check if token is NOT in the response body
    if (JSON.stringify(forgotData).includes('token') && !JSON.stringify(forgotData).includes('link has been sent')) {
      console.error('❌ Security Violation: Token was returned in the API response!');
      testFailed = true;
    } else {
      console.log('✅ Success: Token is not exposed in the API response body.');
    }

    // 3. Retrieve the actual raw token issued by forgot-password from backend test hook
    console.log('Fetching raw token from test hook...');
    const tokenHookRes = await fetch('http://localhost:8000/auth/test-last-token');
    if (!tokenHookRes.ok) {
      console.error('❌ Error: Fetching test hook failed. Make sure server is running with APP_ENV=test!');
      testFailed = true;
      return;
    }
    const tokenHookData = await tokenHookRes.json();
    const rawToken = tokenHookData.token;
    
    if (!rawToken) {
      console.error('❌ Error: Test hook did not return a token. Didforgot-password run successfully?');
      testFailed = true;
      return;
    }
    console.log(`✅ Success: Retrieved raw token issued by forgot-password: ${rawToken}`);

    // 3.5. Confirm a short password is server-side rejected
    console.log('Calling POST /auth/reset-password with a short password...');
    const shortPasswordRes = await fetch('http://localhost:8000/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'short' })
    });
    const shortPasswordData = await shortPasswordRes.json();
    console.log('Short password response:', shortPasswordData);
    if (!shortPasswordRes.ok && shortPasswordData.error === 'Password must be at least 8 characters long') {
      console.log('✅ Success: Short password correctly rejected by server.');
    } else {
      console.error('❌ Error: Short password was NOT rejected properly!');
      testFailed = true;
    }

    // 4. Use the custom raw token to reset the password
    console.log('Calling POST /auth/reset-password...');
    const resetRes2 = await fetch('http://localhost:8000/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: newPassword })
    });
    
    const resetData = await resetRes2.json();
    console.log('Reset response:', resetData);
    if (resetRes2.ok && resetData.success) {
      console.log('✅ Password reset request succeeded.');
    } else {
      console.error('❌ Password reset request failed!');
      testFailed = true;
    }

    // 5. Verify the password has updated in the database
    const userCheck = await pool.query('SELECT password_hash FROM users WHERE id = $1', [testUserId]);
    const isNewPasswordCorrect = await bcrypt.compare(newPassword, userCheck.rows[0].password_hash);
    if (isNewPasswordCorrect) {
      console.log('✅ Success: User password was updated correctly.');
    } else {
      console.error('❌ Error: User password hash was NOT updated correctly!');
      testFailed = true;
    }

    // 6. Confirm the same token can't be used a second time
    console.log('Attempting to use the same token a second time...');
    const reuseRes = await fetch('http://localhost:8000/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'another_password789' })
    });
    const reuseData = await reuseRes.json();
    console.log('Reuse response:', reuseData);
    if (!reuseRes.ok && reuseData.error === 'This reset link is invalid or has expired.') {
      console.log('✅ Success: Token reuse correctly rejected.');
    } else {
      console.error('❌ Error: Token reuse was NOT rejected properly!');
      testFailed = true;
    }

    // 7. Confirm an expired token is correctly rejected
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
    // Insert token that expired 1 hour ago
    await pool.query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() - INTERVAL '1 hour')",
      [testUserId, expiredHash]
    );
    
    console.log('Attempting to use an expired token...');
    const expiredRes = await fetch('http://localhost:8000/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredToken, new_password: 'expired_password789' })
    });
    const expiredData = await expiredRes.json();
    console.log('Expired response:', expiredData);
    if (!expiredRes.ok && expiredData.error === 'This reset link is invalid or has expired.') {
      console.log('✅ Success: Expired token correctly rejected.');
    } else {
      console.error('❌ Error: Expired token was NOT rejected properly!');
      testFailed = true;
    }

  } catch (e) {
    console.error('Test failed with error:', e);
    testFailed = true;
  } finally {
    // Cleanup test user
    if (testUserId) {
      try {
        await pool.query('DELETE FROM users WHERE email = $1', [testEmail]); // cleanup by email
        console.log('Cleanup complete.');
      } catch (cleanupErr) {
        testFailed = true;
        console.error('Failed to cleanup test user:', cleanupErr.message);
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
