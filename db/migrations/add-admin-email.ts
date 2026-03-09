import { sql } from 'drizzle-orm';
import { db } from '../index';

/**
 * Migration to add adminEmail column to events table
 * This field stores the event organizer's contact email for
 * registration, payment, and account inquiries.
 */
export async function addAdminEmailToEvents() {
  console.log('Starting migration to add admin_email to events table...');

  try {
    // Check if the column already exists
    const tableInfo = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'admin_email';
    `);

    // If column doesn't exist, add it
    if (!tableInfo.rowCount || tableInfo.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS admin_email TEXT NOT NULL DEFAULT '';
      `);
      console.log('admin_email column added to events table successfully');
    } else {
      console.log('admin_email column already exists in events table');
    }

    console.log('Migration complete: admin_email field added successfully');
  } catch (error) {
    console.error('Error adding admin_email to events table:', error);
    throw error;
  }
}

// Execute migration if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addAdminEmailToEvents()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
