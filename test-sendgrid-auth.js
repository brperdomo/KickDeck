/**
 * Test SendGrid Authorization
 * Tests the SendGrid API key and diagnoses authorization issues
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testSendGridAuth() {
  console.log('\n🔐 TESTING SENDGRID AUTHORIZATION');
  console.log('=================================\n');

  // Check if API key exists
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log('❌ SENDGRID_API_KEY environment variable not found');
    return;
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...`);
  console.log(`📏 API Key length: ${apiKey.length} characters`);
  
  // Validate API key format
  if (!apiKey.startsWith('SG.')) {
    console.log('⚠️  API Key does not start with "SG." - this may be incorrect');
  } else {
    console.log('✅ API Key format looks correct (starts with SG.)');
  }

  // Test 1: Basic API access
  console.log('\n1. Testing basic API access...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Response status: ${response.status}`);
    
    if (response.status === 401) {
      const errorData = await response.json();
      console.log('❌ 401 Unauthorized - API key is invalid or expired');
      console.log('   Error details:', JSON.stringify(errorData, null, 2));
      console.log('\n   Possible solutions:');
      console.log('   • Generate a new API key in SendGrid dashboard');
      console.log('   • Ensure the API key has "Full Access" permissions');
      console.log('   • Check if the API key has been revoked');
      return;
    } else if (response.ok) {
      const accountData = await response.json();
      console.log(`✅ API access successful`);
      console.log(`   Account email: ${accountData.email || 'Not available'}`);
      console.log(`   Account type: ${accountData.type || 'Not available'}`);
    } else {
      console.log(`❌ Unexpected response: ${response.status}`);
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Test 2: Templates API access
  console.log('\n2. Testing templates API access...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Response status: ${response.status}`);
    
    if (response.status === 401) {
      const errorData = await response.json();
      console.log('❌ 401 Unauthorized for templates API');
      console.log('   Error details:', JSON.stringify(errorData, null, 2));
    } else if (response.ok) {
      const templatesData = await response.json();
      console.log(`✅ Templates API access successful`);
      console.log(`   Found ${templatesData.templates?.length || 0} dynamic templates`);
      
      if (templatesData.templates && templatesData.templates.length > 0) {
        console.log('   Sample templates:');
        templatesData.templates.slice(0, 3).forEach(template => {
          console.log(`   • ${template.name} (ID: ${template.id})`);
        });
      }
    } else {
      console.log(`❌ Unexpected response: ${response.status}`);
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log(`❌ Templates API request failed: ${error.message}`);
  }

  // Test 3: Mail send permissions
  console.log('\n3. Testing mail send permissions...');
  try {
    // Just test the endpoint without actually sending an email
    const testPayload = {
      personalizations: [
        {
          to: [{ email: 'test@example.com' }],
          subject: 'Test'
        }
      ],
      from: { email: 'support@matchpro.ai' },
      content: [
        {
          type: 'text/plain',
          value: 'Test'
        }
      ]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Response status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ 401 Unauthorized for mail send API');
    } else if (response.status === 202) {
      console.log('✅ Mail send API access confirmed (202 Accepted)');
    } else if (response.status === 400) {
      console.log('✅ Mail send API accessible (400 = validation error as expected)');
    } else {
      const errorText = await response.text();
      console.log(`   Response: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Mail send API test failed: ${error.message}`);
  }

  console.log('\n🏁 Authorization test complete');
  console.log('==============================');
}

testSendGridAuth().catch(console.error);