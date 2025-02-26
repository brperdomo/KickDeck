
import { db } from "../../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      ALTER TABLE event_fees 
      ADD COLUMN IF NOT EXISTS accounting_code_id INTEGER REFERENCES accounting_codes(id);
    `);
    
    console.log('Added accounting_code_id column to event_fees table');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
