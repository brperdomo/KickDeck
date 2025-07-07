/**
 * Debug Payment Failure for Teams 474 and 475
 * 
 * This script diagnoses the specific cause of payment processing failures
 * for teams that have completed their payment setup.
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { teams, events } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugPaymentFailure() {
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);
  
  console.log('🔍 DEBUGGING PAYMENT FAILURES FOR TEAMS 474 & 475');
  console.log('================================================');
  
  try {
    // Get team 475 details (has complete payment setup)
    const [teamInfo] = await db
      .select({
        team: teams,
        event: {
          id: events.id,
          name: events.name,
          stripeConnectAccountId: events.stripeConnectAccountId,
          connectAccountStatus: events.connectAccountStatus,
          connectChargesEnabled: events.connectChargesEnabled
        }
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, 475));

    if (!teamInfo) {
      console.error('❌ Team 475 not found');
      return;
    }

    const { team, event } = teamInfo;
    
    console.log('📋 TEAM 475 STATUS:');
    console.log(`  Name: ${team.name}`);
    console.log(`  Status: ${team.status}`);
    console.log(`  Payment Status: ${team.paymentStatus}`);
    console.log(`  Total Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    console.log(`  Setup Intent ID: ${team.setupIntentId}`);
    console.log(`  Payment Method ID: ${team.paymentMethodId}`);
    console.log(`  Customer ID: ${team.stripeCustomerId}`);
    
    console.log('\n🎯 EVENT CONNECT STATUS:');
    console.log(`  Event: ${event.name}`);
    console.log(`  Connect Account: ${event.stripeConnectAccountId}`);
    console.log(`  Account Status: ${event.connectAccountStatus}`);
    console.log(`  Charges Enabled: ${event.connectChargesEnabled}`);
    
    // Validate Connect account readiness
    if (!event.stripeConnectAccountId || 
        event.connectAccountStatus !== 'active' || 
        !event.connectChargesEnabled) {
      console.error('❌ CONNECT ACCOUNT NOT READY');
      console.error('   This could be the root cause of payment failures');
      return;
    }
    
    console.log('✅ Connect account appears ready');
    
    // Check Setup Intent status
    if (team.setupIntentId) {
      console.log('\n🔧 SETUP INTENT ANALYSIS:');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log(`  Status: ${setupIntent.status}`);
        console.log(`  Payment Method: ${setupIntent.payment_method}`);
        console.log(`  Customer: ${setupIntent.customer}`);
        
        if (setupIntent.status !== 'succeeded') {
          console.error('❌ SETUP INTENT NOT COMPLETED');
          console.error('   Teams must complete Setup Intent before approval');
          return;
        }
        
        console.log('✅ Setup Intent completed successfully');
        
        // Check payment method details
        if (setupIntent.payment_method) {
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
          console.log('\n💳 PAYMENT METHOD DETAILS:');
          console.log(`  Type: ${paymentMethod.type}`);
          console.log(`  Customer: ${paymentMethod.customer}`);
          
          if (paymentMethod.type === 'card') {
            console.log(`  Card Brand: ${paymentMethod.card?.brand}`);
            console.log(`  Last 4: ${paymentMethod.card?.last4}`);
          }
          
          if (paymentMethod.type === 'link') {
            console.log('⚠️  LINK PAYMENT METHOD DETECTED');
            console.log('   Link payments may require special handling');
          }
        }
        
      } catch (setupError) {
        console.error('❌ SETUP INTENT ERROR:', setupError.message);
        return;
      }
    }
    
    // Test a small charge simulation (without actually charging)
    console.log('\n🧪 SIMULATING CHARGE PROCESS:');
    
    let paymentMethodId = team.paymentMethodId;
    
    if (!paymentMethodId && team.setupIntentId) {
      const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
      if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
        paymentMethodId = setupIntent.payment_method;
        console.log(`  Using payment method from Setup Intent: ${paymentMethodId}`);
      }
    }
    
    if (!paymentMethodId) {
      console.error('❌ NO PAYMENT METHOD AVAILABLE');
      return;
    }
    
    console.log(`  Payment Method ID: ${paymentMethodId}`);
    console.log(`  Charge Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    console.log(`  Connect Account: ${event.stripeConnectAccountId}`);
    
    // Calculate fees using the enhanced calculator
    console.log('\n💰 FEE CALCULATION TEST:');
    
    // Simulate the fee calculation that would happen during charging
    const tournamentCost = team.totalAmount;
    const platformFeeRate = 0.04; // 4%
    const fixedFee = 30; // $0.30 in cents
    
    const platformFeeAmount = Math.round(tournamentCost * platformFeeRate) + fixedFee;
    const totalChargedAmount = tournamentCost + platformFeeAmount;
    
    console.log(`  Tournament Cost: $${(tournamentCost / 100).toFixed(2)}`);
    console.log(`  Platform Fee: $${(platformFeeAmount / 100).toFixed(2)}`);
    console.log(`  Total to Charge: $${(totalChargedAmount / 100).toFixed(2)}`);
    
    console.log('\n🔍 POTENTIAL ISSUE DIAGNOSIS:');
    console.log('1. Check if chargeApprovedTeam function is being called correctly');
    console.log('2. Verify that the payment method can be attached to payment intents');
    console.log('3. Check for any Stripe API rate limiting or account restrictions');
    console.log('4. Verify that the fee calculation service is working properly');
    
    console.log('\n✅ TEAM 475 APPEARS READY FOR PAYMENT');
    console.log('   All payment setup is complete. Issue may be in the approval workflow.');
    
  } catch (error) {
    console.error('❌ DEBUG ERROR:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sql.end();
  }
}

debugPaymentFailure().catch(console.error);