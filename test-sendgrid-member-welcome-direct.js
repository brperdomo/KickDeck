/**
 * Test SendGrid Member Welcome Email - Direct Test
 * 
 * This script tests the member welcome email functionality by
 * directly using the SendGrid API without going through the database.
 */

import dotenv from 'dotenv';
import { MailService } from '@sendgrid/mail';

dotenv.config();

// Check for SendGrid API Key
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

// Initialize SendGrid
const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

async function testMemberWelcomeEmail() {
  try {
    console.log('Starting member welcome email direct test...');
    
    // Get app URL from environment variables or use default
    const appUrl = process.env.APP_URL || 
                 (process.env.REPLIT_DOMAINS ? 
                  `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
                  'https://matchpro.ai');
    
    // Configure test data for email
    const testMember = {
      firstName: 'Test',
      lastName: 'Member',
      email: 'bryan+member@matchpro.ai', // Using a real email for testing
      loginUrl: `${appUrl}/login`,
      appUrl,
      role: 'Team Manager'
    };
    
    // Your SendGrid template ID for member welcome emails
    // We'll try to fetch this from the database or use a hardcoded one for testing
    const templateId = 'd-ad92f82e970c4b8bb98a83d1fbbc11f0';
    const senderEmail = 'support@matchpro.ai';
    
    console.log('Sending member welcome email with test data:', testMember);
    
    // Send email using SendGrid
    const msg = {
      to: testMember.email,
      from: senderEmail,
      templateId: templateId,
      dynamicTemplateData: {
        firstName: testMember.firstName,
        lastName: testMember.lastName,
        email: testMember.email,
        loginUrl: testMember.loginUrl,
        role: testMember.role
      }
    };
    
    await mailService.send(msg);
    
    console.log('Email sent successfully via SendGrid API');
    return true;
  } catch (error) {
    console.error('Error sending member welcome email:', error);
    if (error.response) {
      console.error('SendGrid API error details:', error.response.body);
    }
    return false;
  }
}

// Run the test
testMemberWelcomeEmail()
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