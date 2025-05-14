/**
 * Simple Magic Link Test
 * This script tests the basic functionality of magic link tokens
 * by directly interacting with the database
 */

// Load environment variables from .env file
require('dotenv').config();

// Setup database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test email to use
const TEST_EMAIL = 'bperdomo@zoho.com';

async function testMagicLink() {
  try {
    console.log('Testing magic link functionality...');
    
    // Find user
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, is_admin FROM users WHERE email = $1 LIMIT 1',
      [TEST_EMAIL]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`No user found with email: ${TEST_EMAIL}`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    
    // Create token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60000); // 30 minutes
    
    console.log(`Generated token: ${token.substring(0, 8)}...`);
    
    // Insert token
    await pool.query(
      `INSERT INTO magic_link_tokens (
        user_id, token, expires_at, user_agent, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, token, expiresAt, 'Test Script', '127.0.0.1', now]
    );
    
    console.log('Token inserted successfully');
    
    // Check token retrieval
    const tokenResult = await pool.query(
      `SELECT * FROM magic_link_tokens 
       WHERE token = $1 
         AND expires_at > $2
         AND used = false 
       LIMIT 1`,
      [token, new Date()]
    );
    
    if (tokenResult.rows.length === 0) {
      console.error('Failed to retrieve token with conditions. This indicates an issue with the query.');
    } else {
      console.log('Successfully retrieved token with filter conditions.');
    }
    
    // Check for email template
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE type = $1 LIMIT 1',
      ['magic_link']
    );
    
    if (templateResult.rows.length === 0) {
      console.log('No magic_link email template found. You may need to create it.');
    } else {
      console.log(`Found magic_link email template: ${templateResult.rows[0].name}`);
    }
    
    console.log('\nTest complete');
    console.log('\nTo verify the fix:');
    console.log('1. Go to the app and click "Login with magic link"');
    console.log(`2. Enter the email: ${TEST_EMAIL}`);
    console.log('3. Check if the magic link email is received');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

testMagicLink().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});