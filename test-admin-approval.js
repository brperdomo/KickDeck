import fetch from 'node-fetch';

async function testTeamApproval() {
  console.log('🧪 TESTING ADMIN APPROVAL WITH BURNED PAYMENT METHOD RECOVERY');
  
  const baseUrl = 'https://7a45a6af-f46a-4d68-b2b2-2f12a1e00d54-00-5s7bw9z7rtfa.spock.replit.dev';
  
  try {
    // Test Team 500 approval (has burned payment method)
    const teamId = 500;
    console.log(`\n🎯 Testing approval for Team ${teamId}`);
    
    const response = await fetch(`${baseUrl}/api/admin/teams/${teamId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Using admin emulation for testing
        'X-Emulate-User': 'admin'
      },
      body: JSON.stringify({
        status: 'approved',
        processPayment: true,
        notes: 'Testing burned payment method recovery system'
      })
    });
    
    const result = await response.json();
    
    console.log(`\n📋 APPROVAL RESULT:`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    if (response.ok && result.status === 'success') {
      console.log(`\n✅ SUCCESS! Team ${teamId} approved with payment recovery!`);
      console.log(`✅ The burned payment method recovery system worked!`);
    } else if (result.status === 'error' && result.error?.includes('burned')) {
      console.log(`\n⚠️  Recovery detection triggered but needs refinement`);
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`\n❌ Unexpected result - may need investigation`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

testTeamApproval().catch(console.error);