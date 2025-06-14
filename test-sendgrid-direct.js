/**
 * Direct SendGrid API Test
 */

import fetch from 'node-fetch';

async function testSendGridAPI() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY not found');
      return;
    }
    
    console.log('Testing SendGrid API directly...');
    
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('SendGrid API error:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.templates.length} SendGrid templates:`);
    
    data.templates.forEach(template => {
      console.log(`- ${template.name} (ID: ${template.id})`);
      if (template.versions && template.versions.length > 0) {
        console.log(`  Version: ${template.versions[0].name} (ID: ${template.versions[0].id})`);
      }
    });
    
    return data.templates;
  } catch (error) {
    console.error('Error testing SendGrid API:', error);
  }
}

testSendGridAPI();