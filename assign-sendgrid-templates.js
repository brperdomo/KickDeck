/**
 * Assign SendGrid Templates to Email Types
 * 
 * This script allows you to list your existing SendGrid dynamic templates 
 * and assign them to specific email types in your application.
 * 
 * Usage:
 *   node assign-sendgrid-templates.js list       - Lists all SendGrid templates
 *   node assign-sendgrid-templates.js assign     - Interactive tool to assign templates
 */

import readline from 'readline';
import { getTemplatesFromSendGrid, mapSendGridTemplateToEmailType, listEmailTemplatesWithSendGridMapping } from './server/services/sendgridTemplateService.js';

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise-based readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Lists all SendGrid dynamic templates
 */
async function listTemplates() {
  try {
    console.log('\n=== SendGrid Dynamic Templates ===\n');
    
    const templates = await getTemplatesFromSendGrid();
    
    if (templates.length === 0) {
      console.log('No dynamic templates found in your SendGrid account.\n');
      console.log('Please create dynamic templates in SendGrid first.\n');
      return;
    }
    
    console.log(`Found ${templates.length} dynamic templates:\n`);
    
    templates.forEach((template, index) => {
      const activeVersion = template.versions?.[0];
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Active Version: ${activeVersion?.id || 'None'}`);
      console.log(`   Subject Line: ${activeVersion?.subject || 'Not available'}`);
      console.log('');
    });
    
    console.log('You can assign these templates to email types with:');
    console.log('node assign-sendgrid-templates.js assign\n');
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

/**
 * Lists all application email templates with their SendGrid mappings
 */
async function listAppTemplates() {
  try {
    console.log('\n=== Application Email Templates ===\n');
    
    const templates = await listEmailTemplatesWithSendGridMapping();
    
    if (templates.length === 0) {
      console.log('No email templates found in your application.\n');
      return;
    }
    
    console.log(`Found ${templates.length} application email templates:\n`);
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.type})`);
      console.log(`   ID: ${template.id}`);
      console.log(`   SendGrid Template ID: ${template.sendgridTemplateId || 'Not assigned'}`);
      console.log(`   Active: ${template.isActive ? 'Yes' : 'No'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error listing application templates:', error);
  }
}

/**
 * Interactive tool to assign SendGrid templates to application email types
 */
async function assignTemplates() {
  try {
    // Step 1: List SendGrid templates
    console.log('\n=== Assign SendGrid Templates ===\n');
    console.log('Loading SendGrid templates...');
    
    const sendGridTemplates = await getTemplatesFromSendGrid();
    
    if (sendGridTemplates.length === 0) {
      console.log('\nNo dynamic templates found in your SendGrid account.');
      console.log('Please create dynamic templates in SendGrid first.\n');
      return;
    }
    
    console.log(`\nFound ${sendGridTemplates.length} SendGrid templates.`);
    
    // Step 2: List application templates
    console.log('\nLoading application email templates...');
    
    const appTemplates = await listEmailTemplatesWithSendGridMapping();
    
    if (appTemplates.length === 0) {
      console.log('\nNo email templates found in your application.\n');
      return;
    }
    
    console.log(`\nFound ${appTemplates.length} application templates.`);
    
    // Step 3: Show existing mappings
    console.log('\n=== Current Template Mappings ===\n');
    
    appTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.type})`);
      console.log(`   SendGrid Template ID: ${template.sendgridTemplateId || 'Not assigned'}`);
    });
    
    // Step 4: Interactive assignment
    console.log('\n=== Assign Templates ===\n');
    console.log('Enter the number of the application template you want to assign a SendGrid template to,');
    console.log('or enter "q" to quit.');
    
    while (true) {
      const appTemplateInput = await question('\nApplication template number (or q to quit): ');
      
      if (appTemplateInput.toLowerCase() === 'q') {
        break;
      }
      
      const appTemplateIndex = parseInt(appTemplateInput) - 1;
      
      if (isNaN(appTemplateIndex) || appTemplateIndex < 0 || appTemplateIndex >= appTemplates.length) {
        console.log('Invalid template number. Please try again.');
        continue;
      }
      
      const selectedAppTemplate = appTemplates[appTemplateIndex];
      
      console.log(`\nYou selected: ${selectedAppTemplate.name} (${selectedAppTemplate.type})`);
      console.log('\nAvailable SendGrid templates:');
      
      sendGridTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name} (${template.id})`);
      });
      
      const sendGridTemplateInput = await question('\nSendGrid template number (or 0 to remove mapping): ');
      
      if (sendGridTemplateInput === '0') {
        await mapSendGridTemplateToEmailType(selectedAppTemplate.type, null);
        console.log(`\nRemoved SendGrid template mapping from ${selectedAppTemplate.name}.`);
        continue;
      }
      
      const sendGridTemplateIndex = parseInt(sendGridTemplateInput) - 1;
      
      if (isNaN(sendGridTemplateIndex) || sendGridTemplateIndex < 0 || sendGridTemplateIndex >= sendGridTemplates.length) {
        console.log('Invalid template number. Please try again.');
        continue;
      }
      
      const selectedSendGridTemplate = sendGridTemplates[sendGridTemplateIndex];
      
      // Confirm the assignment
      const confirm = await question(`\nAssign SendGrid template "${selectedSendGridTemplate.name}" to "${selectedAppTemplate.name}"? (y/n): `);
      
      if (confirm.toLowerCase() === 'y') {
        await mapSendGridTemplateToEmailType(selectedAppTemplate.type, selectedSendGridTemplate.id);
        console.log(`\nSuccessfully assigned SendGrid template to ${selectedAppTemplate.name}.`);
        
        // Update the local app templates array to reflect the change
        appTemplates[appTemplateIndex].sendgridTemplateId = selectedSendGridTemplate.id;
      }
    }
    
    console.log('\nTemplate assignment complete. The changes have been saved to the database.\n');
  } catch (error) {
    console.error('Error assigning templates:', error);
  }
}

/**
 * Main function to handle command line arguments
 */
async function main() {
  try {
    const command = process.argv[2]?.toLowerCase() || 'help';
    
    switch (command) {
      case 'list':
        await listTemplates();
        await listAppTemplates();
        break;
      
      case 'assign':
        await assignTemplates();
        break;
      
      case 'help':
      default:
        console.log('\nSendGrid Template Assignment Tool\n');
        console.log('Usage:');
        console.log('  node assign-sendgrid-templates.js list     - Lists all SendGrid templates');
        console.log('  node assign-sendgrid-templates.js assign   - Interactive tool to assign templates\n');
        break;
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main();