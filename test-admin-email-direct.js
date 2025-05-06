/**
 * Test Admin Welcome Email - Direct Test
 * 
 * This script tests the admin welcome email sending functionality directly
 * by calling the email service without going through the API endpoints.
 * This allows us to verify that the email service and templates are configured correctly.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { sendTemplatedEmail } from './server/services/emailService.js';

dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function testAdminWelcomeEmail() {
  try {
    console.log('Starting admin welcome email direct test...');
    
    // Get app URL from environment variables or use default
    const appUrl = process.env.APP_URL || 
                 (process.env.REPLIT_DOMAINS ? 
                  `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
                  'https://matchpro.ai');
    
    // Create test data for the email
    const testAdmin = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test-admin@example.com', // Use your test email here
      loginUrl: `${appUrl}/login`,
      appUrl,
      role: 'Administrator',
      isAdmin: true
    };
    
    console.log('Sending admin welcome email with test data:', testAdmin);
    
    // Send the welcome email
    await sendTemplatedEmail(
      testAdmin.email,
      'admin_welcome',
      testAdmin
    );
    
    console.log('Email sending request completed. Check your SendGrid dashboard or logs for delivery status.');
    
    return true;
  } catch (error) {
    console.error('Error sending admin welcome email:', error);
    if (error.response) {
      console.error('SendGrid API error:', error.response.body);
    }
    return false;
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run the test
testAdminWelcomeEmail()
  .then(success => {
    if (success) {
      console.log('✅ Test completed successfully');
    } else {
      console.log('❌ Test failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });