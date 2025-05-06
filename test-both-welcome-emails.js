/**
 * Test Both Welcome Email Templates
 * 
 * This script tests sending both member and admin welcome emails
 * to verify they are correctly configured with SendGrid.
 * 
 * Usage:
 *   node test-both-welcome-emails.js recipient@example.com
 */

import dotenv from 'dotenv';
import { MailService } from '@sendgrid/mail';

// Load environment variables
dotenv.config();

// Constants
const DEFAULT_EMAIL = 'bryan@matchpro.ai';

// Main function to run tests
async function testWelcomeEmails() {
  try {
    console.log('Starting welcome email tests...');
    
    // Use command line argument for recipient email or use default
    const recipientEmail = process.argv[2] || DEFAULT_EMAIL;
    
    // Test member welcome email
    console.log(`\n===== Testing Member Welcome Email =====`);
    await sendWelcomeEmail('welcome', recipientEmail);
    
    // Test admin welcome email
    console.log(`\n===== Testing Admin Welcome Email =====`);
    await sendWelcomeEmail('admin_welcome', recipientEmail);
    
    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Get email provider configuration
async function getEmailProvider() {
  try {
    console.log('Looking up SendGrid email provider in environment variables...');
    
    // Check for SendGrid API key in environment
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      console.log('Found SendGrid API key in environment variables');
      
      // Return SendGrid provider config
      return {
        id: 'sendgrid-env',
        name: 'SendGrid (Environment)',
        type: 'sendgrid',
        settings: {
          apiKey: sendgridApiKey
        },
        isDefault: true
      };
    }
    
    console.log('No SendGrid API key found in environment variables');
    throw new Error('No email provider found');
  } catch (error) {
    console.error('Error getting email provider:', error);
    throw error;
  }
}

// Get email template by type
async function getEmailTemplate(type) {
  try {
    console.log(`Looking up ${type} template...`);
    
    // Hard-coded test template for testing purposes
    // In production, this would come from the database
    return {
      id: type === 'welcome' ? 1 : 2,
      name: type === 'welcome' ? 'Welcome Email' : 'Admin Welcome Email',
      subject: type === 'welcome' ? 'Welcome to MatchPro' : 'Your Admin Account at MatchPro',
      type: type,
      body: type === 'welcome' 
        ? 'Welcome {{firstName}} {{lastName}}! Your account has been created. <a href="{{loginUrl}}">Login here</a>'
        : 'Welcome Admin {{firstName}} {{lastName}}! Your admin account has been created. <a href="{{loginUrl}}">Login here</a>',
      sendgridTemplateId: 'd-ad92f82e970c4b8bb98a83d1fbbc11f0',
      senderEmail: 'support@matchpro.ai'
    };
  } catch (error) {
    console.error(`Error getting ${type} template:`, error);
    throw error;
  }
}

// Send welcome email
async function sendWelcomeEmail(type, recipientEmail) {
  try {
    console.log(`Sending ${type} email to ${recipientEmail}...`);
    
    // Get email provider
    const provider = await getEmailProvider();
    console.log('Using provider:', provider.name);
    
    // Get email template
    const template = await getEmailTemplate(type);
    console.log('Using template:', template.name);
    
    // Get application URL
    const appUrl = process.env.APP_URL || 
                 (process.env.REPLIT_DOMAINS ? 
                  `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
                  'https://matchpro.ai');
    
    // Prepare template data
    const templateData = {
      firstName: 'Test',
      lastName: type === 'welcome' ? 'Member' : 'Admin',
      email: recipientEmail,
      loginUrl: `${appUrl}/login`,
      role: type === 'welcome' ? 'Team Manager' : 'Administrator'
    };
    
    console.log('Template data:', templateData);
    
    // Initialize SendGrid
    const mailService = new MailService();
    mailService.setApiKey(provider.settings.apiKey);
    
    // Prepare email message
    const msg = {
      to: recipientEmail,
      from: template.senderEmail,
      templateId: template.sendgridTemplateId,
      dynamicTemplateData: templateData
    };
    
    console.log('Sending email...');
    await mailService.send(msg);
    console.log(`${type} email sent successfully`);
    
    return true;
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    if (error.response) {
      console.error('SendGrid API error details:', error.response.body);
    }
    throw error;
  }
}

// Run tests
testWelcomeEmails()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });