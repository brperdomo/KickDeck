import { db } from './db/index.js';
import { teams, events } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { chargeApprovedTeam } from './server/routes/stripe-connect-payments.js';

async function debugPaymentApproval() {
  console.log('🔍 DEBUGGING PAYMENT APPROVAL FAILURE');
  
  const teamIds = [500, 501, 537, 538];
  
  for (const teamId of teamIds) {
    console.log(`\n🔎 Analyzing Team ${teamId}:`);
    
    try {
      // Get team and event details
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
        .where(eq(teams.id, teamId));

      if (!teamInfo) {
        console.log(`❌ Team ${teamId} not found`);
        continue;
      }

      const { team, event } = teamInfo;
      
      console.log(`Team: ${team.name}`);
      console.log(`Event: ${event.name}`);
      console.log(`Payment Status: ${team.paymentStatus}`);
      console.log(`Total Amount: $${team.totalAmount ? (team.totalAmount / 100).toFixed(2) : 'NOT SET'}`);
      console.log(`Setup Intent ID: ${team.setupIntentId || 'NOT SET'}`);
      console.log(`Payment Method ID: ${team.paymentMethodId || 'NOT SET'}`);
      console.log(`Customer ID: ${team.stripeCustomerId || 'NOT SET'}`);
      
      console.log(`\nStripe Connect Configuration:`);
      console.log(`Account ID: ${event.stripeConnectAccountId || 'NOT SET'}`);
      console.log(`Account Status: ${event.connectAccountStatus}`);
      console.log(`Charges Enabled: ${event.connectChargesEnabled}`);
      
      // Test if Connect account validation would pass
      if (!event.stripeConnectAccountId || 
          event.connectAccountStatus !== 'active' || 
          !event.connectChargesEnabled) {
        console.log(`❌ CONNECT VALIDATION FAILURE:`);
        if (!event.stripeConnectAccountId) console.log(`  - Missing Connect Account ID`);
        if (event.connectAccountStatus !== 'active') console.log(`  - Account Status: ${event.connectAccountStatus} (needs: active)`);
        if (!event.connectChargesEnabled) console.log(`  - Charges Disabled`);
        continue;
      }
      
      console.log(`✅ Connect validation passed`);
      
      // Test payment method availability
      if (!team.totalAmount) {
        console.log(`❌ AMOUNT VALIDATION FAILURE: No total amount set`);
        continue;
      }
      
      if (!team.paymentMethodId && !team.setupIntentId) {
        console.log(`❌ PAYMENT METHOD VALIDATION FAILURE: No payment method or setup intent`);
        continue;
      }
      
      console.log(`✅ Payment method validation passed`);
      
      // Try the actual charge
      console.log(`\n🚀 Attempting actual charge for Team ${teamId}...`);
      const result = await chargeApprovedTeam(teamId);
      console.log(`Charge result:`, result);
      
    } catch (error) {
      console.log(`❌ ERROR for Team ${teamId}:`);
      console.log(`Message: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }
  }
}

debugPaymentApproval().catch(console.error);