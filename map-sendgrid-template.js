/**
 * Map SendGrid Template to Email Type
 * 
 * This script maps a SendGrid template ID to an email template type in the database.
 * Use this script to quickly assign SendGrid template IDs without using the admin UI.
 * 
 * Usage:
 *   node map-sendgrid-template.js [template_type] [sendgrid_template_id]
 * 
 * Example:
 *   node map-sendgrid-template.js registration_submission d-abcdef123456
 */

import 'dotenv/config';
import { db } from './server/db/index.js';
import { emailTemplates } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Maps a SendGrid template ID to an email template type
 */
async function mapSendGridTemplate(templateType, sendgridTemplateId) {
  try {
    console.log(`Mapping SendGrid template ID ${sendgridTemplateId} to ${templateType}...`);
    
    // Validate the template type exists
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, templateType));
    
    if (!templates || templates.length === 0) {
      console.error(`Template type '${templateType}' not found in the database.`);
      console.log('Please run create-payment-flow-templates.js first to create the templates.');
      return false;
    }
    
    // Update all templates of this type (normally just one)
    const updateResults = await db
      .update(emailTemplates)
      .set({
        sendgridTemplateId: sendgridTemplateId,
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.type, templateType))
      .returning();
    
    if (updateResults && updateResults.length > 0) {
      console.log(`Successfully mapped SendGrid template ID to ${templateType}`);
      console.log(`Updated template: ${updateResults[0].name}`);
      return true;
    } else {
      console.error('Failed to update template mapping, no rows affected.');
      return false;
    }
    
  } catch (error) {
    console.error('Error mapping SendGrid template:', error);
    return false;
  } finally {
    // Close the database connection
    try {
      await db.end();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

/**
 * Main function to handle script execution
 */
async function main() {
  try {
    // Check command line arguments
    if (process.argv.length < 4) {
      console.error('Missing required arguments.');
      console.log('Usage: node map-sendgrid-template.js [template_type] [sendgrid_template_id]');
      console.log('Valid template types:');
      console.log('  - registration_submission');
      console.log('  - team_approved_payment');
      console.log('  - team_rejected');
      console.log('  - team_waitlisted');
      process.exit(1);
    }
    
    const templateType = process.argv[2];
    const sendgridTemplateId = process.argv[3];
    
    // Validate SendGrid template ID format
    if (!sendgridTemplateId.startsWith('d-')) {
      console.warn('Warning: SendGrid template IDs typically start with "d-". Please verify your template ID is correct.');
    }
    
    const success = await mapSendGridTemplate(templateType, sendgridTemplateId);
    
    if (success) {
      console.log('\nTemplate mapping completed successfully!');
      process.exit(0);
    } else {
      console.error('\nFailed to map template.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  }
}

// Run the script
main();