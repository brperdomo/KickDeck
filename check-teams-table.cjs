/**
 * Script to check the teams table structure
 */
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTeamsTable() {
  try {
    // Query to get the structure of the teams table
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams';
    `;
    
    console.log('Checking teams table structure...');
    const result = await pool.query(query);
    
    console.log('Teams table columns:');
    result.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });
    
    // Check specifically if club_id exists
    const hasClubId = result.rows.some(col => col.column_name === 'club_id');
    console.log(`\nDoes club_id column exist? ${hasClubId ? 'YES' : 'NO'}`);
    
    return result.rows;
  } catch (error) {
    console.error('Error checking table structure:', error);
    return null;
  } finally {
    // Close the database connection
    pool.end();
  }
}

checkTeamsTable();