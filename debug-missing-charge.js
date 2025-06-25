/**
 * Debug Missing Charge Issue
 * 
 * This script investigates why the team approval didn't result in a charge
 */

import pkg from 'pg';
const { Client } = pkg;
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugMissingCharge() {
  console.log('Investigating missing $1 charge after team approval...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    
    // Find the most recently created team
    const recentTeams = await client.query(`
      SELECT id, name, status, payment_status, setup_intent_id, 
             payment_method_id, payment_intent_id, total_amount, created_at
      FROM teams 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Recent teams:');
    for (const team of recentTeams.rows) {
      console.log(`- ${team.name}: Status=${team.status}, Payment=${team.payment_status}, Amount=$${team.total_amount ? (team.total_amount/100).toFixed(2) : '0.00'}`);
    }
    
    if (recentTeams.rows.length === 0) {
      console.log('No teams found');
      return;
    }
    
    // Find the team that was just approved
    const approvedTeam = recentTeams.rows.find(t => t.status === 'approved') || recentTeams.rows[0];
    
    console.log(`\nInvestigating team: ${approvedTeam.name} (ID: ${approvedTeam.id})`);
    console.log(`Status: ${approvedTeam.status}`);
    console.log(`Payment Status: ${approvedTeam.payment_status}`);
    console.log(`Setup Intent ID: ${approvedTeam.setup_intent_id}`);
    console.log(`Payment Method ID: ${approvedTeam.payment_method_id}`);
    console.log(`Payment Intent ID: ${approvedTeam.payment_intent_id}`);
    console.log(`Total Amount: $${approvedTeam.total_amount ? (approvedTeam.total_amount/100).toFixed(2) : '0.00'}`);
    
    // Check if Setup Intent exists and is valid
    if (approvedTeam.setup_intent_id) {
      console.log(`\nChecking Setup Intent ${approvedTeam.setup_intent_id}...`);
      
      try {
        const setupIntent = await stripe.setupIntents.retrieve(approvedTeam.setup_intent_id);
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        console.log(`Payment Method: ${setupIntent.payment_method}`);
        console.log(`Customer: ${setupIntent.customer}`);
        
        if (setupIntent.status !== 'succeeded') {
          console.log('🔍 ISSUE FOUND: Setup Intent was never completed by the user');
          console.log('This means the payment method was never properly collected');
        }
      } catch (stripeError) {
        console.log(`Error retrieving Setup Intent: ${stripeError.message}`);
      }
    } else {
      console.log('🔍 ISSUE FOUND: No Setup Intent ID - payment method was never collected');
    }
    
    // Check if Payment Intent was created
    if (approvedTeam.payment_intent_id) {
      console.log(`\nChecking Payment Intent ${approvedTeam.payment_intent_id}...`);
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(approvedTeam.payment_intent_id);
        console.log(`Payment Intent Status: ${paymentIntent.status}`);
        console.log(`Amount: $${(paymentIntent.amount/100).toFixed(2)}`);
      } catch (stripeError) {
        console.log(`Error retrieving Payment Intent: ${stripeError.message}`);
      }
    } else {
      console.log('🔍 ISSUE FOUND: No Payment Intent was created during approval');
    }
    
    console.log('\n=== DIAGNOSIS ===');
    
    if (!approvedTeam.setup_intent_id) {
      console.log('Root Cause: Team registered without completing payment method setup');
      console.log('Solution: The registration should have been blocked by payment enforcement');
    } else if (approvedTeam.setup_intent_id && !approvedTeam.payment_intent_id) {
      console.log('Root Cause: Team approval workflow did not process payment');
      console.log('Solution: Check processTeamApprovalPayment function execution');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await client.end();
  }
}

debugMissingCharge().catch(console.error);