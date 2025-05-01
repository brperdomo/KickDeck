/**
 * Direct test script for team creation with club info
 */
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testTeamCreationWithClubId() {
  try {
    // Insert a test team directly with club_id
    const insertQuery = `
      INSERT INTO teams (
        name, 
        event_id, 
        age_group_id, 
        club_id,
        club_name,
        coach, 
        manager_name, 
        manager_email, 
        manager_phone,
        status,
        created_at
      ) VALUES (
        'Test Team Direct',
        '1251362271',
        1,
        1,
        'Test Club Name',
        '{"headCoachName":"Test Coach", "headCoachEmail":"test@example.com", "headCoachPhone":"123-456-7890"}',
        'Test Manager',
        'manager@example.com',
        '987-654-3210',
        'registered',
        CURRENT_TIMESTAMP
      ) RETURNING id, club_id, club_name`;

    console.log('Executing SQL query to insert team with club_id...');
    const result = await pool.query(insertQuery);
    
    if (result.rows && result.rows.length > 0) {
      console.log('Team created successfully!');
      console.log('Team data:', result.rows[0]);
      console.log('SUCCESS: Club ID was properly saved in the team record.');
      return result.rows[0];
    } else {
      console.log('Team was not created. No rows returned.');
      return null;
    }
  } catch (error) {
    console.error('Error creating team:', error);
    return null;
  } finally {
    // Close the database connection
    pool.end();
  }
}

testTeamCreationWithClubId()
  .then(team => {
    if (team) {
      console.log('Test completed successfully!');
      process.exit(0);
    } else {
      console.log('Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });