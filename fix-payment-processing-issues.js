/**
 * Fix Payment Processing Issues Script
 * 
 * This script fixes the specific payment processing issues identified
 * for teams 218, 199, and 212.
 */

import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function fixPaymentIssues() {
  try {
    console.log('🔧 Fixing payment processing issues...\n');
    
    // Fix Team 218: Update customer ID to match Setup Intent
    console.log('=== Fixing Team 218 ===');
    console.log('Issue: Customer ID mismatch');
    console.log('Updating customer ID from Setup Intent...');
    
    await db.update(teams)
      .set({
        stripeCustomerId: 'cus_SZxYpjGj00Pd6e', // Correct customer ID from Setup Intent
        paymentStatus: 'setup_intent_completed', // Reset status for retry
        notes: 'Customer ID corrected from Setup Intent. Ready for approval payment processing.'
      })
      .where(eq(teams.id, 218));
    
    console.log('✅ Team 218 fixed - customer ID updated\n');
    
    // Fix Team 199: Handle Link payment method
    console.log('=== Fixing Team 199 ===');
    console.log('Issue: Link payment method cannot be reused with customer');
    console.log('Removing customer association for Link payment...');
    
    await db.update(teams)
      .set({
        stripeCustomerId: null, // Link payments cannot have customer associations
        paymentStatus: 'setup_intent_completed', // Reset status for retry
        notes: 'Link payment method configured correctly (no customer association). Ready for approval payment processing.'
      })
      .where(eq(teams.id, 199));
    
    console.log('✅ Team 199 fixed - Link payment configured correctly\n');
    
    // Fix Team 212: Add missing customer ID
    console.log('=== Fixing Team 212 ===');
    console.log('Issue: Missing customer ID in database');
    console.log('Adding customer ID from Setup Intent...');
    
    await db.update(teams)
      .set({
        stripeCustomerId: 'cus_SZpZzdU6w3N1Cb', // Customer ID from Setup Intent
        paymentStatus: 'setup_intent_completed', // Reset status for retry
        notes: 'Customer ID added from Setup Intent. Ready for approval payment processing.'
      })
      .where(eq(teams.id, 212));
    
    console.log('✅ Team 212 fixed - customer ID added\n');
    
    console.log('🎉 All payment processing issues have been fixed!');
    console.log('✅ Teams 218, 199, and 212 are now ready for approval');
    console.log('📝 Admin can now retry team approvals');
    
  } catch (error) {
    console.error('❌ Error fixing payment issues:', error);
  }
}

// Run the fix
fixPaymentIssues().then(() => {
  console.log('\n🏁 Fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});