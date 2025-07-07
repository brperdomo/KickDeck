/**
 * Test Charging Team 475 Directly
 * 
 * This script attempts to charge team 475 directly to identify the exact failure point.
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { teams, events } from './db/schema.ts';
import { eq } from 'drizzle-orm';

dotenv.config();

// Import the chargeApprovedTeam function directly
import { chargeApprovedTeam } from './server/routes/stripe-connect-payments.ts';

async function testChargeTeam475() {
  console.log('🧪 TESTING DIRECT CHARGE FOR TEAM 475');
  console.log('=====================================');
  
  try {
    console.log('Calling chargeApprovedTeam(475)...');
    
    const result = await chargeApprovedTeam(475);
    
    console.log('✅ SUCCESS! Payment processed successfully:');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ PAYMENT FAILED:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if this is a specific error type
    if (error.message.includes('fee calculation')) {
      console.error('\n🔍 FEE CALCULATION ERROR DETECTED');
      console.error('   The issue may be in the fee calculator service');
    } else if (error.message.includes('payment method')) {
      console.error('\n🔍 PAYMENT METHOD ERROR DETECTED');
      console.error('   The issue may be with payment method attachment');
    } else if (error.message.includes('Connect')) {
      console.error('\n🔍 STRIPE CONNECT ERROR DETECTED');
      console.error('   The issue may be with the Connect account setup');
    }
  }
}

testChargeTeam475().catch(console.error);