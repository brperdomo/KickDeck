/**
 * Debug Team 194 Link Payment Method Issue
 * 
 * This script investigates the specific attachment error occurring with Team 194's
 * Link payment method during approval process.
 */

import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugTeam194LinkPayment() {
  try {
    console.log('=== DEBUGGING TEAM 194 LINK PAYMENT METHOD ===');
    
    // Get team 194 details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, 194)
    });
    
    if (!team) {
      console.log('Team 194 not found');
      return;
    }
    
    console.log('Team 194 details:');
    console.log({
      id: team.id,
      name: team.name,
      paymentMethodId: team.paymentMethodId,
      setupIntentId: team.setupIntentId,
      stripeCustomerId: team.stripeCustomerId,
      paymentStatus: team.paymentStatus,
      totalAmount: team.totalAmount
    });
    
    // Examine payment method
    if (team.paymentMethodId) {
      console.log('\n=== PAYMENT METHOD ANALYSIS ===');
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
        console.log('Payment method details:');
        console.log({
          id: paymentMethod.id,
          type: paymentMethod.type,
          customer: paymentMethod.customer,
          created: paymentMethod.created,
          livemode: paymentMethod.livemode
        });
        
        if (paymentMethod.type === 'link') {
          console.log('\n=== LINK PAYMENT METHOD DETECTED ===');
          console.log('Link payment methods cannot be attached to customers!');
          console.log('This is the root cause of the attachment error.');
          console.log('Link payment method properties:');
          console.log(JSON.stringify(paymentMethod.link, null, 2));
        }
        
      } catch (error) {
        console.log('Error retrieving payment method:', error.message);
      }
    }
    
    // Examine setup intent if available
    if (team.setupIntentId) {
      console.log('\n=== SETUP INTENT ANALYSIS ===');
      try {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log('Setup Intent details:');
        console.log({
          id: setupIntent.id,
          status: setupIntent.status,
          customer: setupIntent.customer,
          payment_method: setupIntent.payment_method,
          usage: setupIntent.usage
        });
        
        if (setupIntent.payment_method && setupIntent.payment_method !== team.paymentMethodId) {
          console.log('\n=== PAYMENT METHOD MISMATCH DETECTED ===');
          console.log(`Setup Intent payment method: ${setupIntent.payment_method}`);
          console.log(`Team payment method: ${team.paymentMethodId}`);
          
          // Check the setup intent's payment method too
          try {
            const siPaymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            console.log('Setup Intent payment method details:');
            console.log({
              id: siPaymentMethod.id,
              type: siPaymentMethod.type,
              customer: siPaymentMethod.customer
            });
          } catch (error) {
            console.log('Error retrieving setup intent payment method:', error.message);
          }
        }
        
      } catch (error) {
        console.log('Error retrieving setup intent:', error.message);
      }
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (team.paymentMethodId) {
      const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
      if (paymentMethod.type === 'link') {
        console.log('1. Link payment methods CANNOT be attached to customers');
        console.log('2. All payment processing code must skip customer attachment for Link payments');
        console.log('3. Link payments require different processing flow without destination charges');
        console.log('4. Customer parameter must be omitted from payment intent creation for Link payments');
      }
    }
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

// Run the debug
debugTeam194LinkPayment().then(() => {
  console.log('\nDebugging complete');
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});