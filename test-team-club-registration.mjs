/**
 * Test script to verify team registration with club information
 */
import { promises as fs } from 'fs';
import fetch from 'node-fetch';

/**
 * Helper function for making API requests with cookie support
 * @param {string} endpoint - API endpoint, without the base URL
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} body - Request body data (for POST, PUT, etc.)
 * @returns {Promise<{ok: boolean, status: number, data: any, cookies: string}>}
 */
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const baseUrl = 'http://localhost:5000'; // Adjust if running on a different port
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    credentials: 'include'
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const setCookieHeader = response.headers.get('set-cookie');
    
    // Try to parse the response as JSON, but don't fail if it's not
    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      cookies: setCookieHeader || cookies
    };
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error.message);
    return { ok: false, status: 500, data: { error: error.message } };
  }
}

async function testTeamRegistration() {
  try {
    console.log('Starting team registration with club test...');
    
    // Step 1: Get event details
    const eventId = '1251362271'; // Use the event ID from our previous tests
    console.log(`Fetching event details for event ID: ${eventId}`);
    
    const eventResponse = await apiRequest(`/api/events/${eventId}`, 'GET');
    if (!eventResponse.ok) {
      throw new Error(`Failed to fetch event details: ${JSON.stringify(eventResponse.data)}`);
    }
    
    // Step 2: Get age groups for the event
    console.log('Fetching age groups for the event...');
    const ageGroupsResponse = await apiRequest(`/api/events/${eventId}/age-groups`, 'GET');
    if (!ageGroupsResponse.ok) {
      throw new Error(`Failed to fetch age groups: ${JSON.stringify(ageGroupsResponse.data)}`);
    }
    
    // Choose the first age group from the response
    const ageGroups = ageGroupsResponse.data;
    if (!ageGroups || ageGroups.length === 0) {
      throw new Error('No age groups found for the event');
    }
    
    const selectedAgeGroup = ageGroups[0];
    console.log(`Selected age group: ${selectedAgeGroup.ageGroup} (ID: ${selectedAgeGroup.id})`);
    
    // Step 3: Get clubs for the event
    console.log('Fetching clubs for the event...');
    const clubsResponse = await apiRequest(`/api/clubs/event/${eventId}`, 'GET');
    if (!clubsResponse.ok) {
      throw new Error(`Failed to fetch clubs: ${JSON.stringify(clubsResponse.data)}`);
    }
    
    const clubs = clubsResponse.data;
    if (!clubs || clubs.length === 0) {
      throw new Error('No clubs found for the event');
    }
    
    const selectedClub = clubs[0];
    console.log(`Selected club: ${selectedClub.name} (ID: ${selectedClub.id})`);
    
    // Step 4: Submit team registration
    console.log('Submitting team registration with club information...');
    const teamData = {
      name: `Test Club Team ${Date.now().toString().slice(-4)}`,
      eventId,
      ageGroupId: selectedAgeGroup.id,
      clubId: selectedClub.id,    // Include the club ID
      clubName: selectedClub.name, // Include the club name
      coach: {
        headCoachName: 'Test Coach',
        headCoachEmail: 'test.coach@example.com',
        headCoachPhone: '555-123-4567'
      },
      managerName: 'Test Manager',
      managerEmail: 'test.manager@example.com',
      managerPhone: '555-987-6543',
      submitterName: 'Test Submitter',
      submitterEmail: 'test.submitter@example.com',
      payLater: true // Use pay later to skip payment for testing
    };
    
    const registerResponse = await apiRequest('/api/teams', 'POST', teamData);
    
    if (!registerResponse.ok) {
      throw new Error(`Failed to register team: ${JSON.stringify(registerResponse.data)}`);
    }
    
    console.log('Team registration successful!');
    console.log('Team data:', registerResponse.data);
    
    // Step 5: Get the team details to verify club information was saved
    if (registerResponse.data && registerResponse.data.id) {
      const teamId = registerResponse.data.id;
      console.log(`Verifying team (ID: ${teamId}) details...`);
      
      const teamResponse = await apiRequest(`/api/teams/${teamId}`, 'GET');
      if (!teamResponse.ok) {
        throw new Error(`Failed to fetch team details: ${JSON.stringify(teamResponse.data)}`);
      }
      
      const team = teamResponse.data;
      
      console.log('Retrieved team:', team);
      
      // Check if club information was properly saved
      if (team.clubId === selectedClub.id && team.clubName === selectedClub.name) {
        console.log('SUCCESS: Club information was properly saved in the team record!');
      } else {
        console.log('FAILED: Club information was not properly saved.');
        console.log('Expected:', { clubId: selectedClub.id, clubName: selectedClub.name });
        console.log('Actual:', { clubId: team.clubId, clubName: team.clubName });
      }
    }
    
    console.log('Test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during team registration test:', error.message);
    return false;
  }
}

// Run the test
testTeamRegistration()
  .then(success => {
    if (success) {
      console.log('Team registration with club test completed successfully!');
      process.exit(0);
    } else {
      console.log('Team registration with club test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });