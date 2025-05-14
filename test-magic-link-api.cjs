/**
 * Test Magic Link API functionality
 * 
 * This script tests the magic link API endpoints:
 * 1. Request a magic link
 * 2. Verify a magic link token
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'markeconnelly@gmail.com'; // Use an existing user email
// For testing, we'll use a known token from the database
let savedToken = '856ffb82c19fbb44c3e536a44d322529529450df409860904160d646d1c15860';

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

// Test requesting a magic link
async function testRequestMagicLink() {
  console.log('Testing Request Magic Link API...');
  
  const payload = {
    email: TEST_EMAIL,
    userAgent: 'Test User Agent',
    ipAddress: '127.0.0.1'
  };
  
  const { status, data } = await apiRequest('/auth/magic-link/request', 'POST', payload);
  
  if (status === 200 && data.success) {
    console.log('✅ Magic link request successful');
    
    // For testing only - we retrieve the token directly from the testing endpoint
    console.log('Retrieving the latest token from testing endpoint...');
    try {
      const testResponse = await apiRequest('/test/latest-magic-link-token?email=' + TEST_EMAIL, 'GET');
      if (testResponse.status === 200 && testResponse.data.token) {
        savedToken = testResponse.data.token;
        console.log(`Retrieved token: ${savedToken.substring(0, 8)}...`);
        return true;
      } else {
        console.error('❌ Failed to retrieve token:', testResponse.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error retrieving token:', error);
      return false;
    }
  } else {
    console.error('❌ Magic link request failed:', data);
    return false;
  }
}

// Test verifying a magic link token
async function testVerifyMagicLink() {
  console.log('\nTesting Verify Magic Link API...');
  
  if (!savedToken) {
    console.error('❌ No token available to verify');
    return false;
  }
  
  const { status, data } = await apiRequest(`/auth/magic-link/verify?token=${savedToken}`, 'GET');
  
  if (status === 200 && data.success) {
    console.log('✅ Magic link verification successful');
    console.log(`User authenticated: ${data.user.id}`);
    console.log(`Redirect to: ${data.redirectTo}`);
    return true;
  } else {
    console.error('❌ Magic link verification failed:', data);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('MAGIC LINK API TEST\n==================\n');
  
  const requestSuccess = await testRequestMagicLink();
  if (!requestSuccess) {
    console.error('Magic link request test failed, skipping verification test.');
    process.exit(1);
  }
  
  const verifySuccess = await testVerifyMagicLink();
  if (!verifySuccess) {
    console.error('Magic link verification test failed.');
    process.exit(1);
  }
  
  console.log('\n✅ All magic link API tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});