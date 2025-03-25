import axios from 'axios';

async function testTeamRegistration() {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true
  });

  try {
    // First, sign in to get a session cookie
    console.log('Signing in...');
    
    // Using the default admin credentials
    const loginResponse = await axiosInstance.post('/api/auth/login', {
      email: 'admin@matchpro.ai',
      password: 'password'
    });
    
    console.log('Login status:', loginResponse.status);
    
    // Now try to register a team with the authenticated session
    const payload = {
      eventId: "1154838784",  // Using the Demo event ID
      ageGroupId: 1,  // Assuming ID 1 exists
      name: "Test Team - Snake Case Fix",
      headCoachName: "John Coach",
      headCoachEmail: "coach@example.com",
      headCoachPhone: "555-1234",
      assistantCoachName: "Assistant Coach", 
      managerName: "Team Manager",
      managerEmail: "manager@example.com",
      managerPhone: "555-5678",
      players: [
        {
          firstName: "Player",
          lastName: "One",
          jerseyNumber: "10",
          position: "Forward",
          dateOfBirth: "2010-01-01",
          emergencyContactName: "Emergency Contact",
          emergencyContactPhone: "555-9999"
        }
      ],
      termsAcknowledged: true
    };

    console.log('Sending team registration test request...');
    
    const response = await axiosInstance.post('/api/events/1154838784/register-team', payload);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Team registration successful!');
  } catch (error) {
    console.error('Error during test:');
    if (error.response) {
      // The request was made and the server responded with an error status
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error message:', error.message);
    }
  }
}

testTeamRegistration();
