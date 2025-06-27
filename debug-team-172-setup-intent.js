/**
 * Debug Team 172 Setup Intent Issue
 * 
 * This script investigates the specific Setup Intent for team 172
 * to understand why approval payment is failing.
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function debugTeam172SetupIntent() {
  try {
    const setupIntentId = 'seti_1ReTDfP4BpmZARxtHNDd6gbi';
    
    console.log(`Checking Setup Intent: ${setupIntentId}`);
    
    // Retrieve the setup intent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    console.log('\nSetup Intent Details:');
    console.log('Status:', setupIntent.status);
    console.log('Payment Method:', setupIntent.payment_method);
    console.log('Customer:', setupIntent.customer);
    console.log('Created:', new Date(setupIntent.created * 1000).toISOString());
    console.log('Metadata:', setupIntent.metadata);
    
    if (setupIntent.last_setup_error) {
      console.log('\nLast Setup Error:');
      console.log('Code:', setupIntent.last_setup_error.code);
      console.log('Message:', setupIntent.last_setup_error.message);
      console.log('Type:', setupIntent.last_setup_error.type);
    }
    
    // If there's a payment method, get its details
    if (setupIntent.payment_method && typeof setupIntent.payment_method === 'string') {
      console.log('\nRetrieving Payment Method Details...');
      const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
      
      console.log('Payment Method Type:', paymentMethod.type);
      if (paymentMethod.card) {
        console.log('Card Brand:', paymentMethod.card.brand);
        console.log('Card Last 4:', paymentMethod.card.last4);
        console.log('Card Exp:', `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
      }
      console.log('Payment Method Customer:', paymentMethod.customer);
    }
    
    // If there's a customer, get customer details
    if (setupIntent.customer && typeof setupIntent.customer === 'string') {
      console.log('\nRetrieving Customer Details...');
      const customer = await stripe.customers.retrieve(setupIntent.customer);
      console.log('Customer Email:', customer.email);
      console.log('Customer Created:', new Date(customer.created * 1000).toISOString());
    }
    
    // Determine what action should be taken
    console.log('\n--- DIAGNOSIS ---');
    
    if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
      console.log('✅ Setup Intent is complete and ready for charging');
      console.log(`Payment Method ID: ${setupIntent.payment_method}`);
      console.log(`Customer ID: ${setupIntent.customer || 'None'}`);
      console.log('RECOMMENDED ACTION: Update team record with payment_method_id and try approval again');
    } else if (setupIntent.status === 'requires_payment_method') {
      console.log('❌ Setup Intent requires payment method - team needs to complete payment setup');
      console.log('RECOMMENDED ACTION: Generate payment completion URL for team');
    } else if (setupIntent.status === 'requires_confirmation') {
      console.log('⚠️  Setup Intent requires confirmation');
      console.log('RECOMMENDED ACTION: Team needs to complete payment confirmation');
    } else {
      console.log(`❓ Setup Intent status: ${setupIntent.status}`);
      console.log('RECOMMENDED ACTION: Check Stripe documentation for this status');
    }
    
  } catch (error) {
    console.error('Error debugging Setup Intent:', error);
  }
}

debugTeam172SetupIntent().catch(console.error);