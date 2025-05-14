/**
 * Test Magic Link Functionality
 * 
 * This script tests the magic link authentication flow by generating
 * and sending a magic link email to the specified recipient.
 * 
 * Usage:
 *   node test-magic-link.js email@example.com
 */

import { createMagicLinkToken, createMagicLinkTokenByEmail, sendMagicLinkEmail, verifyMagicLinkToken } from './server/services/magicLinkService.js';

async function testMagicLink() {
  try {
    const recipientEmail = process.argv[2];
    
    if (!recipientEmail) {
      console.error('Please provide a recipient email address');
      console.error('Usage: node test-magic-link.js email@example.com');
      process.exit(1);
    }
    
    console.log(`Testing magic link functionality for email: ${recipientEmail}`);
    
    // Create a magic link token
    console.log('Creating magic link token...');
    const token = await createMagicLinkTokenByEmail(
      recipientEmail,
      'Test User Agent',
      '127.0.0.1'
    );
    
    if (!token) {
      console.error(`Failed to create token for ${recipientEmail}. User may not exist.`);
      process.exit(1);
    }
    
    console.log(`Token created: ${token.substring(0, 8)}...`);
    
    // Send the magic link email
    console.log('Sending magic link email...');
    const baseUrl = 'https://matchpro.ai'; // Or use your local development URL
    const emailSent = await sendMagicLinkEmail(recipientEmail, token, baseUrl);
    
    if (emailSent) {
      console.log('Magic link email sent successfully!');
      console.log(`Verify token: ${baseUrl}/auth/verify-magic-link?token=${token}`);
    } else {
      console.error('Failed to send magic link email.');
    }
    
    // Test token verification (optional - in a real flow this would be done by the frontend)
    console.log('\nTesting token verification...');
    const userId = await verifyMagicLinkToken(token);
    
    if (userId) {
      console.log(`Token verified successfully for user ID: ${userId}`);
    } else {
      console.error('Failed to verify token.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing magic link functionality:', error);
    process.exit(1);
  }
}

testMagicLink();