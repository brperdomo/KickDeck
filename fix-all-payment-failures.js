/**
 * Fix All Payment Failures
 * 
 * This script resets payment_failed status for all teams back to setup_intent_completed
 * so they can be approved successfully with the new customer recovery system.
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { teams } from './db/schema.ts';
import { eq } from 'drizzle-orm';

dotenv.config();

async function fixAllPaymentFailures() {
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);
  
  console.log('🔧 FIXING ALL TEAMS WITH PAYMENT FAILURES');
  console.log('==========================================');
  
  try {
    // Get all teams with payment_failed status
    const failedTeams = await db
      .select({ id: teams.id, name: teams.name, paymentStatus: teams.paymentStatus })
      .from(teams)
      .where(eq(teams.paymentStatus, 'payment_failed'));
    
    console.log(`Found ${failedTeams.length} teams with payment_failed status`);
    
    if (failedTeams.length === 0) {
      console.log('✅ No teams need fixing!');
      return;
    }
    
    // Reset all failed teams back to setup_intent_completed status
    const result = await db
      .update(teams)
      .set({ 
        paymentStatus: 'setup_intent_completed',
        notes: 'Payment status reset - customer recovery system now handles broken customer IDs automatically'
      })
      .where(eq(teams.paymentStatus, 'payment_failed'));
    
    console.log('✅ FIXED ALL PAYMENT FAILURES');
    console.log(`Updated ${failedTeams.length} teams to setup_intent_completed status`);
    console.log('Teams can now be approved successfully with automatic customer recovery');
    
    // Show sample of fixed teams
    console.log('\n📋 SAMPLE OF FIXED TEAMS:');
    failedTeams.slice(0, 5).forEach(team => {
      console.log(`  - ${team.name} (ID: ${team.id})`);
    });
    
    if (failedTeams.length > 5) {
      console.log(`  ... and ${failedTeams.length - 5} more teams`);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await sql.end();
  }
}

fixAllPaymentFailures().catch(console.error);