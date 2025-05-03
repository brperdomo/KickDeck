# SendGrid Email Integration Guide

This guide explains how to set up SendGrid for email notifications in MatchPro.

## Requirements

1. A SendGrid account (free tier works for testing)
2. API key with full access to "Mail Send" permissions
3. Verified sender domain or email address

## Setup Instructions

### 1. Create a SendGrid Account

If you don't have a SendGrid account:
1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for a free account
3. Complete the account verification process

### 2. Create an API Key

1. In your SendGrid dashboard, go to **Settings > API Keys**
2. Click **Create API Key**
3. Name it something descriptive like "MatchPro Email Service"
4. Select **Restricted Access** and ensure "Mail Send" permission is enabled
5. Create the key and copy it (you won't be able to see it again)

### 3. Verify a Sender Identity

SendGrid requires that you verify the email addresses or domains you send from:

#### Option A: Verify a Single Sender (Quickest)
1. Go to **Settings > Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the form with your details
4. Follow the verification steps sent to your email

#### Option B: Verify a Domain (Recommended for Production)
1. Go to **Settings > Sender Authentication**
2. Click **Verify a Domain**
3. Follow the DNS setup instructions
4. Wait for verification to complete (can take 24-48 hours)

### 4. Configure MatchPro

#### For Development Environment
Add these variables to your `.env` file:
```
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@example.com
```

#### For Production Environment
Set these environment variables on your production server:
```
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@example.com
PRODUCTION_URL=https://your-production-domain.com
NODE_ENV=production
```

The `PRODUCTION_URL` variable is crucial for password reset emails to link to your production environment.

## Testing the Configuration

After setting up SendGrid, you can test it with:

```bash
node test-sendgrid.js recipient@example.com your_verified_sender@example.com
```

For password reset specifically:

```bash
node test-password-reset-sendgrid.js recipient@example.com
```

## Troubleshooting

1. **Emails not sending**: Check SendGrid Activity Feed for errors
2. **Invalid API key errors**: Regenerate your API key and update the environment variables
3. **Email links pointing to wrong domain**: Make sure `PRODUCTION_URL` is set correctly in production
4. **Emails going to spam**: Complete domain verification and follow SendGrid's deliverability guidelines

## Support

If you encounter issues with SendGrid integration:
1. Check the SendGrid documentation: https://docs.sendgrid.com/
2. Review your application logs for specific error messages
3. Contact SendGrid support for account-specific issues