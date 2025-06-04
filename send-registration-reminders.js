/**
 * Send Registration Reminders Script
 * 
 * This script identifies users with incomplete team registrations and sends
 * reminder emails to help them complete their registration process.
 * 
 * Usage:
 *   node send-registration-reminders.js [options]
 * 
 * Options:
 *   --dry-run          Show what would be sent without actually sending emails
 *   --hours=24         Hours since last update to trigger reminder (default: 24)
 *   --base-url=URL     Base URL for registration links (default: current domain)
 * 
 * Examples:
 *   node send-registration-reminders.js --dry-run
 *   node send-registration-reminders.js --hours=48
 *   node send-registration-reminders.js --base-url=https://yourdomain.com
 */

import { db } from "./db/index.js";
import * as reminderService from "./server/services/registrationReminderService.js";
import { createRegistrationReminderTemplate } from "./create-registration-reminder-template.js";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const hoursArg = args.find(arg => arg.startsWith('--hours='));
const baseUrlArg = args.find(arg => arg.startsWith('--base-url='));

const reminderThresholdHours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : 'https://your-domain.com';

async function sendRegistrationReminders() {
  console.log('='.repeat(60));
  console.log('REGISTRATION REMINDER EMAIL SYSTEM');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no emails will be sent)' : 'LIVE (emails will be sent)'}`);
  console.log(`Reminder threshold: ${reminderThresholdHours} hours`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('');

  try {
    // Ensure the email template exists
    console.log('1. Checking email template...');
    await createRegistrationReminderTemplate();
    console.log('✓ Email template ready');
    console.log('');

    // Get incomplete registrations
    console.log('2. Finding incomplete registrations...');
    const incompleteRegs = await reminderService.getIncompleteRegistrations(reminderThresholdHours);
    
    if (incompleteRegs.length === 0) {
      console.log('✓ No incomplete registrations found that need reminders');
      console.log('');
      console.log('Summary:');
      console.log('- Total incomplete registrations found: 0');
      console.log('- No action needed');
      return;
    }

    console.log(`✓ Found ${incompleteRegs.length} incomplete registrations`);
    console.log('');

    // Display details about what will be processed
    console.log('Incomplete registrations found:');
    console.log('-'.repeat(50));
    incompleteRegs.forEach((reg, index) => {
      const daysSinceUpdate = Math.floor((Date.now() - reg.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${index + 1}. ${reg.submitterName} (${reg.submitterEmail})`);
      console.log(`   Event: ${reg.eventName}`);
      console.log(`   Current step: ${reg.currentStep}`);
      console.log(`   Last updated: ${daysSinceUpdate} days ago`);
      console.log(`   Deadline: ${reg.registrationDeadline}`);
      console.log('');
    });

    // Send reminders
    console.log('3. Sending reminder emails...');
    const results = await reminderService.sendAllRegistrationReminders(
      reminderThresholdHours,
      baseUrl,
      dryRun
    );

    console.log('');
    console.log('='.repeat(60));
    console.log('RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total incomplete registrations found: ${results.totalFound}`);
    console.log(`Emails sent successfully: ${results.emailsSent}`);
    console.log(`Emails failed: ${results.emailsFailed}`);
    console.log('');

    if (results.results.length > 0) {
      console.log('Detailed results:');
      console.log('-'.repeat(50));
      results.results.forEach((result, index) => {
        const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
        console.log(`${index + 1}. ${status} - ${result.email} (${result.eventName})`);
        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`);
        }
      });
    }

    console.log('');
    if (dryRun) {
      console.log('🔍 This was a dry run - no emails were actually sent');
      console.log('To send emails for real, run without --dry-run flag');
    } else {
      console.log('📧 Reminder emails have been sent');
    }

    // Clean up expired carts
    console.log('');
    console.log('4. Cleaning up expired registration carts...');
    const deletedCount = await reminderService.cleanupExpiredCarts();
    console.log(`✓ Cleaned up ${deletedCount} expired carts`);

  } catch (error) {
    console.error('');
    console.error('❌ Error during reminder email process:');
    console.error(error);
    console.error('');
    throw error;
  }
}

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Registration Reminder Email System

This script finds users who have incomplete team registrations and sends
them reminder emails to complete their registration process.

Usage:
  node send-registration-reminders.js [options]

Options:
  --dry-run          Show what would be sent without actually sending emails
  --hours=24         Hours since last update to trigger reminder (default: 24)
  --base-url=URL     Base URL for registration links (default: current domain)
  --help, -h         Show this help message

Examples:
  node send-registration-reminders.js --dry-run
    Show what reminders would be sent without sending any emails

  node send-registration-reminders.js --hours=48
    Send reminders for registrations not updated in 48 hours

  node send-registration-reminders.js --base-url=https://yourdomain.com
    Use a specific base URL for registration continuation links

  node send-registration-reminders.js --hours=72 --dry-run
    Dry run for registrations not updated in 3 days

The script will:
1. Find incomplete registrations older than the specified threshold
2. Send personalized reminder emails with event details and deadlines
3. Provide registration continuation links
4. Clean up expired registration carts
5. Provide a detailed summary of results
`);
  process.exit(0);
}

// Run the script
sendRegistrationReminders()
  .then(() => {
    console.log('Registration reminder process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Registration reminder process failed:', error);
    process.exit(1);
  });