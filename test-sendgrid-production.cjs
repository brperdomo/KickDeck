/**
 * SendGrid Production API Key Test
 * 
 * This script tests the current SendGrid API key to identify why
 * it's returning 401 errors in production.
 */

const https = require('https');

async function testSendGridAPIKey() {
  console.log('=== SendGrid Production API Key Test ===\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No SENDGRID_API_KEY found in environment variables');
    return;
  }
  
  console.log(`1. API Key Check:`);
  console.log(`   Key format: ${apiKey.startsWith('SG.') ? 'Valid format' : 'Invalid format'}`);
  console.log(`   Key length: ${apiKey.length} characters`);
  console.log(`   Key prefix: ${apiKey.substring(0, 10)}...`);
  
  // Test 1: Account Info
  console.log('\n2. Testing Account Access...');
  try {
    const accountResponse = await makeRequest('/v3/user/account', apiKey);
    if (accountResponse.success) {
      console.log('   ✅ Account access successful');
      console.log(`   Account type: ${accountResponse.data.type || 'Unknown'}`);
      console.log(`   Company: ${accountResponse.data.company || 'Not set'}`);
    } else {
      console.log('   ❌ Account access failed');
      console.log(`   Status: ${accountResponse.status}`);
      console.log(`   Error: ${accountResponse.error}`);
    }
  } catch (error) {
    console.log('   ❌ Account test failed:', error.message);
  }
  
  // Test 2: API Key Info
  console.log('\n3. Testing API Key Info...');
  try {
    const keyResponse = await makeRequest('/v3/api_keys', apiKey);
    if (keyResponse.success) {
      console.log('   ✅ API key info accessible');
      console.log(`   Found ${keyResponse.data.result?.length || 0} API keys in account`);
    } else {
      console.log('   ❌ API key info failed');
      console.log(`   Status: ${keyResponse.status}`);
      console.log(`   Error: ${keyResponse.error}`);
    }
  } catch (error) {
    console.log('   ❌ API key test failed:', error.message);
  }
  
  // Test 3: Templates Access
  console.log('\n4. Testing Templates Access...');
  try {
    const templatesResponse = await makeRequest('/v3/templates?generations=dynamic', apiKey);
    if (templatesResponse.success) {
      console.log('   ✅ Templates access successful');
      console.log(`   Found ${templatesResponse.data.templates?.length || 0} templates`);
    } else {
      console.log('   ❌ Templates access failed');
      console.log(`   Status: ${templatesResponse.status}`);
      console.log(`   Error: ${templatesResponse.error}`);
      
      if (templatesResponse.status === 401) {
        console.log('\n   🔍 401 Error Analysis:');
        console.log('   - API key may be expired or revoked');
        console.log('   - API key may lack necessary permissions');
        console.log('   - API key format may be incorrect');
      }
    }
  } catch (error) {
    console.log('   ❌ Templates test failed:', error.message);
  }
  
  // Test 4: Mail Send Permission
  console.log('\n5. Testing Mail Send Permission...');
  try {
    const mailResponse = await makeRequest('/v3/mail/send', apiKey, 'POST', {
      personalizations: [{ to: [{ email: 'test@example.com' }] }],
      from: { email: 'test@example.com' },
      subject: 'Test',
      content: [{ type: 'text/plain', value: 'Test' }]
    });
    
    // We expect this to fail with a specific error, not 401
    if (mailResponse.status === 401) {
      console.log('   ❌ Mail send permission denied (401)');
    } else if (mailResponse.status === 400) {
      console.log('   ✅ Mail send permission exists (400 validation error expected)');
    } else {
      console.log(`   ⚠️  Unexpected response: ${mailResponse.status}`);
    }
  } catch (error) {
    console.log('   ❌ Mail send test failed:', error.message);
  }
  
  console.log('\n=== Diagnosis Summary ===');
  console.log('If all tests show 401 errors:');
  console.log('- The API key is invalid, expired, or revoked');
  console.log('- Generate a new API key in SendGrid dashboard');
  console.log('- Ensure the new key has Full Access permissions');
  console.log('\nIf some tests pass but templates fail:');
  console.log('- The API key lacks Templates permissions');
  console.log('- Update the API key permissions in SendGrid');
  console.log('\nNext steps:');
  console.log('1. Check SendGrid dashboard for API key status');
  console.log('2. Generate new API key if needed');
  console.log('3. Update SENDGRID_API_KEY environment variable');
}

function makeRequest(path, apiKey, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsedData,
            error: parsedData.errors || data
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            data: {},
            error: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        status: 0,
        data: {},
        error: error.message
      });
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Run the test
testSendGridAPIKey().catch(console.error);