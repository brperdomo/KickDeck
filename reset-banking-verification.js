/**
 * Reset Banking Verification for Event
 * 
 * This script allows you to completely reset the banking verification process
 * for an event that was set up with incorrect information (wrong email, etc.).
 * 
 * Usage:
 *   node reset-banking-verification.js <eventId>
 *   
 * What it does:
 *   1. Backs up the current Stripe Connect account information
 *   2. Removes the Connect account association from the event
 *   3. Optionally deactivates the old Stripe Connect account
 *   4. Allows fresh banking setup with correct information
 */

import { config } from 'dotenv';
import { db } from './db/index.js';
import { events } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function resetBankingVerification(eventId) {
  try {
    console.log(`🔄 Starting banking verification reset for event ${eventId}...`);
    
    // 1. Get current event information
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });
    
    if (!event) {
      console.log('❌ Event not found');
      return;
    }
    
    console.log(`📋 Event: ${event.name}`);
    console.log(`📧 Current Connect Account: ${event.stripeConnectAccountId || 'None'}`);
    console.log(`🔗 Status: ${event.connectAccountStatus || 'Not set'}`);
    
    if (!event.stripeConnectAccountId) {
      console.log('✅ No Connect account to reset - event is ready for fresh setup');
      return;
    }
    
    // 2. Backup current account information
    console.log('\n📁 Backing up current account information...');
    let accountInfo = null;
    
    try {
      accountInfo = await stripe.accounts.retrieve(event.stripeConnectAccountId);
      console.log('✅ Account information retrieved');
      console.log(`   - Email: ${accountInfo.email || 'Not set'}`);
      console.log(`   - Business Name: ${accountInfo.business_profile?.name || 'Not set'}`);
      console.log(`   - Charges Enabled: ${accountInfo.charges_enabled}`);
      console.log(`   - Payouts Enabled: ${accountInfo.payouts_enabled}`);
    } catch (error) {
      console.log('⚠️  Could not retrieve account info (may already be deleted):', error.message);
    }
    
    // 3. Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      readline.question('\n❓ Reset banking verification? This will:\n' +
        '   - Remove Connect account association from event\n' +
        '   - Allow fresh banking setup with correct information\n' +
        '   - Keep the old Stripe account for reference\n' +
        '   Continue? (y/N): ', resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Reset cancelled');
      return;
    }
    
    // 4. Update event to remove Connect account association
    console.log('\n🔄 Removing Connect account association...');
    
    await db.update(events)
      .set({
        stripeConnectAccountId: null,
        connectAccountStatus: null,
        connectChargesEnabled: false,
        connectPayoutsEnabled: false
      })
      .where(eq(events.id, parseInt(eventId)));
    
    console.log('✅ Event banking information reset successfully');
    
    // 5. Create backup record
    const backupData = {
      eventId: eventId,
      eventName: event.name,
      resetDate: new Date().toISOString(),
      oldAccountId: event.stripeConnectAccountId,
      oldAccountStatus: event.connectAccountStatus,
      accountInfo: accountInfo ? {
        email: accountInfo.email,
        businessName: accountInfo.business_profile?.name,
        chargesEnabled: accountInfo.charges_enabled,
        payoutsEnabled: accountInfo.payouts_enabled
      } : null
    };
    
    // Save backup to file
    const fs = require('fs');
    const backupFile = `banking-reset-backup-${eventId}-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`📁 Backup saved to: ${backupFile}`);
    
    console.log('\n✅ Banking verification reset complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to your event\'s Banking tab');
    console.log('   2. Click "Set Up Bank Account"');
    console.log('   3. Enter the correct email and business information');
    console.log('   4. Complete the Stripe Connect onboarding process');
    
  } catch (error) {
    console.error('❌ Error resetting banking verification:', error);
  }
}

// Check if event ID was provided
const eventId = process.argv[2];
if (!eventId) {
  console.log('Usage: node reset-banking-verification.js <eventId>');
  console.log('Example: node reset-banking-verification.js 1825427780');
  process.exit(1);
}

resetBankingVerification(eventId);