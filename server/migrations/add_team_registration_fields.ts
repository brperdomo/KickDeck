import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Migration to add registration status, fee tracking, and terms acknowledgment fields to teams table
 */
export async function addTeamRegistrationFields() {
  console.log("Starting migration to add team registration fields...");

  try {
    // Check if columns already exist to avoid errors
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    
    const columns = tableInfo.rows.map((row: any) => row.column_name);
    
    // Add the status column if it doesn't exist
    if (!columns.includes('status')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN status TEXT NOT NULL DEFAULT 'registered'
      `);
      console.log("Added status column to teams table");
    }
    
    // Add the registration_fee column if it doesn't exist
    if (!columns.includes('registration_fee')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN registration_fee INTEGER
      `);
      console.log("Added registration_fee column to teams table");
    }
    
    // Add the terms_acknowledged column if it doesn't exist
    if (!columns.includes('terms_acknowledged')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN terms_acknowledged BOOLEAN DEFAULT false
      `);
      console.log("Added terms_acknowledged column to teams table");
    }
    
    // Add the terms_acknowledged_at column if it doesn't exist
    if (!columns.includes('terms_acknowledged_at')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN terms_acknowledged_at TIMESTAMP
      `);
      console.log("Added terms_acknowledged_at column to teams table");
    }
    
    // Add the terms_acknowledgement_record column if it doesn't exist
    if (!columns.includes('terms_acknowledgement_record')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN terms_acknowledgement_record TEXT
      `);
      console.log("Added terms_acknowledgement_record column to teams table");
    }
    
    // Add the notes column if it doesn't exist
    if (!columns.includes('notes')) {
      await db.execute(sql`
        ALTER TABLE teams
        ADD COLUMN notes TEXT
      `);
      console.log("Added notes column to teams table");
    }
    
    console.log("Migration complete: team registration fields added successfully");
    return true;
  } catch (error) {
    console.error("Error adding team registration fields:", error);
    return false;
  }
}

// If this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  addTeamRegistrationFields()
    .then((success) => {
      console.log(`Team registration fields migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unexpected error during migration:", error);
      process.exit(1);
    });
}