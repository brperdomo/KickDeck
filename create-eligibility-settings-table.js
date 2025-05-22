/**
 * Create Event Age Group Eligibility Settings Table
 * 
 * This script creates a new table to store eligibility settings separately from
 * the age groups table to avoid foreign key constraint issues.
 */

// ES Module imports
import pg from 'pg';
const { Client } = pg;

async function createEligibilitySettingsTable() {
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // Check if table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_age_group_eligibility'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('event_age_group_eligibility table already exists');
      return true;
    }
    
    // Create the table
    console.log('Creating event_age_group_eligibility table...');
    const createTableQuery = `
      CREATE TABLE event_age_group_eligibility (
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        age_group_id INTEGER NOT NULL REFERENCES event_age_groups(id) ON DELETE CASCADE,
        is_eligible BOOLEAN NOT NULL DEFAULT true,
        PRIMARY KEY (event_id, age_group_id)
      );
    `;

    await client.query(createTableQuery);
    console.log('event_age_group_eligibility table created successfully');
    
    // Initialize data for existing age groups
    console.log('Initializing eligibility data for existing events...');
    const initDataQuery = `
      INSERT INTO event_age_group_eligibility (event_id, age_group_id, is_eligible)
      SELECT event_id, id, is_eligible
      FROM event_age_groups
      ON CONFLICT (event_id, age_group_id) DO NOTHING;
    `;
    
    await client.query(initDataQuery);
    console.log('Eligibility data initialization complete');
    
    return true;
  } catch (error) {
    console.error('Error creating eligibility settings table:', error);
    return false;
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
createEligibilitySettingsTable()
  .then((success) => {
    if (success) {
      console.log('Eligibility settings table migration completed successfully');
      process.exit(0);
    } else {
      console.error('Eligibility settings table migration failed');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Unexpected error during migration:', err);
    process.exit(1);
  });