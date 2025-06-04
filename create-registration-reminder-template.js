/**
 * Create Registration Reminder Email Template
 * 
 * This script creates the email template for sending reminders to users
 * who have incomplete team registrations in their cart.
 */

import { db } from "./db/index.js";
import { emailTemplates } from "./db/schema/emailTemplates.js";
import { eq } from "drizzle-orm";

const registrationReminderTemplate = {
  name: 'Registration Reminder',
  description: 'Template for reminding users to complete their team registration',
  type: 'registration_reminder',
  subject: 'Complete Your {{eventName}} Registration',
  content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Complete Your Team Registration</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background-color: #2C5282;
      color: white;
      text-align: center;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .event-info {
      background-color: #EBF8FF;
      border-left: 4px solid #2C5282;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .event-info h3 {
      margin: 0 0 10px 0;
      color: #2C5282;
      font-size: 18px;
    }
    .event-info p {
      margin: 5px 0;
      color: #2D3748;
    }
    .deadline-warning {
      background-color: #FED7D7;
      border: 1px solid #FC8181;
      color: #C53030;
      padding: 15px;
      margin: 20px 0;
      border-radius: 6px;
      text-align: center;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background-color: #2C5282;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .button:hover {
      background-color: #2A4365;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eee;
      background-color: #f8f9fa;
    }
    .progress-saved {
      background-color: #F0FFF4;
      border: 1px solid #68D391;
      color: #2F855A;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Complete Your Team Registration</h1>
    </div>
    <div class="content">
      <p>Hello {{submitterName}},</p>
      
      <p>We noticed you started registering a team for <strong>{{eventName}}</strong> but haven't completed the process yet.</p>
      
      <div class="event-info">
        <h3>{{eventName}}</h3>
        <p><strong>Registration Deadline:</strong> {{registrationDeadline}}</p>
        <p><strong>Event Dates:</strong> {{eventStartDate}} - {{eventEndDate}}</p>
      </div>
      
      <div class="progress-saved">
        <strong>Good news!</strong> Your progress has been saved and you can continue right where you left off.
      </div>
      
      <div class="deadline-warning">
        ⏰ Registration closes on {{registrationDeadline}}
      </div>
      
      <p>Don't miss out on this opportunity! Complete your registration now to secure your team's spot in the tournament.</p>
      
      <div class="button-container">
        <a href="{{continueRegistrationUrl}}" class="button">Complete Registration Now</a>
      </div>
      
      <p>If you have any questions or need assistance with your registration, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      The Tournament Team</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. Please do not reply to this email.</p>
      <p>If you no longer wish to receive these reminders, you can complete or cancel your registration.</p>
    </div>
  </div>
</body>
</html>`,
  senderName: 'Tournament Registration',
  senderEmail: 'registration@matchpro.ai',
  variables: [
    'submitterName',
    'eventName', 
    'registrationDeadline',
    'eventStartDate',
    'eventEndDate',
    'continueRegistrationUrl'
  ],
  isActive: true
};

async function createRegistrationReminderTemplate() {
  console.log("Creating registration reminder email template...");
  
  try {
    // Check if template already exists
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'registration_reminder'))
      .limit(1);
    
    if (existingTemplate.length > 0) {
      console.log("Registration reminder template already exists");
      console.log("Template ID:", existingTemplate[0].id);
      return existingTemplate[0];
    }
    
    // Create the template
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(registrationReminderTemplate)
      .returning();
    
    console.log("Registration reminder template created successfully");
    console.log("Template ID:", newTemplate.id);
    console.log("Template type:", newTemplate.type);
    
    return newTemplate;
    
  } catch (error) {
    console.error("Error creating registration reminder template:", error);
    throw error;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRegistrationReminderTemplate()
    .then((template) => {
      console.log("Registration reminder template setup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create registration reminder template:", error);
      process.exit(1);
    });
}

export { createRegistrationReminderTemplate };