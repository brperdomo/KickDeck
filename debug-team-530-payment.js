/**
 * Debug Team 530 Payment Failure Script
 * 
 * This script provides detailed debugging information for City SC Southwest G07 DPL
 * payment failure and outputs comprehensive console logs.
 */

import Stripe from 'stripe';
import { db } from './db/index.js';
import { teams, paymentTransactions } from './db/schema.js';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugTeam530Payment() {
  console.log('\n=== DEBUGGING TEAM 530 PAYMENT FAILURE ===');
  console.log('Team: City SC Southwest G07 DPL');
  console.log('Issue: Payment method cannot be attached to customer');
  console.log('================================================\n');

  try {
    // Get team details
    const [team] = await db.select().from(teams).where(eq(teams.id, 530));
    
    if (!team) {
      console.error('❌ Team 530 not found in database');
      return;
    }

    console.log('📋 TEAM DETAILS:');
    console.log(`   Name: ${team.name}`);
    console.log(`   Payment Status: ${team.paymentStatus}`);
    console.log(`   Setup Intent ID: ${team.setupIntentId}`);
    console.log(`   Payment Method ID: ${team.paymentMethodId}`);
    console.log(`   Stripe Customer ID: ${team.stripeCustomerId || 'NOT SET'}`);
    console.log(`   Total Amount: $${(team.totalAmount / 100).toFixed(2)}`);
    console.log(`   Status: ${team.status}\n`);

    // Check Setup Intent details from Stripe
    if (team.setupIntentId) {
      console.log('🔍 SETUP INTENT ANALYSIS:');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log(`   Setup Intent Status: ${setupIntent.status}`);
        console.log(`   Customer: ${setupIntent.customer || 'NOT ATTACHED'}`);
        console.log(`   Payment Method: ${setupIntent.payment_method || 'NOT SET'}`);
        
        if (setupIntent.last_setup_error) {
          console.log(`   Last Error: ${setupIntent.last_setup_error.message}`);
        }

        // Check if payment method exists and its details
        if (setupIntent.payment_method) {
          console.log('\n💳 PAYMENT METHOD ANALYSIS:');
          const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
          console.log(`   Payment Method ID: ${paymentMethod.id}`);
          console.log(`   Type: ${paymentMethod.type}`);
          console.log(`   Customer: ${paymentMethod.customer || 'NOT ATTACHED TO CUSTOMER'}`);
          
          if (paymentMethod.card) {
            console.log(`   Card Brand: ${paymentMethod.card.brand}`);
            console.log(`   Last 4: ${paymentMethod.card.last4}`);
            console.log(`   Exp: ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
          }

          // Check if this is a Link payment
          if (paymentMethod.type === 'link') {
            console.log('   ⚠️  WARNING: This is a Link payment method');
            console.log('   ⚠️  Link payments cannot be attached to customers');
            console.log('   ⚠️  This explains the attachment failure');
          }
        }
      } catch (stripeError) {
        console.error(`❌ Error retrieving Setup Intent: ${stripeError.message}`);
      }
    }

    // Check payment transaction history
    console.log('\n📊 PAYMENT TRANSACTION HISTORY:');
    const transactions = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.teamId, 530))
      .orderBy(paymentTransactions.createdAt);

    if (transactions.length === 0) {
      console.log('   No payment transactions found');
    } else {
      transactions.forEach((tx, index) => {
        console.log(`   Transaction ${index + 1}:`);
        console.log(`     Date: ${tx.createdAt}`);
        console.log(`     Type: ${tx.transactionType}`);
        console.log(`     Amount: $${(tx.amount / 100).toFixed(2)}`);
        console.log(`     Status: ${tx.status}`);
        console.log(`     Error: ${tx.errorMessage || 'None'}`);
        console.log('');
      });
    }

    // ROOT CAUSE ANALYSIS
    console.log('🔧 ROOT CAUSE ANALYSIS:');
    
    if (team.setupIntentId && team.paymentMethodId && !team.stripeCustomerId) {
      console.log('   ❌ ISSUE IDENTIFIED: Payment method exists but no customer ID set');
      console.log('   📝 EXPLANATION: The payment method was created but never properly');
      console.log('      attached to a customer. When trying to charge, Stripe requires');
      console.log('      the payment method to be attached to a customer first.');
      console.log('');
      console.log('   💡 SOLUTION OPTIONS:');
      console.log('   1. Create a customer and attach the payment method');
      console.log('   2. Create a new Setup Intent with proper customer creation');
      console.log('   3. Generate a new payment completion URL for the team');
      
      // Check if this is a Link payment that can't be attached
      if (team.setupIntentId) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          if (setupIntent.payment_method) {
            const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            if (paymentMethod.type === 'link') {
              console.log('');
              console.log('   ⚠️  SPECIAL CASE: Link Payment Detected');
              console.log('   📝 Link payments fundamentally cannot be attached to customers');
              console.log('   💡 RECOMMENDED SOLUTION: Generate new payment URL without Link support');
            }
          }
        } catch (e) {
          console.log('   (Could not check payment method type)');
        }
      }
    }

    console.log('\n✅ Debug analysis complete');
    console.log('📋 This information has been logged to the console for your review');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug script
debugTeam530Payment().catch(console.error);