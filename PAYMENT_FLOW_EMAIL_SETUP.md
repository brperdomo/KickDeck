# Setting Up Payment Flow Email Templates in SendGrid

This document provides instructions for setting up the email templates needed for the two-step payment flow process in SendGrid. In this flow, a customer's payment information is collected during registration but only charged after team approval.

## Template Overview

We have created four email templates for the different stages of the payment flow:

1. **Registration Submission** (`registration_submission`)
   - Sent when a customer submits a team registration with payment information
   - Informs the customer that their team is pending approval
   - Confirms their card details have been stored but not yet charged

2. **Team Approved - Payment Processed** (`team_approved_payment`)
   - Sent when a team is approved by an administrator
   - Notifies the customer that payment has been processed
   - Includes a detailed receipt with payment information

3. **Team Rejected - No Payment** (`team_rejected`)
   - Sent when a team is rejected by an administrator
   - Informs the customer that their card has NOT been charged
   - Provides rejection reason and alternative options

4. **Team Waitlisted** (`team_waitlisted`)
   - Sent when a team is placed on the waitlist
   - Explains the waitlist process and position
   - Clarifies that payment will only be processed if the team is later approved

## Setup Steps

### 1. Create Database Templates

First, run the script to create the email templates in the database:

```
node create-payment-flow-templates.js
```

This will create the template records in the database if they don't already exist.

### 2. Create SendGrid Dynamic Templates

1. Log in to your SendGrid account
2. Go to Email API > Dynamic Templates
3. Create four new templates with the "Create Template" button
4. For each template:
   - Give it a clear name that matches our template types (e.g., "Registration Submission")
   - Click "Add Version" to create a template version
   - Choose "Code Editor" or "Design Editor" based on your preference

### 3. Copy HTML Templates to SendGrid

For each of the four templates:

1. Open the corresponding HTML file from the `templates` directory:
   - `registration-submission-template.html`
   - `payment-processed-template.html`
   - `team-rejection-template.html`
   - `waitlist-template.html`

2. Copy the entire HTML content of each file

3. In SendGrid's template editor:
   - If using Code Editor: Paste the HTML directly
   - If using Design Editor: Use the "Import HTML" option to paste the code

4. Save each template version

5. Make note of each template's ID (it will start with "d-" followed by a string of characters)

### 4. Map SendGrid Templates in Your Application

You can use the admin dashboard to map each SendGrid template ID to the corresponding application template type, or run scripts to set the mappings directly:

```
# Example using Node.js script
node map-sendgrid-template.js registration_submission d-abcdef123456
node map-sendgrid-template.js team_approved_payment d-ghijkl789012
node map-sendgrid-template.js team_rejected d-mnopqr345678
node map-sendgrid-template.js team_waitlisted d-stuvwx901234
```

Replace `d-abcdef123456` with your actual SendGrid template IDs.

### 5. Test the Templates

Use the testing script to verify that the templates are correctly set up and working:

```
# Test a single template
node test-payment-flow-templates.js submission your-email@example.com
node test-payment-flow-templates.js approved your-email@example.com
node test-payment-flow-templates.js rejected your-email@example.com
node test-payment-flow-templates.js waitlist your-email@example.com

# Test all templates at once
node test-payment-flow-templates.js all your-email@example.com
```

## Template Variables

The templates use Handlebars syntax (`{{variableName}}`) for dynamic content. Here are the key variables used in the templates:

### Common Variables in All Templates
- `{{submitterName}}` - Name of the person who submitted the registration
- `{{submitterEmail}}` - Email of the person who submitted the registration
- `{{teamName}}` - Name of the registered team
- `{{eventName}}` - Name of the event the team registered for
- `{{ageGroup}}` - Age group/division of the team
- `{{registrationDate}}` - Date the registration was submitted
- `{{clubName}}` - Name of the club (if applicable)
- `{{branding.primaryColor}}` - Primary color from event branding
- `{{branding.logoUrl}}` - Logo URL from event branding
- `{{organizationName}}` - Name of your organization
- `{{supportEmail}}` - Support email address
- `{{currentYear}}` - Current year for copyright notices

### Template-Specific Variables

**Registration Submission**
- `{{totalAmount}}` - Total registration amount due
- `{{setupIntentId}}` - Stripe Setup Intent ID for the saved card
- `{{cardBrand}}` - Card brand (Visa, Mastercard, etc.)
- `{{cardLastFour}}` - Last 4 digits of the saved card
- `{{selectedFees}}` - Array of selected fees with names and amounts
- `{{loginLink}}` - Link to the user dashboard

**Team Approved - Payment Processed**
- `{{totalAmount}}` - Total amount charged
- `{{paymentDate}}` - Date payment was processed
- `{{paymentId}}` - Transaction ID/Payment Intent ID
- `{{receiptNumber}}` - Receipt/invoice number
- `{{cardBrand}}` - Card brand used for payment
- `{{cardLastFour}}` - Last 4 digits of the card
- `{{selectedFees}}` - Array of fees charged
- `{{loginLink}}` - Link to the user dashboard

**Team Rejected**
- `{{rejectionReason}}` - Reason provided for team rejection
- `{{setupIntentId}}` - Stripe Setup Intent ID (if card was provided)
- `{{cardBrand}}` - Card brand (if provided)
- `{{cardLastFour}}` - Last 4 digits of card (if provided)
- `{{eventsListUrl}}` - URL to browse other available events

**Team Waitlisted**
- `{{totalAmount}}` - Total amount that will be charged if approved
- `{{setupIntentId}}` - Stripe Setup Intent ID for the saved card
- `{{cardBrand}}` - Card brand (if provided)
- `{{cardLastFour}}` - Last 4 digits of card (if provided)
- `{{selectedFees}}` - Array of fees to be charged if approved
- `{{waitlistPosition}}` - Position on the waitlist
- `{{waitlistNote}}` - Additional note about waitlist status
- `{{loginLink}}` - Link to the user dashboard

## Helper Functions

The templates use the following helper function that you'll need to define in SendGrid:

- `{{formatCurrency amount}}` - Formats a number as currency (e.g., $150.00)

## Troubleshooting

If you encounter issues with the email templates:

1. **Template Not Found**: Make sure the template exists in the database by running `create-payment-flow-templates.js`

2. **SendGrid Template ID Not Set**: Check that you've properly mapped the SendGrid template IDs in your application

3. **Email Not Sending**: Verify your SendGrid API key is set correctly in the environment variables

4. **Template Rendering Issues**: Test the template in SendGrid's testing tool to ensure variables are properly formatted

5. **Missing Data**: Check that all required variables are being passed when sending emails

For additional assistance, refer to SendGrid's documentation on dynamic templates at https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates