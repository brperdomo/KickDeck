/**
 * Test Live Setup Intent Creation
 * 
 * This script tests if the updated setup intent creation is working correctly
 * with the live payment method configuration.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function testLiveSetupIntent() {
  console.log('🧪 Testing live setup intent creation...\n');
  
  try {
    // Test with the same configuration as the application
    const setupIntent = await stripe.setupIntents.create({
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      usage: 'off_session',
      payment_method_configuration: 'pmc_1RJmWdP4BpmZARxtTPn2Ek9K', // Live mode configuration
      metadata: {
        teamId: 'test',
        test: 'live_mode_verification'
      }
    });
    
    console.log('📝 Setup Intent Results:');
    console.log(`Setup Intent ID: ${setupIntent.id}`);
    console.log(`Live Mode: ${setupIntent.livemode}`);
    console.log(`Status: ${setupIntent.status}`);
    console.log(`Payment Method Configuration: ${setupIntent.payment_method_configuration_details?.id}`);
    console.log(`Client Secret: ${setupIntent.client_secret ? 'Present' : 'Missing'}`);
    
    if (setupIntent.livemode) {
      console.log('\n✅ SUCCESS: Setup intent created in live mode!');
      console.log('Your application should now accept real payment methods.');
    } else {
      console.log('\n❌ FAILURE: Setup intent still created in test mode.');
      console.log('There may be a deeper Stripe account configuration issue.');
    }
    
  } catch (error) {
    console.error('❌ Error creating setup intent:', error.message);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Type: ${error.type}`);
  }
}

testLiveSetupIntent();