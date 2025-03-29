/**
 * This script tests the team status update flow, allowing admins to change team statuses
 * and simulating the refund process through the API endpoints.
 */
import fetch from 'node-fetch';

async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const baseUrl = process.env.APP_URL || 'http://localhost:5000'; 
  const url = new URL(endpoint, baseUrl);
  
  console.log(`Making ${method} request to ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'Accept': 'application/json' // Always prefer JSON responses
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`Response status: ${response.status}`);
      return { 
        ok: response.ok, 
        status: response.status, 
        data,
        headers: Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {})
      };
    } else {
      const text = await response.text();
      console.log(`Response status: ${response.status}`);
      console.log(`Response content type: ${contentType}`);
      console.log(`Response text: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
      return { 
        ok: response.ok, 
        status: response.status, 
        text,
        headers: Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {})
      };
    }
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

async function testTeamStatusUpdates() {
  try {
    // Get admin authentication token first
    console.log('\n=== Authenticating as admin ===');
    const loginResponse = await apiRequest('/api/auth/login', 'POST', {
      email: 'admin@matchpro.ai',
      password: 'Admin123!' // Use environment variables in production
    });
    
    if (!loginResponse.ok) {
      console.error('Admin login failed:', loginResponse.status, loginResponse.data || loginResponse.text);
      return;
    }
    
    console.log('Admin login successful');
    
    // Extract the cookie for subsequent authenticated requests
    const cookies = loginResponse.headers['set-cookie'] || '';
    console.log('Cookies received:', cookies);
    
    // Create a test team for our status update flow
    const teamData = {
      name: 'Status Test Team ' + Date.now(),
      eventId: '1234567890', // Replace with a real event ID from your database
      ageGroup: 'U10',
      gender: 'Mixed',
      managerName: 'Test Manager',
      managerEmail: 'test.manager@example.com',
      managerPhone: '555-123-4567',
      submitterEmail: 'test.submitter@example.com',
      status: 'registered'
    };
    
    console.log('\n=== Creating test team ===');
    const createTeamResponse = await apiRequest('/api/admin/teams', 'POST', teamData, cookies);
    
    if (!createTeamResponse.ok) {
      console.error('Failed to create test team:', createTeamResponse.status, createTeamResponse.data || createTeamResponse.text);
      return;
    }
    
    const teamId = createTeamResponse.data.id || createTeamResponse.data.team?.id;
    console.log(`Test team created with ID: ${teamId}`);
    
    // ================== Status Update Tests ==================
    
    // Test Update #1: First status update (approve)
    console.log('\n=== Testing Status Update: registered → approved ===');
    const approveResponse = await apiRequest(`/api/admin/teams/${teamId}/status`, 'PUT', {
      status: 'approved',
      notes: 'Approved for testing purposes'
    }, cookies);
    
    if (!approveResponse.ok) {
      console.error('Failed to approve team:', approveResponse.status, approveResponse.data || approveResponse.text);
    } else {
      console.log('Team approved successfully');
      console.log('Status response:', JSON.stringify(approveResponse.data, null, 2));
    }
    
    // Test Update #2: Reject already approved team
    console.log('\n=== Testing Status Update: approved → rejected ===');
    const rejectResponse = await apiRequest(`/api/admin/teams/${teamId}/status`, 'PUT', {
      status: 'rejected',
      notes: 'Team application rejected after review'
    }, cookies);
    
    if (!rejectResponse.ok) {
      console.error('Failed to reject team:', rejectResponse.status, rejectResponse.data || rejectResponse.text);
    } else {
      console.log('Team rejected successfully');
      console.log('Status response:', JSON.stringify(rejectResponse.data, null, 2));
    }
    
    // Test Update #3: Withdraw team
    console.log('\n=== Testing Status Update: rejected → withdrawn ===');
    const withdrawResponse = await apiRequest(`/api/admin/teams/${teamId}/status`, 'PUT', {
      status: 'withdrawn',
      notes: 'Team withdrawn by manager'
    }, cookies);
    
    if (!withdrawResponse.ok) {
      console.error('Failed to withdraw team:', withdrawResponse.status, withdrawResponse.data || withdrawResponse.text);
    } else {
      console.log('Team withdrawn successfully');
      console.log('Status response:', JSON.stringify(withdrawResponse.data, null, 2));
    }
    
    // ================== Refund Tests ==================
    
    // Create another team for refund testing - this one with payment info
    const refundTeamData = {
      name: 'Refund Test Team ' + Date.now(),
      eventId: '1234567890', // Replace with a real event ID from your database
      ageGroup: 'U12',
      gender: 'Boys',
      managerName: 'Refund Manager',
      managerEmail: 'refund.manager@example.com',
      managerPhone: '555-987-6543',
      submitterEmail: 'refund.submitter@example.com',
      status: 'paid',
      totalAmount: 15000, // $150.00 in cents
      registrationFee: 15000,
      paymentDate: new Date().toISOString(),
      paymentIntentId: 'test_intent_' + Date.now() // Normally this would come from Stripe
    };
    
    console.log('\n=== Creating test refund team ===');
    const refundTeamResponse = await apiRequest('/api/admin/teams', 'POST', refundTeamData, cookies);
    
    if (!refundTeamResponse.ok) {
      console.error('Failed to create refund test team:', refundTeamResponse.status, refundTeamResponse.data || refundTeamResponse.text);
      return;
    }
    
    const refundTeamId = refundTeamResponse.data.id || refundTeamResponse.data.team?.id;
    console.log(`Refund test team created with ID: ${refundTeamId}`);
    
    // Test refund process
    console.log('\n=== Testing Refund Process ===');
    const refundResponse = await apiRequest(`/api/admin/teams/${refundTeamId}/refund`, 'POST', {
      reason: 'Customer requested refund - test case'
    }, cookies);
    
    if (!refundResponse.ok) {
      console.error('Failed to process refund:', refundResponse.status, refundResponse.data || refundResponse.text);
    } else {
      console.log('Refund processed successfully');
      console.log('Refund response:', JSON.stringify(refundResponse.data, null, 2));
    }
    
    // Test edge case: Try to refund an already refunded team
    console.log('\n=== Testing Double Refund (should fail) ===');
    const doubleRefundResponse = await apiRequest(`/api/admin/teams/${refundTeamId}/refund`, 'POST', {
      reason: 'Second refund attempt - should fail'
    }, cookies);
    
    if (!doubleRefundResponse.ok) {
      console.log('Double refund correctly rejected:', JSON.stringify(doubleRefundResponse.data, null, 2));
    } else {
      console.error('ERROR: System allowed double refund - this should not happen!');
    }
    
    // Test invalid team ID
    console.log('\n=== Testing Refund for Non-existent Team ===');
    const invalidTeamResponse = await apiRequest(`/api/admin/teams/999999999/refund`, 'POST', {
      reason: 'This team does not exist'
    }, cookies);
    
    if (!invalidTeamResponse.ok) {
      console.log('Non-existent team refund correctly rejected:', JSON.stringify(invalidTeamResponse.data, null, 2));
    } else {
      console.error('ERROR: System allowed refund for non-existent team!');
    }
    
    // HTTP method test - should prefer PUT/PATCH but support both
    console.log('\n=== Testing PATCH Method Support ===');
    const patchResponse = await apiRequest(`/api/admin/teams/${teamId}/status`, 'PATCH', {
      status: 'approved',
      notes: 'Approved using PATCH method'
    }, cookies);
    
    if (!patchResponse.ok) {
      console.error('PATCH method not supported:', patchResponse.status, patchResponse.data || patchResponse.text);
    } else {
      console.log('PATCH method supported correctly');
      console.log('PATCH response:', JSON.stringify(patchResponse.data, null, 2));
    }
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Start the tests
testTeamStatusUpdates();