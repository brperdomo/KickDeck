/**
 * Test Registration Email Flow
 * 
 * This script tests the email sending functionality using actual team data
 * to verify that the registration confirmation emails work in production.
 */

require('dotenv').config();
const { db } = require('./db');
const { teams, events, age_groups } = require('./db/schema');
const { eq } = require('drizzle-orm');

// Import the email service
const { sendRegistrationConfirmationEmail } = require('./server/services/emailService');

async function testRegistrationEmailFlow() {
  try {
    console.log('=== Testing Registration Email Flow ===');
    
    // Get the most recent team registration from bperdomo@zoho.com
    const recentTeam = await db.select()
      .from(teams)
      .where(eq(teams.submitterEmail, 'bperdomo@zoho.com'))
      .orderBy(teams.createdAt.desc())
      .limit(1);

    if (recentTeam.length === 0) {
      console.log('No recent teams found for testing');
      return;
    }

    const team = recentTeam[0];
    console.log(`Testing with Team ${team.id}: ${team.name}`);

    // Get event data
    const eventData = await db.select()
      .from(events)
      .where(eq(events.id, team.eventId));

    // Get age group data  
    const ageGroupData = await db.select()
      .from(age_groups)
      .where(eq(age_groups.id, team.ageGroupId));

    const event = eventData[0];
    const ageGroup = ageGroupData[0];

    console.log(`Event: ${event?.name || 'Unknown'}`);
    console.log(`Age Group: ${ageGroup?.ageGroup || 'Unknown'}`);
    console.log(`Submitter: ${team.submitterEmail}`);

    // Test sending the registration confirmation email
    console.log('\nSending registration confirmation email...');
    
    await sendRegistrationConfirmationEmail(
      team.submitterEmail,
      team,
      event,
      ageGroup,
      null // bracket data
    );

    console.log('✓ Registration confirmation email test completed successfully');
    console.log(`Email should have been sent to: ${team.submitterEmail}`);

  } catch (error) {
    console.error('✗ Registration email test failed:', error.message);
    console.error('Full error:', error);
  }
}

testRegistrationEmailFlow();