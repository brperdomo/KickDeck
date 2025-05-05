/**
 * Set up Welcome Email Template with SendGrid
 * 
 * This script updates the welcome email template to use the SendGrid provider
 * and the same sender email as the password reset template.
 */

const { db } = require('./server/db/index');
const { emailTemplates } = require('./server/db/schema/emailTemplates');
const { emailTemplateRouting } = require('./server/db/schema/emailTemplateRouting');
const { emailProviderSettings } = require('./server/db/schema');
const { eq, and } = require('drizzle-orm');

async function setupWelcomeEmailTemplate() {
  try {
    console.log('Setting up welcome email template with SendGrid...');
    
    // First, find the SendGrid provider
    const sendGridProviders = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'sendgrid'),
        eq(emailProviderSettings.isActive, true)
      ));
    
    if (!sendGridProviders.length) {
      throw new Error('No active SendGrid provider found. Please set up SendGrid first.');
    }
    
    // Use the default provider if there are multiple
    const sendGridProvider = sendGridProviders.find(p => p.isDefault) || sendGridProviders[0];
    console.log(`Using SendGrid provider: ${sendGridProvider.providerName} (ID: ${sendGridProvider.id})`);
    
    // Get the welcome email template
    const [welcomeTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'welcome'));
    
    if (!welcomeTemplate) {
      console.error('Welcome email template not found. Please run create-email-templates.js first.');
      return;
    }
    
    console.log(`Found welcome email template: ${welcomeTemplate.name} (ID: ${welcomeTemplate.id})`);
    
    // Check if routing exists
    const [existingRouting] = await db
      .select()
      .from(emailTemplateRouting)
      .where(eq(emailTemplateRouting.templateType, 'welcome'));
    
    if (existingRouting) {
      // Update existing routing
      console.log(`Updating existing welcome email routing (ID: ${existingRouting.id})...`);
      await db
        .update(emailTemplateRouting)
        .set({
          providerId: sendGridProvider.id,
          fromEmail: 'support@matchpro.ai', // Use the same sender as password reset
          fromName: 'MatchPro',
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(emailTemplateRouting.id, existingRouting.id));
      
      console.log('Welcome email routing updated successfully.');
    } else {
      // Create new routing
      console.log('Creating new welcome email routing...');
      await db
        .insert(emailTemplateRouting)
        .values({
          templateType: 'welcome',
          providerId: sendGridProvider.id,
          fromEmail: 'support@matchpro.ai', // Use the same sender as password reset
          fromName: 'MatchPro',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      console.log('Welcome email routing created successfully.');
    }
    
    // Update the template sender if needed
    if (welcomeTemplate.senderEmail !== 'support@matchpro.ai') {
      await db
        .update(emailTemplates)
        .set({
          senderEmail: 'support@matchpro.ai',
          senderName: 'MatchPro',
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, welcomeTemplate.id));
      
      console.log('Welcome email template sender updated to support@matchpro.ai');
    }
    
    console.log('Welcome email setup completed successfully!');
  } catch (error) {
    console.error('Error setting up welcome email template:', error);
  }
}

setupWelcomeEmailTemplate();