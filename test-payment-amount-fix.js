/**
 * Test Payment Amount Fix
 * 
 * This script tests the fixed payment processing to ensure the correct
 * total amount (including platform fees) is charged to customers.
 */

import dotenv from 'dotenv';
import { Client } from 'pg';
import Stripe from 'stripe';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function testPaymentAmountFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Testing payment amount fix...\n');
    
    // Get Test 0 team that has completed payment setup
    const teamResult = await client.query(`
      SELECT id, name, status, total_amount, payment_status, 
             payment_method_id, stripe_customer_id, manager_email, event_id
      FROM teams 
      WHERE name ILIKE '%test 0%' 
        AND payment_method_id IS NOT NULL
        AND status = 'registered'
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('No suitable test team found');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log(`Test Team: ${team.name} (ID: ${team.id})`);
    console.log(`Status: ${team.status}`);
    console.log(`Tournament Cost: $${team.total_amount / 100}`);
    console.log(`Payment Method: ${team.payment_method_id}`);
    console.log(`Event ID: ${team.event_id}\n`);
    
    // Calculate expected fee breakdown
    console.log('Expected fee calculation:');
    const tournamentCost = team.total_amount; // $1.00 in cents
    const platformFeeRate = 0.04; // 4%
    const platformFee = Math.round(tournamentCost * platformFeeRate); // $0.04 = 4 cents
    const stripeFeeFixed = 30; // $0.30 in cents
    const totalPlatformFee = platformFee + stripeFeeFixed; // $0.34 in cents
    const totalExpected = tournamentCost + totalPlatformFee; // $1.34 in cents
    
    console.log(`  Tournament Cost: $${(tournamentCost / 100).toFixed(2)}`);
    console.log(`  Platform Fee (4%): $${(platformFee / 100).toFixed(2)}`);
    console.log(`  Stripe Fixed Fee: $${(stripeFeeFixed / 100).toFixed(2)}`);
    console.log(`  Total Platform Fee: $${(totalPlatformFee / 100).toFixed(2)}`);
    console.log(`  Expected Total Charge: $${(totalExpected / 100).toFixed(2)}\n`);
    
    // Test the approval payment function
    console.log('Simulating approval payment...');
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/teams/${team.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-admin-token' // Would need real auth in production
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Approval result:', result);
        
        // Check if payment was processed
        const updatedTeam = await client.query(`
          SELECT payment_status, payment_intent_id 
          FROM teams 
          WHERE id = $1
        `, [team.id]);
        
        if (updatedTeam.rows[0].payment_intent_id) {
          console.log(`\nPayment Intent Created: ${updatedTeam.rows[0].payment_intent_id}`);
          
          // Retrieve payment intent from Stripe to verify amount
          const paymentIntent = await stripe.paymentIntents.retrieve(
            updatedTeam.rows[0].payment_intent_id
          );
          
          console.log(`Amount Charged: $${paymentIntent.amount / 100}`);
          console.log(`Expected Amount: $${totalExpected / 100}`);
          
          if (paymentIntent.amount === totalExpected) {
            console.log('\n✅ SUCCESS: Correct amount charged including platform fees!');
          } else {
            console.log('\n❌ FAILURE: Amount mismatch detected');
            console.log(`Expected: $${totalExpected / 100}, Actual: $${paymentIntent.amount / 100}`);
          }
        } else {
          console.log('\n❌ FAILURE: No payment intent created');
        }
      } else {
        console.log('Approval request failed:', response.status, response.statusText);
      }
      
    } catch (error) {
      console.log('Error testing approval:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testPaymentAmountFix();