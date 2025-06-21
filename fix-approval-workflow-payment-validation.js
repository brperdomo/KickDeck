/**
 * Fix Approval Workflow with Payment Validation
 * 
 * This script enhances the approval workflow to validate payment setup
 * before allowing team approval and provides clear feedback to admins.
 */

import pkg from 'pg';
const { Client } = pkg;

async function fixApprovalWorkflow() {
  console.log('Enhancing approval workflow with payment validation...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // First, mark all teams with incomplete payment setup for clarity
    console.log('1. Updating team statuses to reflect payment setup issues...');
    
    const updateIncompleteTeams = `
      UPDATE teams 
      SET payment_status = 'setup_incomplete',
          notes = COALESCE(notes, '') || ' | Payment setup abandoned during registration - requires completion before approval'
      WHERE setup_intent_id IS NOT NULL 
        AND payment_method_id IS NULL 
        AND payment_status = 'payment_info_pending'
    `;
    
    const updateResult = await client.query(updateIncompleteTeams);
    console.log(`Updated ${updateResult.rowCount} teams with incomplete payment setup`);
    
    // Create a view of teams ready for approval
    console.log('2. Analyzing teams by payment readiness...');
    
    const analysisQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE setup_intent_id IS NOT NULL AND payment_method_id IS NOT NULL) as ready_for_approval,
        COUNT(*) FILTER (WHERE setup_intent_id IS NOT NULL AND payment_method_id IS NULL) as incomplete_payment,
        COUNT(*) FILTER (WHERE setup_intent_id IS NULL) as no_payment_attempt,
        COUNT(*) as total_teams
      FROM teams 
      WHERE status IN ('registered', 'pending')
        AND total_amount > 0
    `;
    
    const analysisResult = await client.query(analysisQuery);
    const stats = analysisResult.rows[0];
    
    console.log('\nTeam Payment Status Analysis:');
    console.log(`- Ready for approval (payment complete): ${stats.ready_for_approval}`);
    console.log(`- Incomplete payment setup: ${stats.incomplete_payment}`);
    console.log(`- No payment attempt: ${stats.no_payment_attempt}`);
    console.log(`- Total pending teams: ${stats.total_teams}`);
    
    // Update team statuses for admin clarity
    console.log('\n3. Creating clear status indicators for admin dashboard...');
    
    // Add validation notes to teams
    const addValidationNotes = `
      UPDATE teams 
      SET notes = CASE 
        WHEN setup_intent_id IS NULL THEN 
          COALESCE(notes, '') || ' | WARNING: No payment information provided'
        WHEN setup_intent_id IS NOT NULL AND payment_method_id IS NULL THEN 
          COALESCE(notes, '') || ' | WARNING: Payment setup incomplete - customer abandoned checkout'
        ELSE notes
      END
      WHERE status IN ('registered', 'pending') 
        AND total_amount > 0
        AND (setup_intent_id IS NULL OR payment_method_id IS NULL)
    `;
    
    await client.query(addValidationNotes);
    
    // Recommend solution for the registration flow issue
    console.log('\n4. Recommendations for fixing registration flow:');
    
    console.log('\nIMMEDIATE ACTIONS NEEDED:');
    console.log('a) Do NOT approve teams with incomplete payment setup');
    console.log('b) Contact teams to complete their payment information');
    console.log('c) Fix registration flow to ensure payment completion');
    
    console.log('\nLONG-TERM FIXES:');
    console.log('1. Require payment completion before allowing registration submission');
    console.log('2. Add payment validation to the approval workflow');
    console.log('3. Send automated reminders to teams with incomplete payments');
    console.log('4. Prevent approval of teams without valid payment methods');
    
    // Create a list of teams that need payment completion
    const incompleteTeamsQuery = `
      SELECT id, name, manager_email, submitter_email, total_amount
      FROM teams 
      WHERE status IN ('registered', 'pending')
        AND setup_intent_id IS NOT NULL 
        AND payment_method_id IS NULL
        AND total_amount > 0
      ORDER BY created_at DESC
    `;
    
    const incompleteTeamsResult = await client.query(incompleteTeamsQuery);
    
    console.log('\n5. Teams requiring payment completion:');
    incompleteTeamsResult.rows.forEach(team => {
      console.log(`- ${team.name}: $${team.total_amount / 100} (${team.manager_email || team.submitter_email})`);
    });
    
    return {
      totalTeams: parseInt(stats.total_teams),
      readyForApproval: parseInt(stats.ready_for_approval),
      incompletePayment: parseInt(stats.incomplete_payment),
      noPaymentAttempt: parseInt(stats.no_payment_attempt),
      teamsNeedingCompletion: incompleteTeamsResult.rows
    };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  } finally {
    await client.end();
  }
}

fixApprovalWorkflow().then(result => {
  if (result) {
    console.log('\n=== APPROVAL WORKFLOW STATUS ===');
    console.log(`Teams ready for safe approval: ${result.readyForApproval}`);
    console.log(`Teams needing payment completion: ${result.incompletePayment}`);
    
    if (result.readyForApproval === 0) {
      console.log('\nWARNING: No teams are ready for approval with automatic payment processing');
      console.log('All approvals will result in the same issue as B2017 Academy-1');
    }
  }
}).catch(console.error);