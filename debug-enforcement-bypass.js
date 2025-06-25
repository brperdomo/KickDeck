/**
 * Debug Enforcement Bypass
 * Investigate why incomplete Setup Intents are still getting through
 */

import pkg from 'pg';
const { Client } = pkg;
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugEnforcementBypass() {
  console.log('=== DEBUGGING ENFORCEMENT BYPASS ===\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    
    // Check the problematic teams
    const problemTeams = await client.query(`
      SELECT id, name, status, payment_status, setup_intent_id, 
             payment_method_id, total_amount, created_at
      FROM teams 
      WHERE id IN (125, 126, 127)
      ORDER BY created_at DESC
    `);
    
    console.log('PROBLEMATIC TEAMS ANALYSIS:');
    
    for (const team of problemTeams.rows) {
      console.log(`\nTeam: ${team.name} (ID: ${team.id})`);
      console.log(`Status: ${team.status}`);
      console.log(`Payment Status: ${team.payment_status}`);
      console.log(`Setup Intent: ${team.setup_intent_id}`);
      console.log(`Payment Method: ${team.payment_method_id || 'NULL'}`);
      console.log(`Amount: $${(team.total_amount/100).toFixed(2)}`);
      
      if (team.setup_intent_id) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
          console.log(`Stripe Status: ${setupIntent.status}`);
          console.log(`Stripe Payment Method: ${setupIntent.payment_method || 'NULL'}`);
          
          if (setupIntent.status !== 'succeeded') {
            console.log('❌ ENFORCEMENT FAILED: Team registered with incomplete Setup Intent');
          }
        } catch (stripeError) {
          console.log(`Stripe Error: ${stripeError.message}`);
        }
      }
    }
    
    // Test current enforcement
    console.log('\n\nTESTING CURRENT ENFORCEMENT:');
    
    const testSetupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { testType: 'enforcement_bypass_test' }
    });
    
    console.log(`Created test Setup Intent: ${testSetupIntent.id}`);
    console.log(`Status: ${testSetupIntent.status}`);
    
    // Try to register with incomplete Setup Intent
    const testPayload = {
      name: 'Enforcement Bypass Test',
      email: 'bypass-test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '555-0123',
      paymentMethod: 'card',
      totalAmount: 100,
      setupIntentId: testSetupIntent.id,
      paymentMethodId: 'pm_fake_incomplete',
      eventId: '1',
      ageGroupId: 1
    };
    
    console.log('\nAttempting registration with incomplete Setup Intent...');
    
    const response = await fetch('http://localhost:5000/api/teams/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('❌ CRITICAL: Enforcement bypass confirmed');
      console.log(`Team registered: ${responseData.team?.id}`);
      
      // Clean up if team was created
      if (responseData.team?.id) {
        await client.query('DELETE FROM teams WHERE id = $1', [responseData.team.id]);
        console.log('Cleaned up test team');
      }
    } else {
      console.log('✅ Enforcement working');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${responseData.error}`);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await client.end();
  }
}

debugEnforcementBypass().catch(console.error);