import { Request, Response } from 'express';
import { db } from '@db/index';
import { rolePermissions, PERMISSIONS } from '@db/schema/permissions';
import { adminRoles, roles } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Get the current authenticated admin's permissions
 */
export async function getCurrentUserPermissions(req: Request, res: Response) {
  try {
    // Get the user ID, considering emulation
    const userId = req.emulatedUserId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch the user's roles with a join to get role names
    const userRolesResult = await db
      .select({
        roleName: roles.name,
        roleId: roles.id
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, userId));

    // Extract role names for response and role IDs for permission lookup
    const roleNames = userRolesResult.map(result => result.roleName);
    const roleIds = userRolesResult.map(result => result.roleId);
    
    // If the user is a super_admin, they have all permissions
    if (roleNames.includes('super_admin')) {
      return res.json({
        roles: roleNames,
        permissions: Object.keys(PERMISSIONS)
      });
    }

    // Otherwise, fetch the specific permissions for their roles
    if (roleIds.length === 0) {
      // If user has no roles, they have no permissions
      return res.json({
        roles: [],
        permissions: []
      });
    }

    // Get all permissions in a single query for better performance
    const permissions = await db
      .select({
        permission: rolePermissions.permission
      })
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));
    
    // Use a Set to eliminate duplicate permissions
    const uniquePermissions = new Set<string>();
    permissions.forEach(p => uniquePermissions.add(p.permission));

    return res.json({
      roles: roleNames,
      permissions: Array.from(uniquePermissions)
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
}