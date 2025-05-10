/**
 * Test Payment Flow Email Templates Script
 * 
 * This script helps test and verify the SendGrid template integration for the new
 * payment flow email templates by sending test emails through SendGrid.
 * 
 * Usage:
 *   node test-payment-flow-templates.js [template_type] [recipient_email]
 *   
 *   template_type options:
 *   - 'submission' - Test registration submission template
 *   - 'approved' - Test approved with payment template
 *   - 'rejected' - Test rejected template
 *   - 'waitlist' - Test waitlist template
 *   - 'all' - Test all templates (will send 4 emails)
 */

import 'dotenv/config';
import { db } from './server/db/index.js';
import { emailTemplates } from './server/db/schema.js';
import { eq } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';

// Set up SendGrid API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set. Please set it before running this script.');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Get an email template by type
 * @param {string} type - Template type
 * @returns {Promise<Object|null>} - Email template or null if not found
 */
async function getEmailTemplate(type) {
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, type));
    
    return templates.length > 0 ? templates[0] : null;
  } catch (error) {
    console.error(`Error fetching ${type} template:`, error);
    return null;
  }
}

/**
 * Sends a test email using a SendGrid dynamic template
 */
async function sendTestEmail(templateType, recipientEmail, templateId, sampleData) {
  try {
    console.log(`Sending test email (${templateType}) to ${recipientEmail}`);
    
    if (!templateId) {
      console.error(`No SendGrid template ID provided for ${templateType}. Make sure to set it up in your admin dashboard.`);
      return false;
    }
    
    const msg = {
      to: recipientEmail,
      from: 'support@matchpro.ai', // Replace with your verified sender
      templateId: templateId,
      dynamicTemplateData: sampleData
    };
    
    // Log the template data for verification
    console.log('Dynamic Template Data:', JSON.stringify(sampleData, null, 2));
    
    // Send the email
    const response = await sgMail.send(msg);
    console.log(`Email sent with template ID ${templateId}, status: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    if (error.response) {
      console.error('SendGrid API error response:', error.response.body);
    }
    return false;
  }
}

/**
 * Generate sample data for test templates
 */
function generateSampleData(templateType) {
  const currentDate = new Date();
  
  // Base sample data shared by all templates
  const baseData = {
    submitterName: 'John Coach',
    submitterEmail: 'coach@example.com',
    teamName: 'Test Tigers',
    eventName: 'Summer Soccer Tournament 2025',
    ageGroup: 'U12 Boys',
    registrationDate: currentDate.toLocaleDateString(),
    clubName: 'Westside Soccer Club',
    totalAmount: 195.00,
    selectedFees: [
      { name: 'Team Registration Fee', amount: 150.00 },
      { name: 'Field Maintenance Fee', amount: 25.00 },
      { name: 'Insurance Fee', amount: 20.00 }
    ],
    loginLink: 'https://app.matchpro.ai/dashboard',
    supportEmail: 'support@matchpro.ai',
    branding: {
      primaryColor: '#2C5282',
      logoUrl: 'https://app.matchpro.ai/assets/logo.png'
    },
    organizationName: 'MatchPro Sports',
    currentYear: currentDate.getFullYear().toString(),
    formatCurrency: (amount) => `$${amount.toFixed(2)}`
  };
  
  // Template-specific data
  switch (templateType) {
    case 'registration_submission':
      return {
        ...baseData,
        setupIntentId: 'seti_1234567890',
        cardBrand: 'Visa',
        cardLastFour: '4242'
      };
      
    case 'team_approved_payment':
      return {
        ...baseData,
        paymentDate: currentDate.toLocaleDateString(),
        paymentId: 'pi_1234567890',
        receiptNumber: 'REC-2025-12345',
        cardBrand: 'Mastercard',
        cardLastFour: '8765'
      };
      
    case 'team_rejected':
      return {
        ...baseData,
        rejectionReason: 'The age group is already at capacity with teams that better match our competitive balance requirements.',
        setupIntentId: 'seti_1234567890',
        cardBrand: 'Visa',
        cardLastFour: '4242',
        eventsListUrl: 'https://app.matchpro.ai/events'
      };
      
    case 'team_waitlisted':
      return {
        ...baseData,
        setupIntentId: 'seti_1234567890',
        cardBrand: 'Visa',
        cardLastFour: '4242',
        waitlistPosition: '3',
        waitlistNote: 'Your team will be considered if space becomes available in the U12 Boys division.'
      };
      
    default:
      return baseData;
  }
}

/**
 * Test a specific template type
 */
async function testTemplate(templateType, recipientEmail) {
  // Map argument template types to actual template types in database
  const templateTypeMap = {
    'submission': 'registration_submission',
    'approved': 'team_approved_payment',
    'rejected': 'team_rejected',
    'waitlist': 'team_waitlisted'
  };
  
  const dbTemplateType = templateTypeMap[templateType] || templateType;
  
  console.log(`Testing ${dbTemplateType} email template...`);
  
  // Get the template from the database
  const template = await getEmailTemplate(dbTemplateType);
  
  if (!template) {
    console.error(`Template with type '${dbTemplateType}' not found in the database.`);
    console.log('Please run create-payment-flow-templates.js first to create the templates.');
    return false;
  }
  
  // Check if SendGrid template ID is set
  if (!template.sendgridTemplateId) {
    console.error(`No SendGrid template ID set for '${template.name}' (${dbTemplateType}).`);
    console.log('Please set up the SendGrid template ID in the admin dashboard first.');
    return false;
  }
  
  // Generate sample data for this template type
  const sampleData = generateSampleData(dbTemplateType);
  
  // Send test email
  return await sendTestEmail(
    dbTemplateType,
    recipientEmail,
    template.sendgridTemplateId,
    sampleData
  );
}

/**
 * Main function to handle script execution
 */
async function main() {
  try {
    // Check command line arguments
    if (process.argv.length < 4) {
      console.error('Missing required arguments.');
      console.log('Usage: node test-payment-flow-templates.js [template_type] [recipient_email]');
      console.log('  template_type: submission, approved, rejected, waitlist, or all');
      process.exit(1);
    }
    
    const templateType = process.argv[2].toLowerCase();
    const recipientEmail = process.argv[3];
    
    // Validate email address
    if (!recipientEmail.includes('@')) {
      console.error('Invalid email address provided.');
      process.exit(1);
    }
    
    console.log(`Using recipient email: ${recipientEmail}`);
    
    // Determine which templates to test
    if (templateType === 'all') {
      console.log('Testing all payment flow email templates...');
      
      const results = await Promise.all([
        testTemplate('submission', recipientEmail),
        testTemplate('approved', recipientEmail),
        testTemplate('rejected', recipientEmail),
        testTemplate('waitlist', recipientEmail)
      ]);
      
      const successCount = results.filter(r => r).length;
      console.log(`\nTest complete: ${successCount} of 4 templates sent successfully.`);
      
    } else if (['submission', 'approved', 'rejected', 'waitlist'].includes(templateType)) {
      // Test a single template
      const success = await testTemplate(templateType, recipientEmail);
      
      if (success) {
        console.log(`\nTest email for ${templateType} template sent successfully to ${recipientEmail}`);
      } else {
        console.error(`\nFailed to send test email for ${templateType} template.`);
        process.exit(1);
      }
      
    } else {
      console.error(`Invalid template type: ${templateType}`);
      console.log('Valid options are: submission, approved, rejected, waitlist, or all');
      process.exit(1);
    }
    
    console.log('\nDone. Check your email inbox to verify the email was received and formatted correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    try {
      await db.end();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the script
main();