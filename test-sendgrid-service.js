/**
 * Test SendGrid Service Directly
 */

import { getTemplatesFromSendGrid } from './server/services/sendgridTemplateService.js';

async function testSendGridService() {
  console.log('Testing SendGrid service directly...');
  
  try {
    const templates = await getTemplatesFromSendGrid();
    console.log(`Found ${templates.length} SendGrid templates:`);
    
    templates.forEach(template => {
      console.log(`- ${template.name} (ID: ${template.id})`);
    });
    
    return templates;
  } catch (error) {
    console.error('SendGrid service error:', error);
    throw error;
  }
}

testSendGridService().catch(console.error);