/**
 * Simple SendGrid Email Test
 * 
 * This script uses SendGrid's mail service directly without
 * relying on the application's email service layer.
 * 
 * Usage:
 *   node test-sendgrid-direct.js recipient@example.com sender@example.com
 * 
 * Note: The sender email must be verified in your SendGrid account.
 */

import { MailService } from '@sendgrid/mail';

async function sendTestEmail() {
  try {
    // Get API key from environment
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('SENDGRID_API_KEY environment variable is not set.');
      process.exit(1);
    }

    // Get email addresses from command line arguments
    const recipient = process.argv[2] || 'recipient@example.com';
    const sender = process.argv[3] || 'support@matchpro.ai';
    
    console.log(`Sending test email to ${recipient} from ${sender}...`);

    // Initialize SendGrid client
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    // Email message
    const msg = {
      to: recipient,
      from: sender,
      subject: 'SendGrid Direct Test',
      text: 'This is a test email sent directly through SendGrid.',
      html: '<strong>This is a test email sent directly through SendGrid.</strong>',
    };
    
    // Send the email
    const response = await mailService.send(msg);
    console.log('Email sent successfully!');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    if (error.response) {
      console.error('API response:', error.response.body);
    }
  }
}

// Run the test
sendTestEmail();