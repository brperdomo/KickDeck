/**
 * Registration Reminder Service
 * 
 * This service handles sending reminder emails to users who have incomplete
 * team registrations in their cart.
 */

import { db } from '@db/index';
import { registrationCarts, users, events } from '@db/schema';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq, and, lt, sql } from 'drizzle-orm';
import * as emailService from './emailService';

interface IncompleteRegistration {
  userId: number;
  eventId: number;
  submitterName: string;
  submitterEmail: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  registrationDeadline: string;
  lastUpdated: Date;
  createdAt: Date;
  currentStep: string;
  formData: any;
}

/**
 * Get all incomplete registrations that need reminder emails
 * @param reminderThresholdHours Number of hours since last update to trigger reminder
 * @returns Array of incomplete registrations
 */
export async function getIncompleteRegistrations(reminderThresholdHours: number = 24): Promise<IncompleteRegistration[]> {
  try {
    console.log(`Finding incomplete registrations older than ${reminderThresholdHours} hours...`);
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - reminderThresholdHours);
    
    const incompleteRegs = await db
      .select({
        userId: registrationCarts.userId,
        eventId: registrationCarts.eventId,
        submitterName: users.firstName,
        submitterEmail: users.email,
        eventName: events.name,
        eventStartDate: events.startDate,
        eventEndDate: events.endDate,
        registrationDeadline: events.applicationDeadline,
        lastUpdated: registrationCarts.lastUpdated,
        createdAt: registrationCarts.createdAt,
        currentStep: registrationCarts.currentStep,
        formData: registrationCarts.formData
      })
      .from(registrationCarts)
      .innerJoin(users, eq(registrationCarts.userId, users.id))
      .innerJoin(events, eq(registrationCarts.eventId, events.id))
      .where(
        and(
          lt(registrationCarts.lastUpdated, cutoffTime),
          // Only include active events (not archived)
          eq(events.isArchived, false),
          // Only include carts that haven't expired
          sql`${registrationCarts.expiresAt} > NOW()`
        )
      );
    
    console.log(`Found ${incompleteRegs.length} incomplete registrations`);
    
    return incompleteRegs.map(reg => ({
      userId: reg.userId,
      eventId: reg.eventId,
      submitterName: `${reg.submitterName}`,
      submitterEmail: reg.submitterEmail,
      eventName: reg.eventName,
      eventStartDate: reg.eventStartDate,
      eventEndDate: reg.eventEndDate,
      registrationDeadline: reg.registrationDeadline,
      lastUpdated: reg.lastUpdated!,
      createdAt: reg.createdAt!,
      currentStep: reg.currentStep,
      formData: reg.formData
    }));
    
  } catch (error) {
    console.error('Error fetching incomplete registrations:', error);
    throw error;
  }
}

/**
 * Send a registration reminder email to a specific user
 * @param registration The incomplete registration data
 * @param baseUrl The base URL of the application
 * @returns Success status
 */
export async function sendRegistrationReminder(
  registration: IncompleteRegistration,
  baseUrl: string
): Promise<boolean> {
  try {
    console.log(`Sending reminder to ${registration.submitterEmail} for event ${registration.eventName}`);
    
    // Get the registration reminder email template
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.type, 'registration_reminder'),
          eq(emailTemplates.isActive, true)
        )
      )
      .limit(1);
    
    if (!template) {
      console.error('Registration reminder email template not found');
      return false;
    }
    
    // Format dates for display
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateStr;
      }
    };
    
    // Prepare template variables
    const templateData = {
      submitterName: registration.submitterName,
      eventName: registration.eventName,
      registrationDeadline: formatDate(registration.registrationDeadline),
      eventStartDate: formatDate(registration.eventStartDate),
      eventEndDate: formatDate(registration.eventEndDate),
      continueRegistrationUrl: `${baseUrl}/events/${registration.eventId}/register`
    };
    
    // Send the email
    const emailSent = await emailService.sendEmail({
      to: registration.submitterEmail,
      subject: template.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => templateData[key as keyof typeof templateData] || match),
      templateId: template.sendgridTemplateId || undefined,
      templateData,
      fallbackHtml: template.content,
      senderName: template.senderName,
      senderEmail: template.senderEmail
    });
    
    if (emailSent) {
      console.log(`Reminder email sent successfully to ${registration.submitterEmail}`);
      return true;
    } else {
      console.error(`Failed to send reminder email to ${registration.submitterEmail}`);
      return false;
    }
    
  } catch (error) {
    console.error(`Error sending reminder email to ${registration.submitterEmail}:`, error);
    return false;
  }
}

/**
 * Send reminder emails to all users with incomplete registrations
 * @param reminderThresholdHours Number of hours since last update to trigger reminder
 * @param baseUrl The base URL of the application
 * @param dryRun If true, only log what would be sent without actually sending
 * @returns Summary of results
 */
export async function sendAllRegistrationReminders(
  reminderThresholdHours: number = 24,
  baseUrl: string = 'https://your-domain.com',
  dryRun: boolean = false
): Promise<{
  totalFound: number;
  emailsSent: number;
  emailsFailed: number;
  results: Array<{ email: string; eventName: string; success: boolean; error?: string }>;
}> {
  try {
    console.log(`Starting reminder email process (dry run: ${dryRun})...`);
    
    const incompleteRegistrations = await getIncompleteRegistrations(reminderThresholdHours);
    const results: Array<{ email: string; eventName: string; success: boolean; error?: string }> = [];
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const registration of incompleteRegistrations) {
      if (dryRun) {
        console.log(`[DRY RUN] Would send reminder to ${registration.submitterEmail} for ${registration.eventName}`);
        results.push({
          email: registration.submitterEmail,
          eventName: registration.eventName,
          success: true
        });
        emailsSent++;
      } else {
        try {
          const success = await sendRegistrationReminder(registration, baseUrl);
          results.push({
            email: registration.submitterEmail,
            eventName: registration.eventName,
            success
          });
          
          if (success) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
          
          // Add a small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Failed to send reminder to ${registration.submitterEmail}:`, error);
          results.push({
            email: registration.submitterEmail,
            eventName: registration.eventName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          emailsFailed++;
        }
      }
    }
    
    const summary = {
      totalFound: incompleteRegistrations.length,
      emailsSent,
      emailsFailed,
      results
    };
    
    console.log('Reminder email process completed:', summary);
    return summary;
    
  } catch (error) {
    console.error('Error in sendAllRegistrationReminders:', error);
    throw error;
  }
}

/**
 * Mark a registration cart as having received a reminder
 * This can be used to track reminder frequency and avoid spam
 */
export async function markReminderSent(userId: number, eventId: number): Promise<void> {
  try {
    // Add a field to track last reminder sent
    await db.execute(sql`
      UPDATE registration_carts 
      SET last_reminder_sent = NOW()
      WHERE user_id = ${userId} AND event_id = ${eventId}
    `);
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
  }
}

/**
 * Clean up expired registration carts
 * This should be run periodically to remove old, expired carts
 */
export async function cleanupExpiredCarts(): Promise<number> {
  try {
    console.log('Cleaning up expired registration carts...');
    
    const result = await db.execute(sql`
      DELETE FROM registration_carts 
      WHERE expires_at < NOW()
    `);
    
    const deletedCount = result.rowCount || 0;
    console.log(`Cleaned up ${deletedCount} expired registration carts`);
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired carts:', error);
    throw error;
  }
}