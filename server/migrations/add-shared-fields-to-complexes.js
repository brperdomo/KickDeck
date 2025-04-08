/**
 * Migration script to add shared-related fields to complexes table
 * This will:
 * 1. Add the shared boolean field (defaults to false for existing records)
 * 2. Add the sharedId field for cross-instance identification
 * 3. Ensure latitude and longitude are present and valid for proper geolocation
 */

/**
 * Helper to safely parse number values from potential strings
 */
function safeParseFloat(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Generate a unique shared ID for complex sharing
 */
function generateSharedId() {
  return 'cmplx_' + 
    Date.now().toString(36) + 
    Math.random().toString(36).substring(2, 10);
}

/**
 * Helper to check if a column exists in a table
 */
async function checkColumnExists(db, tableName, columnName) {
  try {
    const result = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name = $2
    `, [tableName, columnName]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if column exists: ${error.message}`);
    return false;
  }
}

/**
 * Execute the migration for the given database connection
 */
async function migrate(db) {
  console.log('Starting migration: Adding shared fields to complexes table');
  
  try {
    // Begin transaction
    await db.query('BEGIN');
    
    // Check if shared column exists
    const sharedColumnExists = await checkColumnExists(db, 'complexes', 'shared');
    const sharedIdColumnExists = await checkColumnExists(db, 'complexes', 'shared_id');
    
    // Add the shared column if it doesn't exist
    if (!sharedColumnExists) {
      console.log('Adding shared column to complexes table');
      await db.query(`
        ALTER TABLE complexes
        ADD COLUMN shared BOOLEAN DEFAULT FALSE NOT NULL
      `);
    } else {
      console.log('shared column already exists');
    }
    
    // Add the sharedId column if it doesn't exist
    if (!sharedIdColumnExists) {
      console.log('Adding shared_id column to complexes table');
      await db.query(`
        ALTER TABLE complexes
        ADD COLUMN shared_id TEXT NULL
      `);
    } else {
      console.log('shared_id column already exists');
    }
    
    // Update latitude and longitude to be proper numbers (if they're strings)
    console.log('Updating latitude and longitude to proper number format');
    const allComplexes = await db.query('SELECT id, latitude, longitude FROM complexes');
    
    for (const complex of allComplexes.rows) {
      const lat = safeParseFloat(complex.latitude);
      const lng = safeParseFloat(complex.longitude);
      
      await db.query(`
        UPDATE complexes
        SET 
          latitude = $1,
          longitude = $2
        WHERE id = $3
      `, [lat, lng, complex.id]);
    }
    
    // Commit transaction
    await db.query('COMMIT');
    console.log('Migration completed successfully');
    
    return true;
  } catch (error) {
    // Roll back in case of error
    await db.query('ROLLBACK');
    console.error(`Migration failed: ${error.message}`);
    console.error(error.stack);
    
    return false;
  }
}

module.exports = {
  migrate,
  generateSharedId
};