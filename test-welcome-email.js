/**
 * Test Welcome Email with SendGrid
 * 
 * This script tests sending a welcome email using SendGrid.
 * It bypasses the normal registration flow and directly uses the email service.
 */

import { sendTemplatedEmail } from './server/services/emailService.js';

async function testWelcomeEmail() {
  try {
    console.log('Starting welcome email test...');
    
    // Replace this with a valid test email address
    const testEmailAddress = 'your-test-email@example.com';
    
    // User details for the template
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: testEmailAddress,
      username: 'testuser'
    };
    
    console.log(`Sending welcome email to ${testEmailAddress}...`);
    
    await sendTemplatedEmail(
      testEmailAddress,
      'welcome',
      userData
    );
    
    console.log('Welcome email sent successfully!');
    console.log('Check your inbox for the welcome email.');
    console.log('Note: It may take a few minutes for the email to arrive.');
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

testWelcomeEmail();