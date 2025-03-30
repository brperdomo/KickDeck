# Email Template Guide

This document provides detailed information about the available template types and their merge fields. Use this as a reference when customizing email templates in the admin dashboard.

## Available Template Types

### General Templates

| Template Type | Description | Use Case |
|---------------|-------------|----------|
| welcome | Welcome email when a user signs up | Sent when a new user creates an account |
| password_reset | Password reset notification | Sent when a user requests a password reset |

### Team Registration Templates

| Template Type | Description | Use Case |
|---------------|-------------|----------|
| team_status_update | General notification for status changes | Sent when a team's status is updated (general purpose) |
| team_approved | Notification for team approval | Sent when a team is specifically approved |
| team_rejected | Notification for team rejection | Sent when a team is specifically rejected |
| team_withdrawn | Notification for team withdrawal | Sent when a team is specifically withdrawn |
| payment_confirmation | Confirmation after successful payment | Sent when a payment is completed successfully |
| payment_refunded | Notification when a payment is refunded | Sent when a refund has been processed |

## Merge Fields (Variables) By Template Type

### Password Reset Template (password_reset)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{reset_link}} | https://example.com/reset/token123 | The URL for resetting the password |

### Welcome Template (welcome)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{username}} | john.smith | The user's username |
| {{email}} | john.smith@example.com | The user's email address |
| {{firstName}} | John | The user's first name |
| {{lastName}} | Smith | The user's last name |

### Team Status Update Template (team_status_update)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{teamName}} | Seattle Sharks | The name of the team |
| {{eventName}} | Spring Soccer Tournament 2025 | The name of the event |
| {{status}} | approved | The new status of the team |
| {{previousStatus}} | registered | The previous status of the team |
| {{notes}} | Your team has been approved based on your application. | Additional notes from administrators |
| {{loginLink}} | https://matchpro.ai/dashboard | Link to the user dashboard |

### Team Approved Template (team_approved)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{teamName}} | Seattle Sharks | The name of the team |
| {{eventName}} | Spring Soccer Tournament 2025 | The name of the event |
| {{notes}} | Please make sure all players have proper ID. | Additional notes from administrators |
| {{loginLink}} | https://matchpro.ai/dashboard | Link to the user dashboard |

### Team Rejected Template (team_rejected)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{teamName}} | Seattle Sharks | The name of the team |
| {{eventName}} | Spring Soccer Tournament 2025 | The name of the event |
| {{notes}} | Your team was rejected due to incomplete information. | Reason for rejection |
| {{loginLink}} | https://matchpro.ai/dashboard | Link to the user dashboard |

### Team Withdrawn Template (team_withdrawn)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{teamName}} | Seattle Sharks | The name of the team |
| {{eventName}} | Spring Soccer Tournament 2025 | The name of the event |
| {{notes}} | Your team has been withdrawn as requested. | Additional notes |
| {{loginLink}} | https://matchpro.ai/dashboard | Link to the user dashboard |

### Payment Confirmation Template (payment_confirmation)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{teamName}} | Seattle Sharks | The name of the team |
| {{eventName}} | Spring Soccer Tournament 2025 | The name of the event |
| {{registrationDate}} | 4/1/2025 | The date of registration |
| {{amount}} | $250.00 | The payment amount |
| {{ageGroup}} | U12 Boys | The age group |
| {{paymentId}} | TEAM-123 | The payment ID |
| {{receiptNumber}} | R-123-456789 | The receipt number |
| {{status}} | approved | The status of the team |

### Payment Refunded Template (payment_refunded)

| Merge Field | Example Value | Description |
|-------------|---------------|-------------|
| {{teamName}} | Seattle Sharks | The name of the team |
| {{eventName}} | Spring Soccer Tournament 2025 | The name of the event |
| {{amount}} | 250.00 | The refunded amount |
| {{reason}} | Tournament canceled due to weather | Reason for the refund |
| {{refundDate}} | 4/15/2025 | The date of the refund |

## Example Preview Data

When testing email templates in the preview mode, you can use the following JSON data examples:

### Password Reset Template Preview

```json
{
  "reset_link": "https://example.com/reset/token123"
}
```

### Team Status Update Template Preview

```json
{
  "teamName": "Seattle Sharks",
  "eventName": "Spring Soccer Tournament 2025",
  "status": "approved",
  "previousStatus": "registered",
  "notes": "Your team has been approved based on your application.",
  "loginLink": "https://matchpro.ai/dashboard"
}
```

### Team Approved Template Preview

```json
{
  "teamName": "Seattle Sharks",
  "eventName": "Spring Soccer Tournament 2025",
  "notes": "Please make sure all players have proper ID for check-in on the first day of the tournament.",
  "loginLink": "https://matchpro.ai/dashboard"
}
```

### Team Rejected Template Preview

```json
{
  "teamName": "Seattle Sharks",
  "eventName": "Spring Soccer Tournament 2025",
  "notes": "Your team was rejected due to incomplete roster information. Please update your roster and reapply.",
  "loginLink": "https://matchpro.ai/dashboard"
}
```

### Team Withdrawn Template Preview

```json
{
  "teamName": "Seattle Sharks",
  "eventName": "Spring Soccer Tournament 2025",
  "notes": "Your team has been withdrawn as requested. Refund will be processed within 5-7 business days.",
  "loginLink": "https://matchpro.ai/dashboard"
}
```

### Payment Confirmation Template Preview

```json
{
  "teamName": "Seattle Sharks",
  "eventName": "Spring Soccer Tournament 2025",
  "registrationDate": "4/1/2025",
  "amount": "$250.00",
  "ageGroup": "U12 Boys",
  "paymentId": "TEAM-123",
  "receiptNumber": "R-123-456789",
  "status": "approved"
}
```

### Payment Refunded Template Preview

```json
{
  "teamName": "Seattle Sharks",
  "eventName": "Spring Soccer Tournament 2025",
  "amount": "250.00",
  "reason": "Tournament canceled due to weather conditions",
  "refundDate": "4/15/2025"
}
```

## Best Practices for Email Templates

1. **Keep templates responsive** - Many users will read emails on mobile devices
2. **Use a clear subject line** - Make it immediately clear what the email is about
3. **Include a call-to-action** - Always give the user a clear next step
4. **Test with real data** - Use the preview feature with example data before publishing
5. **Keep branding consistent** - Use your brand colors and logo throughout
6. **Provide contact information** - Make it easy for users to get help if needed

## Troubleshooting

If emails are not being sent correctly:

1. Check that the template is marked as "Active" in the database
2. Verify that all required merge fields are present in the template
3. Ensure your SMTP settings are correctly configured
4. Check server logs for any email sending errors