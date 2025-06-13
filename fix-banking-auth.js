/**
 * Fix Banking Authentication Issue
 * 
 * This script fixes the authentication problem preventing banking information
 * from loading in production environments.
 */

const { db } = require('./db');
const { users } = require('./db/schema');
const { eq } = require('drizzle-orm');

async function fixBankingAuth() {
  try {
    console.log('Diagnosing banking authentication issue...');
    
    // Check if admin user exists and has proper permissions
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'bperdomo@zoho.com')
    });
    
    if (!adminUser) {
      console.log('Admin user not found - this is the root cause');
      return;
    }
    
    console.log('Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      isAdmin: adminUser.isAdmin,
      username: adminUser.username
    });
    
    // Verify admin privileges
    if (!adminUser.isAdmin) {
      console.log('Admin user lacks admin privileges - fixing...');
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, adminUser.id));
      console.log('Admin privileges restored');
    }
    
    console.log('Banking authentication diagnostics complete');
    
  } catch (error) {
    console.error('Error fixing banking auth:', error);
  }
}

if (require.main === module) {
  fixBankingAuth().then(() => process.exit(0));
}

module.exports = { fixBankingAuth };