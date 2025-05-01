/**
 * Test script to verify team registration with club information
 */
import fetch from 'node-fetch';

async function testTeamRegistration() {
  try {
    // Fixed eventId for testing
    const eventId = '1251362271'; // Use the Testing Registrations event that appears to be open
    
    // Sample team registration data with club information
    const registrationData = {
      name: 'Test Team with Club',
      ageGroupId: 1, // We'll update this with a real age group ID
      headCoachName: 'John Coach',
      headCoachEmail: 'coach@example.com',
      headCoachPhone: '123-456-7890',
      assistantCoachName: 'Assistant Coach',
      managerName: 'Team Manager',
      managerEmail: 'manager@example.com',
      managerPhone: '123-456-7890',
      clubId: 1, // Testing with existing club ID
      clubName: 'Test Club',
      players: [
        {
          firstName: 'Player',
          lastName: 'One',
          dateOfBirth: '2010-01-01',
          jerseyNumber: '10',
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '123-456-7890'
        }
      ],
      termsAcknowledged: true,
      termsAcknowledgedAt: new Date().toISOString(),
      registrationFee: 100,
      selectedFeeIds: '1',
      totalAmount: 100,
      paymentMethod: 'pay_later'
    };

    // Now let's get the age groups for this event
    console.log(`Fetching age groups for event ${eventId}...`);
    const ageGroupsResponse = await fetch(`http://localhost:5000/api/events/${eventId}/age-groups`);
    const ageGroups = await ageGroupsResponse.json();
    
    if (!ageGroups || ageGroups.length === 0) {
      console.log('No age groups found for this event');
      return;
    }
    
    console.log('Available age groups:');
    ageGroups.forEach(ageGroup => {
      console.log(`ID: ${ageGroup.id}, Name: ${ageGroup.ageGroup} ${ageGroup.gender}`);
    });
    
    // Use the first available age group
    registrationData.ageGroupId = ageGroups[0].id;

    console.log(`Submitting team registration with club info to event ${eventId}...`);
    const response = await fetch(`http://localhost:5000/api/events/${eventId}/register-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    const responseStatus = response.status;
    console.log(`Registration status: ${responseStatus}`);
    
    const responseText = await response.text();
    try {
      const responseData = JSON.parse(responseText);
      console.log('Registration response:', JSON.stringify(responseData, null, 2));
      
      if (responseStatus === 201) {
        console.log('SUCCESS: Team registration with club info is working properly!');
      }
    } catch (e) {
      console.log('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testTeamRegistration();