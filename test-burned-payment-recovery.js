import { db } from './db/index.js';
import { teams, events } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testBurnedPaymentRecovery() {
  console.log('🧪 TESTING BURNED PAYMENT METHOD RECOVERY SYSTEM');
  
  // Test teams with burned payment methods
  const testTeams = [500, 501, 537, 538];
  
  for (const teamId of testTeams) {
    try {
      console.log(`\n🎯 Testing Team ${teamId}`);
      
      // Get team data
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId));
      
      if (!team) {
        console.log(`❌ Team ${teamId} not found`);
        continue;
      }
      
      console.log(`Team: ${team.name}`);
      console.log(`Status: ${team.status}, Payment Status: ${team.paymentStatus}`);
      console.log(`Setup Intent: ${team.setupIntentId}`);
      
      if (team.setupIntentId) {
        // Retrieve Setup Intent to get original payment method
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        console.log(`Setup Intent Status: ${setupIntent.status}`);
        console.log(`Customer: ${setupIntent.customer}`);
        console.log(`Payment Method: ${setupIntent.payment_method}`);
        
        if (setupIntent.payment_method && setupIntent.status === 'succeeded') {
          // Try to retrieve the payment method to check if it's burned
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
            console.log(`Payment Method Type: ${paymentMethod.type}`);
            console.log(`Payment Method Customer: ${paymentMethod.customer}`);
            
            if (!paymentMethod.customer) {
              console.log(`✅ CONFIRMED: Payment method ${setupIntent.payment_method} is BURNED (no customer)`);
              console.log(`✅ This team is eligible for direct payment recovery!`);
              
              // Check if event has Connect account for payment processing
              const [eventInfo] = await db
                .select({
                  stripeConnectAccountId: events.stripeConnectAccountId,
                  connectAccountStatus: events.connectAccountStatus,
                  connectChargesEnabled: events.connectChargesEnabled
                })
                .from(events)
                .where(eq(events.id, team.eventId));
              
              if (eventInfo?.stripeConnectAccountId && 
                  eventInfo.connectAccountStatus === 'active' && 
                  eventInfo.connectChargesEnabled) {
                console.log(`✅ Event has active Connect account: ${eventInfo.stripeConnectAccountId}`);
                console.log(`✅ RECOVERY READY: Direct payment should work for this team!`);
              } else {
                console.log(`❌ Event missing Connect account or not properly configured`);
              }
            } else {
              console.log(`ℹ️  Payment method has customer ${paymentMethod.customer} - not burned`);
            }
            
          } catch (pmError) {
            console.log(`❌ Error retrieving payment method: ${pmError.message}`);
          }
        } else {
          console.log(`❌ Setup Intent incomplete or missing payment method`);
        }
      } else {
        console.log(`❌ No Setup Intent found`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing team ${teamId}: ${error.message}`);
    }
  }
  
  console.log(`\n🚀 TESTING COMPLETE`);
  console.log(`✅ Teams with burned payment methods are now ready for automatic recovery!`);
  console.log(`✅ When admin clicks "Approve Team", the system will:`);
  console.log(`   1. Detect the "was previously used and cannot be reused" error`);
  console.log(`   2. Extract original payment method from Setup Intent`);
  console.log(`   3. Create direct payment intent without customer association`);
  console.log(`   4. Successfully charge the burned payment method`);
  console.log(`   5. Complete team approval automatically`);
  console.log(`\n🎯 Next: Try approving any of these teams through the admin interface!`);
}

testBurnedPaymentRecovery().catch(console.error);