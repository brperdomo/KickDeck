/**
 * Development Authentication Bypass
 * 
 * ⚠️ WARNING: This file is for DEVELOPMENT ONLY and should NOT be included in production builds.
 * It provides a simple way to bypass authentication for testing purposes.
 */

import { Router, Request, Response } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// A development-only route to automatically log in as an admin
// for testing and development purposes
router.get('/dev-login-bypass', async (req: Request, res: Response) => {
  // Check if we're in a development environment
  // This is a safety check to prevent this route from working in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (!isDevelopment) {
    console.warn('Attempted to use dev login bypass in production environment');
    return res.status(403).send('Dev login bypass is disabled in production environments');
  }
  
  try {
    // Look up the admin user to use for bypass
    // This is a fixed credential only for development testing
    const adminEmail = 'bperdomo@zoho.com';
    
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (!adminUser) {
      console.error('Dev login bypass failed: Admin user not found');
      return res.status(404).send('Admin user not found for dev bypass');
    }
    
    if (!adminUser.isAdmin) {
      console.error('Dev login bypass failed: User is not an admin');
      return res.status(403).send('The selected user does not have admin privileges');
    }
    
    // Set up the session for this admin user
    req.login(adminUser, (err) => {
      if (err) {
        console.error('Dev login bypass session error:', err);
        return res.status(500).send('Error creating session');
      }
      
      console.log(`Dev login bypass: Successfully authenticated as admin (${adminUser.email})`);
      
      return res.status(200).json({
        message: 'Development authentication bypass successful',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          isAdmin: adminUser.isAdmin
        }
      });
    });
  } catch (error) {
    console.error('Dev login bypass error:', error);
    return res.status(500).send('Internal server error during dev authentication bypass');
  }
});

export default router;