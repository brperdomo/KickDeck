/**
 * Test Team 530 Approval
 * 
 * This script tests the complete approval workflow for Team 530
 * to verify the payment integrity system prevents failures.
 */

const { Client } = require('pg');

async function testTeam530Approval() {
  console.log('🧪 TESTING TEAM 530 APPROVAL WORKFLOW');
  console.log('Testing if payment integrity system prevents failures');
  console.log('='.repeat(50));

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Check current team status
    const teamResult = await client.query(`
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, stripe_customer_id
      FROM teams 
      WHERE id = 530
    `);

    if (teamResult.rows.length === 0) {
      console.log('❌ Team 530 not found');
      return;
    }

    const team = teamResult.rows[0];
    
    console.log('\n📋 TEAM STATUS BEFORE APPROVAL:');
    console.log(`Name: ${team.name}`);
    console.log(`Status: ${team.status}`);
    console.log(`Payment Status: ${team.payment_status}`);
    console.log(`Amount: $${(team.total_amount / 100).toFixed(2)}`);
    console.log(`Customer: ${team.stripe_customer_id}`);
    console.log(`Payment Method: ${team.payment_method_id}`);

    if (team.status !== 'registered') {
      console.log(`\n⚠️  Team is already ${team.status}, cannot test approval`);
      return;
    }

    // Test the approval API endpoint
    console.log('\n🚀 TESTING APPROVAL VIA API...');
    console.log('-'.repeat(30));

    try {
      const response = await fetch('http://localhost:5000/api/admin/teams/530/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Testing payment integrity system approval'
        })
      });

      const result = await response.json();
      
      console.log(`API Response Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(result, null, 2)}`);

      if (response.ok) {
        console.log('\n✅ APPROVAL SUCCESSFUL!');
        
        // Check the updated team status
        const updatedTeamResult = await client.query(`
          SELECT id, name, status, payment_status, payment_intent_id, notes
          FROM teams 
          WHERE id = 530
        `);
        
        if (updatedTeamResult.rows.length > 0) {
          const updatedTeam = updatedTeamResult.rows[0];
          console.log('\n📋 TEAM STATUS AFTER APPROVAL:');
          console.log(`Status: ${updatedTeam.status}`);
          console.log(`Payment Status: ${updatedTeam.payment_status}`);
          console.log(`Payment Intent: ${updatedTeam.payment_intent_id || 'None'}`);
          console.log(`Notes: ${updatedTeam.notes || 'None'}`);
          
          if (updatedTeam.status === 'approved' && updatedTeam.payment_intent_id) {
            console.log('\n🎉 SUCCESS! Payment integrity system working perfectly!');
            console.log('✅ Team approved');
            console.log('✅ Payment processed');
            console.log('✅ No "Setup Intent without customer" errors');
          } else if (updatedTeam.status === 'approved') {
            console.log('\n⚠️  Team approved but no payment processed');
          } else {
            console.log('\n❌ Team status not updated correctly');
          }
        }
      } else {
        console.log('\n❌ APPROVAL FAILED');
        
        if (result.error && result.error.includes('Payment setup validation failed')) {
          console.log('🚨 Payment integrity system correctly blocked approval!');
          console.log(`Reason: ${result.message}`);
          
          if (result.autoFixActions) {
            console.log(`Auto-fix actions: ${result.autoFixActions.join(', ')}`);
          }
          
          if (result.recommendedAction) {
            console.log(`Recommended action: ${result.recommendedAction}`);
          }
        } else {
          console.log(`Unexpected error: ${result.error || result.message}`);
        }
      }

    } catch (fetchError) {
      console.error('❌ API request failed:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

testTeam530Approval();