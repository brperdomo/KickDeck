import { db } from './db/index.js';
import { teams } from './db/schema.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function diagnoseSetupIntentFlow() {
  console.log('🔍 DIAGNOSING SETUP INTENT FLOW FOR BURNED PAYMENT METHODS');
  
  const burnedTeamIds = [500, 501, 537, 538];
  
  for (const teamId of burnedTeamIds) {
    console.log(`\n🔎 Team ${teamId} Analysis:`);
    
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
      console.log(`Setup Intent ID: ${team.setupIntentId}`);
      console.log(`Customer ID: ${team.stripeCustomerId}`);
      console.log(`Payment Method ID: ${team.paymentMethodId}`);
      
      // Analyze the Setup Intent
      if (team.setupIntentId) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
          console.log(`\nSetup Intent Analysis:`);
          console.log(`  Status: ${setupIntent.status}`);
          console.log(`  Customer: ${setupIntent.customer || 'NONE'}`);
          console.log(`  Payment Method: ${setupIntent.payment_method || 'NONE'}`);
          console.log(`  Created: ${new Date(setupIntent.created * 1000).toISOString()}`);
          
          // Check if payment method is attached to customer
          if (setupIntent.payment_method) {
            try {
              const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
              console.log(`\nPayment Method Analysis:`);
              console.log(`  ID: ${paymentMethod.id}`);
              console.log(`  Customer: ${paymentMethod.customer || 'NONE'}`);
              console.log(`  Card Brand: ${paymentMethod.card?.brand}`);
              console.log(`  Card Last 4: ${paymentMethod.card?.last4}`);
              console.log(`  Created: ${new Date(paymentMethod.created * 1000).toISOString()}`);
              
              // This is the key issue: if customer is null, the payment method is "burned"
              if (!paymentMethod.customer) {
                console.log(`\n❌ PROBLEM IDENTIFIED: Payment method ${paymentMethod.id} has NO CUSTOMER ATTACHMENT`);
                console.log(`   This makes it unusable for future charges`);
                
                // Check if we can attach it to the customer now
                if (team.stripeCustomerId) {
                  console.log(`\n🔧 Attempting to attach payment method to customer...`);
                  try {
                    const attachedPM = await stripe.paymentMethods.attach(paymentMethod.id, {
                      customer: team.stripeCustomerId
                    });
                    console.log(`✅ Successfully attached payment method to customer ${team.stripeCustomerId}`);
                    
                    // Update team payment status
                    await db.update(teams)
                      .set({
                        paymentStatus: 'setup_intent_completed',
                        notes: `Payment method ${paymentMethod.id} successfully attached to customer ${team.stripeCustomerId} - ready for approval`
                      })
                      .where(eq(teams.id, teamId));
                    
                    console.log(`✅ Team ${teamId} payment status updated to setup_intent_completed`);
                  } catch (attachError) {
                    console.log(`❌ Failed to attach payment method: ${attachError.message}`);
                    if (attachError.message.includes('already been attached')) {
                      console.log(`⚠️  Payment method was already attached to a different customer`);
                    }
                  }
                } else {
                  console.log(`❌ No customer ID available to attach payment method to`);
                }
              } else {
                console.log(`✅ Payment method properly attached to customer: ${paymentMethod.customer}`);
              }
              
            } catch (pmError) {
              console.log(`❌ Error retrieving payment method: ${pmError.message}`);
            }
          }
          
        } catch (siError) {
          console.log(`❌ Error retrieving setup intent: ${siError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error analyzing team ${teamId}: ${error.message}`);
    }
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('The issue occurs when Setup Intents are created with customers, but payment methods');
  console.log('are confirmed WITHOUT being attached to the customer during the confirmation process.');
  console.log('This leaves "orphaned" payment methods that cannot be reused.');
}

diagnoseSetupIntentFlow().catch(console.error);