/**
 * Payment Integrity System Scanner
 * 
 * This script scans all teams for payment setup issues and provides
 * a comprehensive report of teams that would fail approval.
 */

import { scanAllTeamsForPaymentIssues, autoFixTeamPaymentSetup } from './server/services/payment-integrity-service.js';

async function main() {
  console.log('🔍 PAYMENT INTEGRITY SYSTEM SCAN');
  console.log('='.repeat(60));
  console.log('Scanning all teams for payment setup issues...\n');

  try {
    const reports = await scanAllTeamsForPaymentIssues();
    
    if (reports.length === 0) {
      console.log('✅ EXCELLENT! No payment integrity issues found.');
      console.log('All teams with amounts are ready for approval.');
      return;
    }

    console.log(`🚨 FOUND ${reports.length} TEAMS WITH PAYMENT SETUP ISSUES:`);
    console.log('='.repeat(60));

    for (const report of reports) {
      console.log(`\n📋 Team: ${report.teamName} (ID: ${report.teamId})`);
      console.log(`   Status: ${report.canBeApproved ? '✅ READY' : '❌ BLOCKED'}`);
      
      if (report.issues.length > 0) {
        console.log('   Issues:');
        report.issues.forEach(issue => console.log(`     • ${issue}`));
      }
      
      if (report.recommendedActions.length > 0) {
        console.log('   Recommended Actions:');
        report.recommendedActions.forEach(action => console.log(`     → ${action}`));
      }
    }

    // Offer to run auto-fix
    console.log('\n🔧 AUTO-FIX OPTION');
    console.log('='.repeat(30));
    console.log('Do you want to attempt automatic fixes for these teams?');
    console.log('This will:');
    console.log('  • Create missing Stripe customers');
    console.log('  • Attach payment methods to customers');
    console.log('  • Fix customer association issues');
    console.log('\nRun with "fix" argument to execute auto-fixes:');
    console.log('  node scan-payment-integrity.js fix');

  } catch (error) {
    console.error('❌ Scan failed:', error);
  }
}

async function runAutoFix() {
  console.log('🔧 RUNNING AUTO-FIX FOR ALL TEAMS');
  console.log('='.repeat(50));

  try {
    const reports = await scanAllTeamsForPaymentIssues();
    
    if (reports.length === 0) {
      console.log('✅ No teams need fixing.');
      return;
    }

    let fixedCount = 0;
    let failedCount = 0;

    for (const report of reports) {
      console.log(`\n🔧 Fixing Team: ${report.teamName} (ID: ${report.teamId})`);
      
      try {
        const autoFix = await autoFixTeamPaymentSetup(report.teamId);
        
        if (autoFix.success && autoFix.actions.length > 0) {
          console.log(`   ✅ FIXED: ${autoFix.actions.join(', ')}`);
          fixedCount++;
        } else if (autoFix.errors.length > 0) {
          console.log(`   ❌ FAILED: ${autoFix.errors.join(', ')}`);
          failedCount++;
        } else {
          console.log(`   ⚠️  NO ACTION NEEDED`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error}`);
        failedCount++;
      }
    }

    console.log('\n📊 AUTO-FIX SUMMARY:');
    console.log(`   Fixed: ${fixedCount} teams`);
    console.log(`   Failed: ${failedCount} teams`);
    console.log(`   Total: ${reports.length} teams processed`);

    if (fixedCount > 0) {
      console.log('\n✅ Teams fixed and ready for approval!');
      console.log('Run scan again to verify all issues resolved.');
    }

  } catch (error) {
    console.error('❌ Auto-fix failed:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('fix')) {
  runAutoFix();
} else {
  main();
}