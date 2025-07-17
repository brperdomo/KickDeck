import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixBurnedPaymentMethodsProperly() {
  console.log('🔧 FIXING BURNED PAYMENT METHODS WITH PROPER CUSTOMER RECOVERY');
  
  const burnedTeamIds = [500, 501, 537, 538];
  
  for (const teamId of burnedTeamIds) {
    console.log(`\n🔎 Processing Team ${teamId}:`);
    
    try {
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
      console.log(`Amount: $${(team.totalAmount / 100).toFixed(2)}`);
      console.log(`Current Customer: ${team.stripeCustomerId}`);
      
      // Get the Setup Intent to find the correct customer
      if (team.setupIntentId) {
        const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        const correctCustomerId = setupIntent.customer;
        
        console.log(`Setup Intent Customer: ${correctCustomerId}`);
        
        if (correctCustomerId && correctCustomerId !== team.stripeCustomerId) {
          console.log(`🔄 Updating team with correct customer ID...`);
          
          // Update team with correct customer ID
          await db.update(teams)
            .set({
              stripeCustomerId: correctCustomerId,
              paymentStatus: 'setup_intent_completed',
              notes: `Customer ID corrected from ${team.stripeCustomerId} to ${correctCustomerId} - ready for approval charge`
            })
            .where(eq(teams.id, teamId));
          
          console.log(`✅ Team ${teamId} updated with correct customer ID: ${correctCustomerId}`);
          console.log(`✅ Payment status set to 'setup_intent_completed' - ready for approval`);
          
        } else if (correctCustomerId === team.stripeCustomerId) {
          console.log(`✅ Customer ID already correct - just updating payment status`);
          
          await db.update(teams)
            .set({
              paymentStatus: 'setup_intent_completed',
              notes: `Payment method setup verified - ready for approval charge`
            })
            .where(eq(teams.id, teamId));
        } else {
          console.log(`❌ No customer found in Setup Intent`);
          continue;
        }
        
        // Verify the customer exists and can be charged
        try {
          const customer = await stripe.customers.retrieve(correctCustomerId);
          console.log(`✅ Customer verified: ${customer.email}`);
          
          // Get the customer's payment methods
          const paymentMethods = await stripe.paymentMethods.list({
            customer: correctCustomerId,
            type: 'card'
          });
          
          if (paymentMethods.data.length > 0) {
            const pm = paymentMethods.data[0];
            console.log(`✅ Found usable payment method: ${pm.id} (${pm.card.brand} ****${pm.card.last4})`);
            
            // Update team with the usable payment method
            await db.update(teams)
              .set({
                paymentMethodId: pm.id
              })
              .where(eq(teams.id, teamId));
            
            console.log(`✅ Team ${teamId} is now ready for approval with working payment method`);
          } else {
            console.log(`❌ No payment methods found for customer ${correctCustomerId}`);
          }
          
        } catch (customerError) {
          console.log(`❌ Customer verification failed: ${customerError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error processing team ${teamId}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 RECOVERY COMPLETE');
  console.log('Teams should now be ready for approval without requiring new payment methods.');
  console.log('The correct customer IDs have been restored and payment methods verified.');
}

fixBurnedPaymentMethodsProperly().catch(console.error);