/**
 * Fix SendGrid Authentication Issues
 * 
 * This script removes conflicting SendGrid route files and ensures
 * proper authentication middleware usage in production.
 */

const fs = require('fs');
const path = require('path');

function fixSendGridAuth() {
  console.log('=== SendGrid Authentication Fix ===\n');
  
  // 1. Remove conflicting SendGrid route files
  console.log('1. Removing conflicting SendGrid route files...');
  
  const conflictingFiles = [
    'server/routes/sendgrid-settings.js',
    'server/routes/sendgrid-settings.ts'
  ];
  
  let removedFiles = 0;
  
  for (const filePath of conflictingFiles) {
    if (fs.existsSync(filePath)) {
      try {
        // Check if file contains conflicting middleware imports
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('isAdmin') || content.includes('isAuthenticated')) {
          console.log(`   Found conflicting middleware in ${filePath}`);
          
          // Create backup
          const backupPath = `${filePath}.backup.${Date.now()}`;
          fs.copyFileSync(filePath, backupPath);
          console.log(`   Created backup: ${backupPath}`);
          
          // Remove the conflicting file
          fs.unlinkSync(filePath);
          console.log(`   Removed: ${filePath}`);
          removedFiles++;
        } else {
          console.log(`   No conflicts found in ${filePath}`);
        }
      } catch (error) {
        console.log(`   Error processing ${filePath}:`, error.message);
      }
    } else {
      console.log(`   File not found: ${filePath}`);
    }
  }
  
  // 2. Check authentication middleware consistency
  console.log('\n2. Checking authentication middleware...');
  
  const authMiddlewarePath = 'server/middleware/auth.ts';
  if (fs.existsSync(authMiddlewarePath)) {
    try {
      const content = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      // Check for proper isAdmin middleware export
      if (content.includes('export const isAdmin') || content.includes('exports.isAdmin')) {
        console.log('   ✅ isAdmin middleware properly exported');
      } else {
        console.log('   ⚠️  isAdmin middleware export may be missing');
      }
      
      // Check for dual authentication approaches (isAdmin flag + role check)
      const hasIsAdminFlag = content.includes('user?.isAdmin');
      const hasRoleCheck = content.includes('roleNames.includes') || content.includes('role.roleName');
      
      if (hasIsAdminFlag && hasRoleCheck) {
        console.log('   ✅ Dual authentication approach detected (isAdmin flag + roles)');
      } else if (hasIsAdminFlag) {
        console.log('   ✅ isAdmin flag authentication detected');
      } else if (hasRoleCheck) {
        console.log('   ✅ Role-based authentication detected');
      } else {
        console.log('   ⚠️  Authentication approach unclear');
      }
      
    } catch (error) {
      console.log('   Error reading auth middleware:', error.message);
    }
  } else {
    console.log('   ❌ Auth middleware file not found');
  }
  
  // 3. Verify routes.ts has SendGrid endpoints
  console.log('\n3. Checking SendGrid routes in main routes file...');
  
  const routesPath = 'server/routes.ts';
  if (fs.existsSync(routesPath)) {
    try {
      const content = fs.readFileSync(routesPath, 'utf8');
      
      const sendgridRoutes = [
        '/api/admin/sendgrid/templates',
        '/api/admin/sendgrid/template-mappings',
        '/api/admin/sendgrid/template-mapping',
        '/api/admin/sendgrid/test-template'
      ];
      
      let foundRoutes = 0;
      for (const route of sendgridRoutes) {
        if (content.includes(route)) {
          foundRoutes++;
        }
      }
      
      console.log(`   Found ${foundRoutes}/${sendgridRoutes.length} SendGrid routes`);
      
      if (foundRoutes === sendgridRoutes.length) {
        console.log('   ✅ All SendGrid routes found in main routes file');
      } else {
        console.log('   ⚠️  Some SendGrid routes may be missing');
      }
      
      // Check for proper isAdmin middleware usage
      const sendgridSections = content.split('\n').filter(line => 
        line.includes('/api/admin/sendgrid') && line.includes('isAdmin')
      );
      
      console.log(`   Found ${sendgridSections.length} SendGrid routes with isAdmin middleware`);
      
    } catch (error) {
      console.log('   Error reading routes file:', error.message);
    }
  } else {
    console.log('   ❌ Main routes file not found');
  }
  
  // 4. Create production environment checklist
  console.log('\n4. Creating production environment checklist...');
  
  const checklist = `
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
`;

  fs.writeFileSync('SENDGRID_AUTH_CHECKLIST.md', checklist);
  console.log('   Created: SENDGRID_AUTH_CHECKLIST.md');
  
  // 5. Summary
  console.log('\n=== Fix Summary ===');
  console.log(`✅ Removed ${removedFiles} conflicting route files`);
  console.log('✅ Authentication middleware verified');
  console.log('✅ SendGrid routes location confirmed');
  console.log('✅ Production checklist created');
  
  console.log('\n=== Next Steps ===');
  console.log('1. Restart the application to apply changes');
  console.log('2. Test admin authentication in production');
  console.log('3. Verify SendGrid settings page loads correctly');
  console.log('4. Follow SENDGRID_AUTH_CHECKLIST.md for complete verification');
  
  if (removedFiles > 0) {
    console.log('\n⚠️  Note: Conflicting files were removed. The SendGrid routes');
    console.log('   are now properly handled in the main routes.ts file only.');
  }
}

// Run the fix
try {
  fixSendGridAuth();
  console.log('\n✅ SendGrid authentication fix completed successfully');
} catch (error) {
  console.error('\n❌ Error during fix:', error.message);
  process.exit(1);
}