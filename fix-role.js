// Fix Admin Role Script
import { db } from './db/index.js';
import { roles, adminRoles, users } from './db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

async function fixSuperAdminRole() {
  try {
    console.log("Starting admin role fix script...");
    
    // 1. Get the admin user ID
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bperdomo@zoho.com"))
      .limit(1);
    
    if (!adminUser) {
      console.error("Admin user not found - please run the application first to create the admin");
      return;
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // 2. Get the super_admin role ID
    const [superAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "super_admin"))
      .limit(1);
    
    if (!superAdminRole) {
      console.error("Super admin role not found!");
      return;
    }
    
    console.log(`Found super_admin role with ID: ${superAdminRole.id}`);
    
    // 3. Check if the admin already has the super_admin role
    const existingRoleAssignment = await db
      .select()
      .from(adminRoles)
      .where(
        and(
          eq(adminRoles.userId, adminUser.id),
          eq(adminRoles.roleId, superAdminRole.id)
        )
      )
      .limit(1);
    
    if (existingRoleAssignment.length > 0) {
      console.log("Admin already has super_admin role assigned - now checking if there are any issues with permissions");
      
      // Debugging - Get all role permissions
      const userPermissions = await db.select({
        roleName: roles.name,
        permissions: sql`string_agg(rp.permission, ', ')`
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .leftJoin(
        { rp: sql.raw('role_permissions') }, 
        eq(roles.id, sql.raw('rp.role_id'))
      )
      .where(eq(adminRoles.userId, adminUser.id))
      .groupBy(roles.name);
      
      console.log("User role permissions:", JSON.stringify(userPermissions, null, 2));
      
      return;
    }
    
    // 4. Assign the super_admin role to the admin user
    await db
      .insert(adminRoles)
      .values({
        userId: adminUser.id,
        roleId: superAdminRole.id,
        createdAt: new Date()
      });
    
    console.log(`Successfully assigned super_admin role to user ${adminUser.email}`);
    console.log("Fix completed successfully - please restart the application");
    
  } catch (error) {
    console.error("Error fixing admin role:", error);
  }
}

// Run the fix function
fixSuperAdminRole();