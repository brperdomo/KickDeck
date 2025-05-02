/**
 * Permission Fix Script
 * 
 * This script directly queries the database to ensure the admin user has
 * the super_admin role correctly assigned with all required permissions.
 */

// Load environment variables
import 'dotenv/config';

// Connect to database
import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

// Main function to run all fixes
async function fixAdminPermissions() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Find the admin user ID
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = 'bperdomo@zoho.com'"
    );

    if (userResult.rows.length === 0) {
      console.error('Admin user not found!');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found admin user with ID: ${userId}`);

    // Find the super_admin role ID
    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'super_admin'"
    );

    let roleId;
    if (roleResult.rows.length === 0) {
      console.error('Super admin role not found!');
      
      // Create the role if it doesn't exist
      console.log('Creating super_admin role...');
      const newRoleResult = await client.query(
        "INSERT INTO roles (name, description, created_at) VALUES ('super_admin', 'Super Administrator role with full system access', NOW()) RETURNING id"
      );
      
      if (newRoleResult.rows.length === 0) {
        console.error('Failed to create super_admin role!');
        return;
      }
      
      roleId = newRoleResult.rows[0].id;
      console.log(`Created super_admin role with ID: ${roleId}`);
    } else {
      roleId = roleResult.rows[0].id;
      console.log(`Found super_admin role with ID: ${roleId}`);
    }

    // Check if the assignment already exists
    const assignmentResult = await client.query(
      'SELECT * FROM admin_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );

    if (assignmentResult.rows.length > 0) {
      console.log('Role assignment already exists, checking permissions...');
      
      // Count permissions for this role
      const permissionCountResult = await client.query(
        'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
        [roleId]
      );
      
      const permissionCount = parseInt(permissionCountResult.rows[0].count);
      console.log(`Role has ${permissionCount} permissions assigned`);
      
      if (permissionCount === 0) {
        console.log('No permissions found! Adding all permissions to super_admin role...');
        
        // Get all available permissions
        const allPermissions = [
          'events.view', 'events.create', 'events.edit', 'events.delete',
          'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
          'games.view', 'games.create', 'games.edit', 'games.delete',
          'scores.view', 'scores.create', 'scores.edit', 'scores.delete',
          'finances.view', 'finances.edit', 'finances.export',
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'reports.view', 'reports.export',
          'fields.view', 'fields.create', 'fields.edit', 'fields.delete',
          'scheduling.view', 'scheduling.create', 'scheduling.edit', 'scheduling.delete',
          'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
          'administrators.view', 'administrators.create', 'administrators.edit', 'administrators.delete',
          'organization.view', 'organization.edit',
          'members.view', 'members.create', 'members.edit', 'members.delete',
          'communications.view', 'communications.send', 'communications.templates',
          'clubs.view', 'clubs.create', 'clubs.edit', 'clubs.delete'
        ];
        
        // Add all permissions to the role
        for (const permission of allPermissions) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [roleId, permission]
          );
        }
        
        console.log('Added all permissions to super_admin role');
      }
    } else {
      console.log('Creating admin role assignment...');
      
      await client.query(
        'INSERT INTO admin_roles (user_id, role_id, created_at) VALUES ($1, $2, NOW())',
        [userId, roleId]
      );
      
      console.log('Successfully assigned super_admin role to the admin user');
    }

    // Check if the is_admin column exists
    try {
      await client.query(
        'UPDATE users SET is_admin = true WHERE id = $1',
        [userId]
      );
      console.log('Admin flag confirmed on user account');
    } catch (error) {
      console.log('Note: Could not update is_admin flag - column naming may be different. This is not critical.');
    }
    
    console.log('\nFix completed successfully. Please log out and log back in to see the changes.');

  } catch (error) {
    console.error('Error fixing admin permissions:', error);
  } finally {
    await client.end();
  }
}

// Run the fix function
fixAdminPermissions();