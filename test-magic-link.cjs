/**
 * Test Magic Link Functionality
 * 
 * This script tests the magic link authentication flow by directly
 * interacting with the database to verify our fixes.
 */

// Node.js core modules
const path = require('path');
const { randomBytes } = require('crypto');

// PostgreSQL connection
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

// Initialize PostgreSQL connection from DATABASE_URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Test configuration
const TEST_EMAIL = 'bperdomo@zoho.com';
const TOKEN_EXPIRY_MINUTES = 30;

// Main test function
async function testMagicLinkFlow() {
  try {
    console.log('Testing magic link functionality...');
    
    // 1. Find the user to test with 
    console.log(`Looking up user with email: ${TEST_EMAIL}`);
    const users = await db.query.sql`
      SELECT id, email, first_name, last_name, is_admin FROM users 
      WHERE email = ${TEST_EMAIL} LIMIT 1
    `;
    
    if (!users || users.length === 0) {
      console.error(`No user found with email: ${TEST_EMAIL}`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`Found user: ${user.first_name} ${user.last_name} (ID: ${user.id}, Admin: ${user.is_admin})`);
    
    // 2. Generate a token
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60000);
    
    console.log(`Generated token: ${token.substring(0, 8)}...`);
    console.log(`Token expires at: ${expiresAt.toISOString()}`);
    
    // 3. Insert the token into the database
    await db.query.sql`
      INSERT INTO magic_link_tokens (
        user_id, token, expires_at, user_agent, ip_address, created_at
      ) VALUES (
        ${user.id}, ${token}, ${expiresAt.toISOString()}, 
        'Test Script', '127.0.0.1', ${now.toISOString()}
      )
    `;
    
    console.log('Token created in database successfully');
    
    // 4. Verify the token can be retrieved with the correct filters
    const tokens = await db.query.sql`
      SELECT * FROM magic_link_tokens 
      WHERE token = ${token} 
        AND expires_at > ${new Date().toISOString()}
        AND used = false
      LIMIT 1
    `;
    
    if (!tokens || tokens.length === 0) {
      console.error('Failed to retrieve the token with filters. This indicates an issue with the query conditions.');
      process.exit(1);
    }
    
    console.log('Token retrieved successfully with filters');
    
    // 5. Check if the email template exists
    const templates = await db.query.sql`
      SELECT * FROM email_templates WHERE type = 'magic_link' LIMIT 1
    `;
    
    if (!templates || templates.length === 0) {
      console.log('No magic_link email template found. Creating it...');
      
      // Create the template if it doesn't exist
      await db.query.sql`
        INSERT INTO email_templates (
          name, type, subject, content, sender_name, sender_email, 
          description, created_at, updated_at
        ) VALUES (
          'Magic Link Login', 'magic_link', 'Your MatchPro Login Link',
          'Login link: {{magicLinkUrl}}', 'MatchPro', 'support@matchpro.ai',
          'Email template for magic link authentication', 
          ${now.toISOString()}, ${now.toISOString()}
        )
      `;
      
      console.log('Created magic_link email template');
    } else {
      console.log(`Found magic_link email template: ${templates[0].name}`);
    }
    
    console.log('\nMagic link system test completed successfully!');
    console.log('\nManual test steps:');
    console.log('1. Visit the app and click on "Login with Email"');
    console.log(`2. Enter the email: ${TEST_EMAIL}`);
    console.log('3. Check if the magic link email is received');
    console.log('4. Click the link in the email to verify the token works');
    
    // Clean up
    pool.end();
  } catch (error) {
    console.error('Error testing magic link functionality:', error);
    pool.end();
    process.exit(1);
  }
}

// Run the test
testMagicLinkFlow();