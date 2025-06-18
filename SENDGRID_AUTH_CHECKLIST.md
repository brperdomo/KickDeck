
# Production SendGrid Authentication Checklist

## Environment Variables Required:
- [ ] SENDGRID_API_KEY (must be valid SendGrid API key)
- [ ] NODE_ENV=production
- [ ] DATABASE_URL (PostgreSQL connection string)

## Authentication Setup:
- [ ] Admin user exists in database with isAdmin=true
- [ ] Admin user has super_admin role assigned
- [ ] Session middleware properly configured
- [ ] Authentication middleware exports isAdmin function

## SendGrid Configuration:
- [ ] SendGrid API key has proper permissions (Templates, Mail Send)
- [ ] Domain authentication configured in SendGrid
- [ ] Sender verification completed
- [ ] No suppression lists blocking emails

## Deployment Verification:
1. Log in as admin user
2. Navigate to SendGrid Settings in admin dashboard
3. Verify templates load without "Authentication required" errors
4. Test template functionality

## Troubleshooting:
- Check browser developer tools for authentication errors
- Verify session cookies are being set correctly
- Confirm admin user role assignments in database
- Test SendGrid API key directly with curl/Postman

## Common Issues:
- Conflicting route files causing middleware import errors
- Multiple authentication middleware definitions
- Session configuration not matching production environment
- SendGrid API key permissions insufficient
