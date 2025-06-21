/**
 * Check Team Payment Readiness
 * 
 * This script verifies which teams have proper payment setup
 * and whether the approval workflow will process payments correctly.
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Client } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkTeamPaymentReadiness() {
  console.log('Checking team payment readiness for approval workflow...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get all pending teams that might be approved
    const teamsQuery = `
      SELECT id, name, status, payment_status, total_amount,
             setup_intent_id, payment_method_id, stripe_customer_id,
             manager_email, card_brand, card_last_four
      FROM teams 
      WHERE status IN ('registered', 'pending') 
        AND total_amount > 0
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const teamsResult = await client.query(teamsQuery);
    
    if (teamsResult.rows.length === 0) {
      console.log('No pending teams found with amounts to charge');
      return;
    }
    
    console.log(`\nFound ${teamsResult.rows.length} pending teams to analyze:`);
    console.log('='.repeat(80));
    
    const paymentReadiness = [];
    
    for (const team of teamsResult.rows) {
      console.log(`\nTeam: ${team.name} (ID: ${team.id})`);
      console.log(`Status: ${team.status}, Payment Status: ${team.payment_status}`);
      console.log(`Amount: $${team.total_amount / 100}`);
      console.log(`Setup Intent: ${team.setup_intent_id || 'None'}`);
      console.log(`Payment Method: ${team.payment_method_id || 'None'}`);
      console.log(`Card: ${team.card_brand || 'None'} ****${team.card_last_four || 'None'}`);
      
      let readinessStatus = 'unknown';
      let stripeStatus = 'not_checked';
      
      if (!team.setup_intent_id) {
        readinessStatus = 'no_payment_setup';
        console.log('❌ NO PAYMENT SETUP - Customer never started payment process');
      } else {
        // Check Stripe setup intent status
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
          stripeStatus = setupIntent.status;
          
          console.log(`Stripe Setup Intent Status: ${setupIntent.status}`);
          
          if (setupIntent.status === 'requires_payment_method') {
            readinessStatus = 'incomplete_payment_setup';
            console.log('❌ INCOMPLETE - Customer started but never entered payment method');
          } else if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
            readinessStatus = 'ready_for_payment';
            console.log('✅ READY - Customer completed payment setup, can be charged');
          } else {
            readinessStatus = 'unknown_status';
            console.log(`⚠️  UNKNOWN STATUS - Setup intent status: ${setupIntent.status}`);
          }
        } catch (stripeError) {
          readinessStatus = 'stripe_error';
          console.log(`❌ STRIPE ERROR - ${stripeError.message}`);
        }
      }
      
      paymentReadiness.push({
        teamId: team.id,
        teamName: team.name,
        amount: team.total_amount / 100,
        readinessStatus,
        stripeStatus,
        canBeCharged: readinessStatus === 'ready_for_payment'
      });
      
      console.log(`Payment Readiness: ${readinessStatus}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('PAYMENT READINESS SUMMARY');
    console.log('='.repeat(80));
    
    const readyTeams = paymentReadiness.filter(t => t.canBeCharged);
    const notReadyTeams = paymentReadiness.filter(t => !t.canBeCharged);
    
    console.log(`✅ Teams ready for payment processing: ${readyTeams.length}`);
    readyTeams.forEach(team => {
      console.log(`   - ${team.teamName}: $${team.amount}`);
    });
    
    console.log(`❌ Teams NOT ready for payment: ${notReadyTeams.length}`);
    notReadyTeams.forEach(team => {
      console.log(`   - ${team.teamName}: $${team.amount} (${team.readinessStatus})`);
    });
    
    // Test approval workflow safety
    console.log('\n' + '='.repeat(80));
    console.log('APPROVAL WORKFLOW ANALYSIS');
    console.log('='.repeat(80));
    
    if (readyTeams.length > 0) {
      console.log('✅ Safe to approve teams with completed payment setup');
      console.log('The approval workflow will process payments automatically');
      
      // Recommend a specific team to test with
      const testTeam = readyTeams[0];
      console.log(`\nRECOMMENDED TEST: Approve "${testTeam.teamName}" (ID: ${testTeam.teamId})`);
      console.log(`This team has completed payment setup and will be charged $${testTeam.amount}`);
    } else {
      console.log('⚠️  NO TEAMS READY FOR AUTOMATIC PAYMENT');
      console.log('All pending teams have incomplete payment setup');
      console.log('Approving any team will result in the same issue as B2017 Academy-1');
    }
    
    if (notReadyTeams.length > 0) {
      console.log('\n❌ DO NOT APPROVE these teams (incomplete payment):');
      notReadyTeams.forEach(team => {
        console.log(`   - ${team.teamName}: Needs payment completion`);
      });
    }
    
    return {
      totalTeams: paymentReadiness.length,
      readyTeams: readyTeams.length,
      notReadyTeams: notReadyTeams.length,
      safeToTest: readyTeams.length > 0,
      recommendedTestTeam: readyTeams[0] || null
    };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

checkTeamPaymentReadiness().then(result => {
  if (result) {
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATION');
    console.log('='.repeat(80));
    
    if (result.safeToTest) {
      console.log('You can safely test the approval workflow with teams that have');
      console.log('completed payment setup. They will be charged automatically.');
    } else {
      console.log('All pending teams have incomplete payment setup.');
      console.log('Consider requiring teams to complete payment before approval.');
    }
  }
}).catch(console.error);