/**
 * Simple SendGrid Password Reset Test
 * 
 * This script tests sending a password reset email using SendGrid directly.
 */

import { MailService } from '@sendgrid/mail';

async function testPasswordResetEmail() {
  try {
    // Get API key from environment
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('SENDGRID_API_KEY environment variable is not set.');
      process.exit(1);
    }

    // Get recipient email from command line
    const recipient = process.argv[2];
    if (!recipient) {
      console.error('Please provide an email address as an argument.');
      console.error('Usage: node test-sendgrid-reset.js email@example.com');
      process.exit(1);
    }
    
    const sender = 'support@matchpro.ai';
    console.log(`Sending password reset email to ${recipient} from ${sender}...`);

    // Initialize SendGrid client
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    // Generate a fake reset token
    const resetToken = 'test-' + Math.random().toString(36).substring(2, 15);
    const resetLink = `https://app.matchpro.ai/reset-password?token=${resetToken}`;
    
    // Email message
    const msg = {
      to: recipient,
      from: sender,
      subject: 'MatchPro - Password Reset Email Test',
      text: `This is a test password reset email. Please use the following link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0066cc;">MatchPro Password Reset Test</h2>
          <p>You have requested to reset your password. Please click the link below to reset your password:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${resetLink}</p>
          <p>This is a test email - the reset link is not valid.</p>
        </div>
      `,
    };
    
    // Send the email
    const response = await mailService.send(msg);
    console.log('Password reset email sent successfully!');
    console.log(`Response status code: ${response[0].statusCode}`);
  } catch (error) {
    console.error('Error sending password reset email:');
    console.error(error);
    if (error.response) {
      console.error('API response:', error.response.body);
    }
    process.exit(1);
  }
}

testPasswordResetEmail().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});