/**
 * Test Welcome Emails with SendGrid Dynamic Templates
 * 
 * This script tests sending welcome emails using SendGrid dynamic templates.
 * It will use the dynamic template IDs assigned to your email templates.
 * 
 * Usage:
 *   node test-welcome-with-dynamic-template.js your-email@example.com
 */

import { sendTemplatedEmail } from './server/services/emailService.js';
import { db } from './server/db/index.js';
import { emailTemplates } from './server/db/schema/emailTemplates.js';
import { eq } from 'drizzle-orm';

async function testWelcomeEmails() {
  try {
    const testEmail = process.argv[2];
    
    if (!testEmail) {
      console.error('Error: Test email address is required');
      console.log('Usage: node test-welcome-with-dynamic-template.js your-email@example.com');
      process.exit(1);
    }
    
    console.log('\n=== Testing Welcome Emails with SendGrid Dynamic Templates ===\n');
    
    // Check if templates have SendGrid template IDs assigned
    console.log('Checking template configurations...');
    
    const [memberTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'welcome'));
    
    const [adminTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'admin_welcome'));
    
    console.log('\nTemplate configurations:');
    console.log(`1. Member Welcome: ${memberTemplate.name}`);
    console.log(`   SendGrid Template ID: ${memberTemplate.sendgrid_template_id || 'Not assigned'}`);
    
    console.log(`2. Admin Welcome: ${adminTemplate?.name || 'Not found'}`);
    console.log(`   SendGrid Template ID: ${adminTemplate?.sendgrid_template_id || 'Not assigned'}`);
    
    // Test member welcome email
    console.log('\nSending member welcome email...');
    
    await sendTemplatedEmail(
      testEmail,
      'welcome',
      {
        firstName: 'Test',
        lastName: 'Member',
        email: testEmail,
        username: 'testmember',
        loginUrl: 'https://matchpro.ai/login'
      }
    );
    
    console.log('Member welcome email sent successfully!');
    
    // Test admin welcome email if it exists
    if (adminTemplate) {
      console.log('\nSending admin welcome email...');
      
      await sendTemplatedEmail(
        testEmail,
        'admin_welcome',
        {
          firstName: 'Test',
          lastName: 'Admin',
          email: testEmail,
          username: 'testadmin',
          role: 'Tournament Administrator',
          loginUrl: 'https://matchpro.ai/login'
        }
      );
      
      console.log('Admin welcome email sent successfully!');
    }
    
    console.log('\n=== Testing Complete ===');
    console.log('Check your inbox for the welcome emails.');
    console.log('Note: It may take a few minutes for the emails to arrive.');
    
    if (!memberTemplate.sendgrid_template_id && (!adminTemplate || !adminTemplate.sendgrid_template_id)) {
      console.log('\nImportant: No SendGrid template IDs are assigned to your email templates.');
      console.log('To assign SendGrid templates, run:');
      console.log('node assign-sendgrid-templates.js assign');
    }
  } catch (error) {
    console.error('Error sending test welcome emails:', error);
  }
}

testWelcomeEmails();