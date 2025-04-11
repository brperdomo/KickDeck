import { sql } from 'drizzle-orm';
import { db } from '@db';

/**
 * Migration to add clubName column to teams table
 */
export async function addClubNameToTeams() {
  console.log('Starting migration to add clubName to teams table...');
  
  try {
    // Check if the column already exists
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'club_name';
    `);
    
    // If column doesn't exist, add it
    if (!tableInfo.rowCount || tableInfo.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE teams 
        ADD COLUMN IF NOT EXISTS club_name TEXT;
      `);
      console.log('club_name column added to teams table successfully');
    } else {
      console.log('club_name column already exists in teams table');
    }
    
    console.log('Migration complete: club_name field added successfully');
  } catch (error) {
    console.error('Error adding club_name to teams table:', error);
    throw error;
  }
}

// Execute migration if this file is run directly
// Using import.meta.url instead of require.main for ES modules
if (import.meta.url === `file://${process.argv[1]}`) {
  addClubNameToTeams()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}