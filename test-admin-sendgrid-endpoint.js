/**
 * Test Admin SendGrid Endpoint
 * 
 * This script tests the exact admin endpoint that's failing
 * to determine if it's an authentication issue or SendGrid API issue.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testAdminSendGridEndpoint() {
  console.log('\n🔍 TESTING ADMIN SENDGRID ENDPOINT');
  console.log('==================================\n');

  // Test 1: Direct SendGrid API call (should work)
  console.log('1. Testing direct SendGrid API...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   SendGrid API Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Direct API call successful - ${data.templates?.length || 0} templates found`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Direct API call failed: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Direct API call error: ${error.message}`);
  }

  // Test 2: Local admin endpoint (without authentication)
  console.log('\n2. Testing local admin endpoint (no auth)...');
  try {
    const response = await fetch('http://localhost:5000/api/admin/sendgrid/templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Local endpoint status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ 401 Unauthorized - Expected without admin authentication');
    } else if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: ${JSON.stringify(data, null, 2)}`);
    } else {
      const errorText = await response.text();
      console.log(`   Response: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Local endpoint error: ${error.message}`);
  }

  // Test 3: Check if server is running
  console.log('\n3. Testing server health...');
  try {
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET'
    });
    
    console.log(`   Health check status: ${response.status}`);
    
    if (response.ok) {
      console.log('   ✅ Server is running');
    } else {
      console.log('   ⚠️  Server health check failed');
    }
  } catch (error) {
    console.log(`   ❌ Server connection error: ${error.message}`);
    console.log('   💡 Make sure the server is running with: npm run dev');
  }

  console.log('\n📋 DIAGNOSIS:');
  console.log('=============');
  console.log('The 401 error you\'re seeing is likely due to one of these issues:');
  console.log('1. Admin authentication is required but not properly configured');
  console.log('2. Session management issue in the frontend');
  console.log('3. CORS or cookie issues between frontend and backend');
  console.log('4. The SendGrid API key might have been regenerated/changed');
  console.log('\nTo fix this, you should:');
  console.log('• Ensure you\'re logged in as an admin user in the frontend');
  console.log('• Check browser developer tools for cookie/session issues');
  console.log('• Verify the SendGrid API key hasn\'t been rotated');
}

testAdminSendGridEndpoint().catch(console.error);