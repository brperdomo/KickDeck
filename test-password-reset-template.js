/**
 * Test Password Reset Template Delivery
 * 
 * This script tests the specific SendGrid dynamic template used for password resets
 * and attempts to identify why emails aren't being delivered.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const apiKey = process.env.SENDGRID_API_KEY;
const templateId = 'd-7eb7ea1c19ca4090a0cefa3a2be75088';
const testEmail = 'bperdomo@zoho.com';

if (!apiKey) {
  console.error('SENDGRID_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Check if the template exists in SendGrid
 */
async function checkTemplateExists() {
  try {
    console.log(`\n=== Checking Template ${templateId} ===`);
    
    const response = await fetch(`https://api.sendgrid.com/v3/templates/${templateId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      console.log('❌ Template does not exist in SendGrid account!');
      console.log('This is why emails aren\'t being delivered.');
      return false;
    } else if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const template = await response.json();
    console.log('✅ Template found in SendGrid:');
    console.log(`   Name: ${template.name}`);
    console.log(`   Subject: ${template.versions?.[0]?.subject || 'N/A'}`);
    console.log(`   Active Version: ${template.versions?.[0]?.active ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error('Error checking template:', error);
    return false;
  }
}

/**
 * Test sending with the problematic template
 */
async function testTemplateDelivery() {
  try {
    console.log(`\n=== Testing Template Delivery ===`);
    
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    const message = {
      to: testEmail,
      from: 'support@matchpro.ai',
      templateId: templateId,
      dynamicTemplateData: {
        username: 'Test User',
        resetUrl: 'https://matchpro.ai/reset-password?token=test123',
        token: 'test123',
        expiryHours: 24
      }
    };
    
    console.log(`Sending test email to ${testEmail}...`);
    console.log(`Template ID: ${templateId}`);
    console.log('Template Data:', JSON.stringify(message.dynamicTemplateData, null, 2));
    
    const response = await mailService.send(message);
    console.log(`✅ API Success: Status ${response[0].statusCode}`);
    console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    
    return true;
  } catch (error) {
    console.log('❌ Template delivery failed:');
    if (error.response && error.response.body) {
      console.log(`   Error: ${JSON.stringify(error.response.body, null, 2)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test with a simple email (no template) to compare
 */
async function testSimpleEmail() {
  try {
    console.log(`\n=== Testing Simple Email (No Template) ===`);
    
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    const message = {
      to: testEmail,
      from: 'support@matchpro.ai',
      subject: 'Password Reset Test - Simple Email',
      text: 'This is a simple password reset email without using a dynamic template.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hello Test User,</p>
          <p>We received a request to reset your password. Click the link below:</p>
          <p><a href="https://matchpro.ai/reset-password?token=test123">Reset Password</a></p>
          <p>This is a test email sent without dynamic templates.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    console.log(`Sending simple test email to ${testEmail}...`);
    
    const response = await mailService.send(message);
    console.log(`✅ API Success: Status ${response[0].statusCode}`);
    console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    
    return true;
  } catch (error) {
    console.log('❌ Simple email delivery failed:');
    if (error.response && error.response.body) {
      console.log(`   Error: ${JSON.stringify(error.response.body, null, 2)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * List all available templates in the account
 */
async function listAllTemplates() {
  try {
    console.log(`\n=== Available Templates in Account ===`);
    
    const response = await fetch('https://api.sendgrid.com/v3/templates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.templates && data.templates.length > 0) {
      console.log('Available templates:');
      data.templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.id} - ${template.name}`);
        if (template.versions && template.versions.length > 0) {
          const activeVersion = template.versions.find(v => v.active);
          if (activeVersion) {
            console.log(`   Subject: ${activeVersion.subject}`);
          }
        }
      });
    } else {
      console.log('No templates found in account');
    }
    
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

/**
 * Main diagnostic function
 */
async function main() {
  console.log('🔍 Password Reset Template Diagnostic');
  console.log('='.repeat(50));
  
  const templateExists = await checkTemplateExists();
  await listAllTemplates();
  
  if (templateExists) {
    const templateWorked = await testTemplateDelivery();
    const simpleWorked = await testSimpleEmail();
    
    console.log('\n=== DIAGNOSIS RESULTS ===');
    
    if (!templateWorked && simpleWorked) {
      console.log('❌ Issue: Dynamic template not working, but simple emails work');
      console.log('SOLUTION: The template may have issues or be missing required data');
    } else if (templateWorked && simpleWorked) {
      console.log('✅ Both template and simple emails sent successfully');
      console.log('The issue may be email delivery filtering or domain reputation');
    } else if (!templateWorked && !simpleWorked) {
      console.log('❌ Issue: Neither template nor simple emails work');
      console.log('This indicates a broader SendGrid configuration problem');
    }
  } else {
    console.log('\n=== DIAGNOSIS RESULTS ===');
    console.log('❌ CRITICAL: Template does not exist in SendGrid account!');
    console.log('');
    console.log('SOLUTION:');
    console.log('1. Either create the missing template in SendGrid, OR');
    console.log('2. Update the database to use an existing template, OR');
    console.log('3. Remove the sendgrid_template_id to use local template rendering');
    console.log('');
    console.log('The password reset email will continue to fail until this is resolved.');
    
    await testSimpleEmail();
  }
}

main().catch(console.error);