/**
 * Test Password Reset Email with SendGrid
 * 
 * This script tests sending a password reset email using SendGrid.
 * It bypasses the normal password reset flow and directly uses the email service.
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

    // Get email address from command line arguments
    const recipient = process.argv[2];
    if (!recipient) {
      console.error('Please provide an email address as an argument.');
      console.error('Usage: node test-password-reset-sendgrid.js email@example.com');
      process.exit(1);
    }
    
    const sender = 'support@matchpro.ai';
    console.log(`Sending password reset email to ${recipient} from ${sender}...`);

    // Initialize SendGrid client
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    // Generate a fake reset token
    const resetToken = generateFakeToken();
    const resetLink = `https://app.matchpro.ai/reset-password?token=${resetToken}`;
    
    // Email message
    const msg = {
      to: recipient,
      from: sender,
      subject: 'MatchPro - Password Reset Request',
      text: `You have requested to reset your password. Please use the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0066cc;">MatchPro Password Reset</h2>
          <p>You have requested to reset your password. Please click the link below to reset your password:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    };
    
    // Send the email
    const response = await mailService.send(msg);
    console.log('Password reset email sent successfully!');
  } catch (error) {
    console.error('Error sending password reset email:');
    console.error(error);
    if (error.response) {
      console.error('API response:', error.response.body);
    }
  }
}

// Helper function to generate a fake reset token
function generateFakeToken() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

// Run the test
testPasswordResetEmail();