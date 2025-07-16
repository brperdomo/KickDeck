/**
 * Test Payment Integrity System
 * 
 * This script tests the new payment integrity validation and auto-fix system
 * using a real team with known payment setup issues.
 */

const { Client } = require('pg');
const Stripe = require('stripe');
import { eq } from 'drizzle-orm';

async function testPaymentIntegritySystem() {
  console.log('🧪 TESTING PAYMENT INTEGRITY SYSTEM');
  console.log('='.repeat(50));

  try {
    // Find a team with payment setup issues (likely Team 530 from the error logs)
    console.log('🔍 Finding team with payment setup issues...');
    
    const problematicTeam = await db.query.teams.findFirst({
      where: eq(teams.id, 530), // Team 530 "City SC Southwest G07 DPL" from error logs
      columns: {
        id: true,
        name: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        setupIntentId: true,
        paymentMethodId: true,
        stripeCustomerId: true,
        submitterEmail: true,
        managerEmail: true
      }
    });

    if (!problematicTeam) {
      console.log('❌ Team 530 not found. Searching for any team with issues...');
      
      // Find any team with missing setup
      const anyTeam = await db.select({
        id: teams.id,
        name: teams.name,
        status: teams.status,
        paymentStatus: teams.paymentStatus,
        totalAmount: teams.totalAmount,
        setupIntentId: teams.setupIntentId,
        paymentMethodId: teams.paymentMethodId,
        stripeCustomerId: teams.stripeCustomerId
      })
      .from(teams)
      .where(eq(teams.status, 'registered'))
      .limit(5);
      
      console.log(`Found ${anyTeam.length} registered teams to test with`);
      if (anyTeam.length === 0) {
        console.log('❌ No registered teams found for testing');
        return;
      }
      
      // Use first team with an amount
      const testTeam = anyTeam.find(t => t.totalAmount && t.totalAmount > 0);
      if (!testTeam) {
        console.log('❌ No teams found with amounts for testing');
        return;
      }
      
      console.log(`Using Team ${testTeam.id}: ${testTeam.name} for testing`);
      await runIntegrityTest(testTeam.id);
      return;
    }

    console.log(`\n📋 Testing with Team ${problematicTeam.id}: ${problematicTeam.name}`);
    console.log(`   Status: ${problematicTeam.status}`);
    console.log(`   Payment Status: ${problematicTeam.paymentStatus}`);
    console.log(`   Amount: $${problematicTeam.totalAmount ? (problematicTeam.totalAmount / 100).toFixed(2) : '0.00'}`);
    console.log(`   Setup Intent: ${problematicTeam.setupIntentId || 'None'}`);
    console.log(`   Payment Method: ${problematicTeam.paymentMethodId || 'None'}`);
    console.log(`   Customer ID: ${problematicTeam.stripeCustomerId || 'None'}`);

    await runIntegrityTest(problematicTeam.id);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function runIntegrityTest(teamId) {
  console.log(`\n🔍 STEP 1: Validating Payment Setup for Team ${teamId}`);
  console.log('-'.repeat(40));

  try {
    const validation = await validateTeamPaymentSetup(teamId);
    
    console.log(`Team: ${validation.teamName}`);
    console.log(`Can be approved: ${validation.canBeApproved ? '✅ YES' : '❌ NO'}`);
    
    if (validation.issues.length > 0) {
      console.log('Issues found:');
      validation.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    if (validation.recommendedActions.length > 0) {
      console.log('Recommended actions:');
      validation.recommendedActions.forEach(action => console.log(`  → ${action}`));
    }

    if (!validation.canBeApproved) {
      console.log(`\n🔧 STEP 2: Attempting Auto-Fix for Team ${teamId}`);
      console.log('-'.repeat(40));
      
      const autoFix = await autoFixTeamPaymentSetup(teamId);
      
      console.log(`Auto-fix successful: ${autoFix.success ? '✅ YES' : '❌ NO'}`);
      
      if (autoFix.actions.length > 0) {
        console.log('Actions taken:');
        autoFix.actions.forEach(action => console.log(`  ✅ ${action}`));
      }
      
      if (autoFix.errors.length > 0) {
        console.log('Errors encountered:');
        autoFix.errors.forEach(error => console.log(`  ❌ ${error}`));
      }

      if (autoFix.success) {
        console.log(`\n🔍 STEP 3: Re-validating After Auto-Fix`);
        console.log('-'.repeat(40));
        
        const revalidation = await validateTeamPaymentSetup(teamId);
        
        console.log(`Can be approved now: ${revalidation.canBeApproved ? '✅ YES' : '❌ NO'}`);
        
        if (revalidation.issues.length > 0) {
          console.log('Remaining issues:');
          revalidation.issues.forEach(issue => console.log(`  • ${issue}`));
        }
      }
    }

    console.log(`\n🚨 STEP 4: Testing Prevention System`);
    console.log('-'.repeat(40));
    
    const prevention = await preventApprovalWithoutPaymentSetup(teamId);
    
    console.log(`Prevention result: ${prevention.canApprove ? '✅ ALLOW APPROVAL' : '❌ BLOCK APPROVAL'}`);
    if (prevention.reason) {
      console.log(`Reason: ${prevention.reason}`);
    }
    if (prevention.fixUrl) {
      console.log(`Fix URL: ${prevention.fixUrl}`);
    }

    console.log(`\n📊 SUMMARY FOR TEAM ${teamId}`);
    console.log('='.repeat(30));
    
    if (prevention.canApprove) {
      console.log('✅ SUCCESS! Team is ready for approval');
      console.log('   Payment processing should now work correctly');
      console.log('   No more "Setup Intent without customer" errors');
    } else {
      console.log('❌ Team still blocked from approval');
      console.log('   Manual intervention may be required');
      console.log('   Check recommended actions above');
    }

  } catch (error) {
    console.error(`❌ Integrity test failed for team ${teamId}:`, error);
  }
}

// Run the test
testPaymentIntegritySystem();