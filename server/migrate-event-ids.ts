import { sql } from "drizzle-orm";
import { db } from "@db";
import { events } from "@db/schema";
import { eq } from "drizzle-orm";
import { crypto } from "./crypto";

// Add archive columns if they don't exist
async function addArchiveColumns() {
  try {
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS scheduled_deletion_date text;
    `);
    console.log('Archive columns added successfully');
  } catch (error) {
    console.error('Error adding archive columns:', error);
  }
}

async function migrateEventIds() {
  try {
    // Get all events
    const allEvents = await db.select().from(events);

    // Update each event with a new ID
    for (const event of allEvents) {
      const newId = crypto.generateEventId();
      await db
        .update(events)
        .set({ id: newId })
        .where(eq(events.id, event.id));

      console.log(`Updated event ${event.id} to ${newId}`);
    }

    console.log('Event ID migration completed successfully');
  } catch (error) {
    console.error('Error migrating event IDs:', error);
  }
}

async function main() {
  try {
    await addArchiveColumns();
    await migrateEventIds();
  } catch (error) {
    console.error('Error during main execution:', error);
    process.exit(1); // Indicate failure
  } finally {
    process.exit(0); //Ensure process exits even if try block completes successfully.
  }
}

main();