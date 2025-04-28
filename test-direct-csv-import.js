/**
 * Test Direct CSV Import
 * This script directly tests the CSV team import functionality by connecting to the database
 * and executing the core logic without going through the API.
 */

// Import dependencies
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Main test function
async function testDirectCsvImport() {
  try {
    console.log('Starting direct CSV import test...');
    
    // Connect to database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Find an event to test with
      const eventResult = await client.query(`
        SELECT e.id, e.name, e.start_date, e.end_date
        FROM events e
        WHERE e.is_archived = false
        ORDER BY e.created_at DESC
        LIMIT 1
      `);
      
      if (eventResult.rows.length === 0) {
        throw new Error('No events found in database. Please create an event first.');
      }
      
      const testEvent = eventResult.rows[0];
      console.log(`Using event: ${testEvent.name} (ID: ${testEvent.id})`);
      
      // Get the seasonal scope ID for this event
      const scopeResult = await client.query(`
        SELECT setting_value
        FROM event_settings
        WHERE event_id = $1 AND setting_key = 'seasonalScopeId'
        LIMIT 1
      `, [testEvent.id]);
      
      let seasonalScopeId = null;
      if (scopeResult.rows.length > 0) {
        seasonalScopeId = parseInt(scopeResult.rows[0].setting_value);
        console.log(`Using seasonal scope ID ${seasonalScopeId} for event ${testEvent.id}`);
      } else {
        console.log(`No seasonal scope found for event ${testEvent.id}`);
      }
      
      // Get age groups for this event
      const ageGroupsResult = await client.query(`
        SELECT ag.id, ag.age_group as "ageGroup", ag.gender, ag.division_code as "divisionCode", ag.birth_year as "birthYear"
        FROM event_age_groups ag
        WHERE ag.event_id = $1
        ORDER BY ag.age_group
      `, [testEvent.id]);
      
      if (ageGroupsResult.rows.length === 0) {
        throw new Error('No age groups found for this event. Please add age groups first.');
      }
      
      console.log(`Found ${ageGroupsResult.rows.length} age groups for this event.`);
      
      // Map age groups to their IDs and handle their naming with gender
      const ageGroups = {};
      for (const ag of ageGroupsResult.rows) {
        // Store standard format (e.g., "U8 Boys")
        const standardKey = `${ag.ageGroup} ${ag.gender}`;
        ageGroups[standardKey] = {
          id: ag.id,
          divisionCode: ag.divisionCode,
          birthYear: ag.birthYear
        };
        
        // Also store without spaces (e.g., "U8Boys")
        const noSpaceKey = `${ag.ageGroup}${ag.gender}`;
        ageGroups[noSpaceKey] = {
          id: ag.id,
          divisionCode: ag.divisionCode,
          birthYear: ag.birthYear
        };
      }
      
      // Create a simple CSV file for testing
      const ageGroup1 = ageGroupsResult.rows[0];
      const ageGroupName = `${ageGroup1.ageGroup} ${ageGroup1.gender}`;
      
      console.log(`Using age group: ${ageGroupName}`);
      
      const tempCsvPath = path.join(__dirname, 'temp_team_import.csv');
      const csvContent = `Team Name,Head Coach Name,Head Coach Email,Head Coach Phone,Manager Name,Manager Email,Manager Phone,Club Name,Age Group,Submitter Name,Submitter Email
Test Team Direct,John Doe,john@example.com,555-123-4567,Jane Smith,jane@example.com,555-987-6543,FC United,${ageGroupName},Admin User,admin@example.com`;
      
      fs.writeFileSync(tempCsvPath, csvContent);
      console.log('Created temporary CSV file for testing');
      
      // Parse the CSV file
      const fileContent = fs.readFileSync(tempCsvPath, 'utf8');
      const records = parse(fileContent, { 
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Parsed ${records.length} records from CSV`);
      
      // Validate the records and prepare them for insertion
      const now = new Date().toISOString();
      const teamsToInsert = [];
      const invalidAgeGroups = [];
      
      for (const record of records) {
        const ageGroupKey = record['Age Group'].trim();
        
        // Check if this age group exists for the event
        if (!ageGroups[ageGroupKey]) {
          invalidAgeGroups.push(ageGroupKey);
          continue;
        }
        
        const ageGroupInfo = ageGroups[ageGroupKey];
        
        // Prepare the team record for insertion
        teamsToInsert.push({
          eventId: testEvent.id,
          ageGroupId: ageGroupInfo.id,
          name: record['Team Name'],
          coach: record['Head Coach Name'],
          managerName: record['Manager Name'] || null,
          managerEmail: record['Manager Email'] || null,
          managerPhone: record['Manager Phone'] || null,
          clubName: record['Club Name'] || null,
          submitterName: record['Submitter Name'] || null,
          submitterEmail: record['Submitter Email'] || null,
          status: 'pending',
          createdAt: now,
          // Important: Add division code and birth year from seasonal scope mapping
          divisionCode: ageGroupInfo.divisionCode || null,
          birthYear: ageGroupInfo.birthYear || null
        });
      }
      
      // Check for invalid age groups
      if (invalidAgeGroups.length > 0) {
        // Create a message with all available age groups to help the user
        const availableAgeGroups = Object.keys(ageGroups).filter(key => key.includes(' ')).join(', ');
        
        console.error(`Some records contain invalid age groups. Valid age groups for this event are: ${availableAgeGroups}`);
        console.error(`Invalid age groups: ${invalidAgeGroups.join(', ')}`);
        
        // Clean up
        fs.unlinkSync(tempCsvPath);
        throw new Error('Invalid age groups found in CSV');
      }
      
      if (teamsToInsert.length === 0) {
        // Clean up
        fs.unlinkSync(tempCsvPath);
        throw new Error('No valid teams to insert');
      }
      
      // Insert teams into the database
      for (const team of teamsToInsert) {
        const result = await client.query(`
          INSERT INTO teams (
            event_id, age_group_id, name, coach,
            manager_name, manager_email, manager_phone,
            club_name, submitter_name, submitter_email,
            status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          ) RETURNING *
        `, [
          team.eventId, team.ageGroupId, team.name, team.coach,
          team.managerName, team.managerEmail, team.managerPhone,
          team.clubName, team.submitterName, team.submitterEmail,
          team.status, team.createdAt
        ]);
        
        const insertedTeam = result.rows[0];
        console.log('\nInserted team details:');
        console.log(`Team Name: ${insertedTeam.name}`);
        console.log(`Age Group ID: ${insertedTeam.age_group_id}`);
        console.log(`Division Code: ${insertedTeam.division_code || 'Not set'}`);
        console.log(`Birth Year: ${insertedTeam.birth_year || 'Not set'}`);
      }
      
      // Clean up
      fs.unlinkSync(tempCsvPath);
      console.log('Deleted temporary CSV file');
      
      console.log(`\nSuccessfully imported ${teamsToInsert.length} teams!`);
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the test
testDirectCsvImport()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });