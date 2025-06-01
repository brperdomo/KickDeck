/**
 * Verify Stripe Keys Configuration
 * 
 * This script verifies that the Stripe keys are properly configured
 * and checks if there's a mismatch causing test mode behavior.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

async function verifyStripeKeys() {
  console.log('🔍 Verifying Stripe keys configuration...\n');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.VITE_STRIPE_PUBLIC_KEY;
  
  console.log('📋 Key Information:');
  console.log(`Secret Key: ${secretKey ? secretKey.substring(0, 12) + '...' : 'MISSING'}`);
  console.log(`Publishable Key: ${publishableKey ? publishableKey.substring(0, 12) + '...' : 'MISSING'}`);
  
  // Check if keys match (both should be live or both test)
  const secretIsLive = secretKey?.startsWith('sk_live_');
  const publishableIsLive = publishableKey?.startsWith('pk_live_');
  
  console.log(`\n🔑 Key Types:`);
  console.log(`Secret Key is Live: ${secretIsLive}`);
  console.log(`Publishable Key is Live: ${publishableIsLive}`);
  
  if (secretIsLive !== publishableIsLive) {
    console.log('❌ KEY MISMATCH DETECTED! Secret and publishable keys are from different environments.');
    return;
  }
  
  if (!secretKey) {
    console.log('❌ Missing STRIPE_SECRET_KEY');
    return;
  }
  
  // Test Stripe API with the secret key
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
    
    console.log(`\n🧪 Testing Stripe API...`);
    
    // Get account details
    const account = await stripe.accounts.retrieve();
    console.log(`Account ID: ${account.id}`);
    console.log(`Account Email: ${account.email || 'Not set'}`);
    console.log(`Charges Enabled: ${account.charges_enabled}`);
    console.log(`Payouts Enabled: ${account.payouts_enabled}`);
    
    // Create a test setup intent to check the mode
    const setupIntent = await stripe.setupIntents.create({
      automatic_payment_methods: {
        enabled: true,
      },
      usage: 'off_session',
      metadata: {
        test: 'key_verification'
      }
    });
    
    console.log(`\n📝 Setup Intent Test:`);
    console.log(`Setup Intent ID: ${setupIntent.id}`);
    console.log(`Live Mode: ${setupIntent.livemode}`);
    console.log(`Status: ${setupIntent.status}`);
    
    if (!setupIntent.livemode && secretIsLive) {
      console.log('❌ CRITICAL ISSUE: Using live keys but setup intent created in test mode!');
      console.log('This suggests your Stripe account may be restricted or not fully activated.');
    } else if (setupIntent.livemode && secretIsLive) {
      console.log('✅ Keys and setup intent mode are correctly configured for live mode.');
    }
    
  } catch (error) {
    console.error('❌ Error testing Stripe API:', error.message);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Type: ${error.type}`);
  }
}

verifyStripeKeys();