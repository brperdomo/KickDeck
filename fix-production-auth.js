/**
 * Fix Production Authentication for SendGrid Settings
 * 
 * This script patches the authentication middleware in production
 * to properly handle admin role verification for SendGrid settings access.
 */

import fs from 'fs';
import path from 'path';

const PRODUCTION_AUTH_MIDDLEWARE = `import { Request, Response, NextFunction } from "express";

// Enhanced admin authentication middleware with role-based access
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  console.log(\`[Admin Auth] Session ID: \${req.sessionID}\`);
  console.log(\`[Admin Auth] isAuthenticated: \${req.isAuthenticated()}\`);
  console.log(\`[Admin Auth] User: \${req.user ? 'exists' : 'null'}\`);
  console.log(\`[Admin Auth] User ID: \${req.user?.id}\`);
  console.log(\`[Admin Auth] isAdmin flag: \${req.user?.isAdmin}\`);
  
  if (!req.isAuthenticated()) {
    console.log(\`[Admin Auth] Authentication failed - not authenticated\`);
    return res.status(401).json({ error: "Authentication required. Please log in as an admin." });
  }

  const user = req.user as any;
  
  // First check the isAdmin flag
  if (user?.isAdmin) {
    console.log(\`[Admin Auth] Authentication successful via isAdmin flag\`);
    return next();
  }

  // If isAdmin flag is not set, check for admin roles in database
  try {
    const { db } = await import('@db');
    const { adminRoles, roles } = await import('@db/schema');
    const { eq } = await import('drizzle-orm');
    
    const userRoles = await db
      .select({ roleName: roles.name })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, user.id));
    
    const roleNames = userRoles.map(r => r.roleName);
    console.log(\`[Admin Auth] User roles from database: \${roleNames.join(', ')}\`);
    
    const hasAdminRole = roleNames.includes('super_admin') || 
                         roleNames.includes('tournament_admin') ||
                         roleNames.includes('finance_admin') ||
                         roleNames.includes('score_admin');
    
    if (hasAdminRole) {
      console.log(\`[Admin Auth] Authentication successful via role-based access\`);
      return next();
    }
  } catch (error) {
    console.error(\`[Admin Auth] Error checking roles:\`, error);
  }

  console.log(\`[Admin Auth] Authorization failed - not admin\`);
  return res.status(403).json({ error: "Admin privileges required for this action." });
};

// Middleware to validate authentication only (not admin)
export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Legacy support
export const authenticateAdmin = isAdmin;
export const validateAdmin = isAdmin;
`;

async function fixProductionAuthentication() {
  console.log('Fixing Production Authentication Middleware...\n');
  
  try {
    // 1. Update the authentication middleware file
    const authMiddlewarePath = 'server/middleware/auth.ts';
    console.log(`1. Updating authentication middleware: ${authMiddlewarePath}`);
    
    fs.writeFileSync(authMiddlewarePath, PRODUCTION_AUTH_MIDDLEWARE);
    console.log('   ✅ Authentication middleware updated');
    
    // 2. Verify the SendGrid API key is correctly configured
    console.log('\n2. Verifying SendGrid API key configuration...');
    const envContent = fs.readFileSync('.env.production', 'utf8');
    
    if (envContent.includes('SENDGRID_API_KEY=${SENDGRID_API_KEY}')) {
      console.log('   ✅ SendGrid API key properly configured as environment variable');
    } else {
      console.log('   ⚠️  SendGrid API key configuration may need review');
    }
    
    // 3. Create deployment instructions
    const deploymentInstructions = `
# Production Authentication Fix Deployment

## What was fixed:
1. Enhanced authentication middleware to properly check both isAdmin flag and role-based permissions
2. Added database lookup for user roles when isAdmin flag is not sufficient
3. Improved logging for debugging authentication issues

## To deploy these changes to production:

### Option 1: Replit Deployment (Recommended)
1. Click the "Deploy" button in Replit
2. Select your production deployment
3. The changes will be automatically deployed

### Option 2: Manual Deployment
1. Ensure the updated server/middleware/auth.ts file is deployed
2. Restart the production server
3. Verify the authentication works for SendGrid settings

## Verification:
1. Log in as admin user (bperdomo@zoho.com)
2. Navigate to /admin/sendgrid-settings
3. Should now show SendGrid templates instead of authentication error

## User Account Verified:
- Email: bperdomo@zoho.com
- User ID: 24
- isAdmin: true
- Role: super_admin
- Should have full access to all admin features
`;

    fs.writeFileSync('PRODUCTION_AUTH_FIX_DEPLOYMENT.md', deploymentInstructions);
    console.log('\n3. Created deployment instructions: PRODUCTION_AUTH_FIX_DEPLOYMENT.md');
    
    console.log('\n✅ Production authentication fix completed!');
    console.log('\nNext steps:');
    console.log('1. Deploy these changes to your production environment');
    console.log('2. Test the SendGrid settings page access');
    console.log('3. The authentication should now work properly for your admin account');
    
  } catch (error) {
    console.error('❌ Error fixing production authentication:', error.message);
  }
}

// Run the fix
fixProductionAuthentication();