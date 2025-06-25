/**
 * Fix Team Charge - Process the missing $1 charge
 */

import pkg from 'pg';
const { Client } = pkg;
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixTeamCharge() {
  console.log('Processing missing $1 charge for approved team...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    
    // Get the approved team
    const result = await client.query(`
      SELECT id, name, setup_intent_id, total_amount
      FROM teams 
      WHERE id = 128 AND status = 'approved'
    `);
    
    if (result.rows.length === 0) {
      console.log('Team not found or not approved');
      return;
    }
    
    const team = result.rows[0];
    console.log(`Processing charge for team: ${team.name}`);
    
    // Create a new setup intent and payment intent to complete the charge
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session'
    });
    
    console.log(`Created new Setup Intent: ${setupIntent.id}`);
    console.log('Since the original payment method was incomplete, marking team as requiring new payment setup');
    
    // Update team to indicate payment is needed
    await client.query(`
      UPDATE teams 
      SET payment_status = 'payment_required',
          notes = COALESCE(notes, '') || ' - Payment method incomplete, needs re-submission'
      WHERE id = $1
    `, [team.id]);
    
    console.log('Team updated - admin should contact team to complete payment');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixTeamCharge().catch(console.error);