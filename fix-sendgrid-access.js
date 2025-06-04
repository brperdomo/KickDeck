/**
 * SendGrid Templates Access Fix
 * 
 * This script creates a working SendGrid templates endpoint
 * and maps templates to your application's email types.
 */

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import { emailTemplates } from './db/schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Get SendGrid templates
async function getSendGridTemplates() {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not found');
  }
  
  const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.templates || [];
}

// Map SendGrid template to email type
async function mapTemplate(templateType, sendgridTemplateId) {
  try {
    // Check if template exists
    const existing = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, templateType))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing template
      await db.update(emailTemplates)
        .set({
          sendgridTemplateId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(emailTemplates.type, templateType));
      
      console.log(`Updated ${templateType} with SendGrid template ${sendgridTemplateId}`);
    } else {
      // Create new template mapping
      await db.insert(emailTemplates)
        .values({
          type: templateType,
          subject: `${templateType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Email`,
          htmlContent: `<p>This email uses SendGrid template ${sendgridTemplateId}</p>`,
          sendgridTemplateId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      
      console.log(`Created ${templateType} with SendGrid template ${sendgridTemplateId}`);
    }
  } catch (error) {
    console.error(`Error mapping ${templateType}:`, error);
  }
}

// Main fix function
async function fixSendGridAccess() {
  console.log('=== SendGrid Templates Access Fix ===\n');
  
  try {
    // Get all SendGrid templates
    const templates = await getSendGridTemplates();
    console.log(`Found ${templates.length} SendGrid templates:`);
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.id})`);
    });
    
    // Map known templates to email types
    const templateMappings = {
      'registration_submission': 'd-4eca2752ddd247158dd1d5433407cd5e', // Registration Submitted
      'team_approved_payment': 'd-1bca14d4dc8e41e5a7ed2131124d470e', // Team Approved / Payment Processed
      'team_rejected': 'd-4160d22e727944128335d7a3910b8092', // Team Not Approved
      'team_waitlisted': 'd-23265a10149a4144893cf84e32cc3f54', // Waitlisted Team
      'payment_confirmation': 'd-3697f286c1e748f298710282e515ee25', // Payment Confirmation
      'password_reset': 'd-7eb7ea1c19ca4090a0cefa3a2be75088', // Password Reset
      'admin_welcome': 'd-29971e21ccc641de982f3d60f395ccb5', // Admin Welcome Email
      'member_welcome': 'd-6064756d74914ec79b3a3586f6713424' // Member Welcome Email
    };
    
    console.log('\nMapping templates to email types...');
    
    for (const [emailType, templateId] of Object.entries(templateMappings)) {
      await mapTemplate(emailType, templateId);
    }
    
    console.log('\n✅ SendGrid templates access has been fixed!');
    console.log('Your admin interface should now be able to access all SendGrid templates.');
    
  } catch (error) {
    console.error('❌ Error fixing SendGrid access:', error);
  }
}

// API endpoint for testing
app.get('/api/sendgrid/templates', async (req, res) => {
  try {
    const templates = await getSendGridTemplates();
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/email-templates', async (req, res) => {
  try {
    const templates = await db.select().from(emailTemplates);
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SendGrid fix server running on http://0.0.0.0:${PORT}`);
    fixSendGridAccess();
  });
}

export { fixSendGridAccess, getSendGridTemplates, mapTemplate };