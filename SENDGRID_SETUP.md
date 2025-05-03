# SendGrid Email Integration Guide

This guide explains how MatchPro uses SendGrid for sending all email communications.

## Overview

MatchPro now exclusively uses SendGrid for sending all emails, including:
- Team registration confirmations
- Payment receipts
- Password reset emails
- Administrative notifications

All emails are sent from the standard address `support@matchpro.ai` to maintain brand consistency.

## Configuration

The SendGrid integration has been configured with the following settings:

1. **SendGrid API Key**: Stored securely in the environment as `SENDGRID_API_KEY`
2. **Default Sender**: All emails use `support@matchpro.ai` as the sender
3. **Email Templates**: All email templates have been configured to use SendGrid as their provider

## Verifying Setup

To ensure your SendGrid configuration is working properly:

1. Run the verification script:
   ```
   node verify-sendgrid-config.js your-test-email@example.com
   ```

2. This script will:
   - Check that a SendGrid provider is properly configured in the database
   - Verify all email templates are using the standard sender email
   - Send a test email to the provided address

## Sending Test Emails

For testing specific email types:

1. **Simple Test Email**:
   ```
   node test-sendgrid-direct.js recipient@example.com
   ```

2. **Password Reset Test**:
   ```
   node test-password-reset-sendgrid.js recipient@example.com
   ```

## Updating Configuration

If you need to update the SendGrid configuration or set it up for the first time:

1. Make sure the `SENDGRID_API_KEY` environment variable is set
2. Run the update script:
   ```
   node update-email-config.js
   ```

3. This script will:
   - Create or update the SendGrid provider in the database
   - Set it as the default and active provider
   - Update all email templates to use SendGrid
   - Deactivate any other email providers

## Troubleshooting

If you encounter issues with sending emails:

1. Verify your SendGrid API key is valid and active
2. Check that the sender domain is verified in your SendGrid account
3. Run the verification script to confirm the configuration is correct
4. Check SendGrid logs for any delivery issues or bounces

## Sender Domain Verification

For optimal deliverability:

1. Verify the sending domain (`matchpro.ai`) in your SendGrid account
2. Set up DKIM authentication for the domain
3. Configure SPF records for the domain
4. Set up a dedicated IP address for sending emails (for high volume)

## Maintaining Email Templates

If you create new email templates:

1. Ensure they use `support@matchpro.ai` as the sender
2. Assign them to the SendGrid provider
3. Run the verification script to confirm they're properly configured