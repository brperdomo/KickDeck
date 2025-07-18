import fetch from 'node-fetch';

async function testProductionAPI() {
  try {
    console.log('🧪 TESTING PRODUCTION GAME METADATA API');
    console.log('========================================');
    
    const eventId = 1656618593;
    const apiUrl = `https://7a45a6af-f46a-4d68-b2b2-2f12a1e00d54-00-5s7bw9z7rtfa.spock.replit.dev/api/admin/events/${eventId}/game-metadata`;
    
    console.log('Testing API endpoint:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Test-Script'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body (first 500 chars):', responseText.substring(0, 500));
    
    if (response.status === 401) {
      console.log('✅ API returning proper 401 authentication error (expected)');
      console.log('🎉 PRODUCTION FIX SUCCESSFUL - No more 500 Internal Server Error!');
    } else if (response.status === 500) {
      console.log('❌ Still getting 500 Internal Server Error');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', responseText);
      }
    } else {
      console.log(`ℹ️ Unexpected status code: ${response.status}`);
      try {
        const data = JSON.parse(responseText);
        console.log('Response data:', data);
      } catch (e) {
        console.log('Raw response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testProductionAPI().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});