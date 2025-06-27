/**
 * Fix Team 175 - Direct Card Payment Method
 * 
 * This team successfully registered with a direct credit card
 * but needs customer association for approval charging.
 */

import Stripe from 'stripe';
import { db } from './db/index.ts';
import { teams } from './db/schema.ts';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function fixTeam175() {
  console.log('🔧 Fixing Team 175 (direct card payment)...');
  
  const teamId = 175;
  const successfulSetupIntentId = 'seti_1ReSXZP4BpmZARxtBHone2rq';
  const paymentMethodId = 'pm_1ReSY1P4BpmZARxtxNgrEgZh';
  
  try {
    // Get team info
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      columns: {
        id: true,
        name: true,
        submitterEmail: true,
        submitterName: true,
        setupIntentId: true,
        stripeCustomerId: true,
        paymentMethodId: true
      }
    });
    
    if (!team) {
      console.log('❌ Team 175 not found');
      return;
    }
    
    console.log(`Team: ${team.name}`);
    console.log(`Email: ${team.submitterEmail}`);
    console.log(`Current Setup Intent: ${team.setupIntentId}`);
    console.log(`Current Customer: ${team.stripeCustomerId}`);
    
    // Create customer for the team
    const customer = await stripe.customers.create({
      email: team.submitterEmail,
      name: team.submitterName || 'Team Manager',
      metadata: {
        teamId: team.id.toString(),
        teamName: team.name || 'Unknown Team',
        registrationFlow: 'direct_card_payment'
      }
    });
    
    console.log(`✅ Created customer: ${customer.id}`);
    
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    });
    
    console.log(`✅ Attached payment method ${paymentMethodId} to customer`);
    
    // Update team record with correct setup intent and customer
    await db.update(teams)
      .set({ 
        setupIntentId: successfulSetupIntentId,
        paymentMethodId: paymentMethodId,
        stripeCustomerId: customer.id,
        paymentStatus: 'payment_info_provided',
        notes: `Direct card payment setup completed. Customer created and payment method attached. Ready for approval charging.`
      })
      .where(eq(teams.id, teamId));
    
    console.log('✅ Team 175 updated with complete payment setup');
    console.log(`   Setup Intent: ${successfulSetupIntentId}`);
    console.log(`   Payment Method: ${paymentMethodId} (CARD type)`);
    console.log(`   Customer: ${customer.id}`);
    console.log('');
    console.log('🎉 Team 175 is now ready for approval charging with direct card payment!');
    
  } catch (error) {
    console.error(`❌ Error fixing team 175: ${error.message}`);
  }
}

fixTeam175();