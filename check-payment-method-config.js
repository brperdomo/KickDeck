/**
 * Check Payment Method Configuration
 * 
 * This script checks your Stripe payment method configurations to see
 * if there's a test mode configuration causing the issue.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function checkPaymentMethodConfigs() {
  console.log('🔍 Checking payment method configurations...\n');
  
  try {
    // List all payment method configurations
    const configs = await stripe.paymentMethodConfigurations.list({
      limit: 100
    });
    
    console.log(`Found ${configs.data.length} payment method configurations:\n`);
    
    for (const config of configs.data) {
      console.log(`Configuration ID: ${config.id}`);
      console.log(`Name: ${config.name || 'Default'}`);
      console.log(`Live Mode: ${config.livemode}`);
      console.log(`Is Default: ${config.is_default}`);
      console.log(`Created: ${new Date(config.created * 1000).toISOString()}`);
      
      // Check specific payment methods enabled
      if (config.card) {
        console.log(`Card Payments: ${config.card.display_preference?.preference || 'enabled'}`);
      }
      
      console.log('---');
    }
    
    // Check if there's a test mode configuration that might be interfering
    const testConfigs = configs.data.filter(config => !config.livemode);
    if (testConfigs.length > 0) {
      console.log(`\n⚠️  Found ${testConfigs.length} test mode payment method configuration(s)`);
      console.log('This might be causing setup intents to be created in test mode even with live keys.');
      
      for (const testConfig of testConfigs) {
        console.log(`\nTest Config: ${testConfig.id}`);
        console.log(`Is Default: ${testConfig.is_default}`);
        
        if (testConfig.is_default) {
          console.log('❌ This test configuration is set as default! This will force test mode.');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking payment method configurations:', error.message);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Type: ${error.type}`);
  }
}

checkPaymentMethodConfigs();