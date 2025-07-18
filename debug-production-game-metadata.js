import { db } from './db/index.js';
import { eq } from 'drizzle-orm';
import { eventGameFormats, eventScheduleConstraints } from './db/schema.js';

async function debugProductionGameMetadata() {
  console.log('🔍 DEBUGGING PRODUCTION GAME METADATA API');
  console.log('==========================================');
  
  try {
    const eventId = 1656618593;
    console.log('Testing event ID:', eventId);
    console.log('Event ID type:', typeof eventId);
    
    // Test 1: Check database connection
    console.log('\n1. Testing database connection...');
    const connectionTest = await db.execute('SELECT 1 as test');
    console.log('   ✅ Database connection successful');
    
    // Test 2: Check if tables exist
    console.log('\n2. Checking table schema...');
    const tableCheck = await db.execute(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('event_game_formats', 'event_schedule_constraints')
      AND column_name = 'event_id'
      ORDER BY table_name
    `);
    
    console.log('   Table schema check:');
    for (const row of tableCheck.rows) {
      console.log(`   - ${row.table_name}.${row.column_name}: ${row.data_type}`);
    }
    
    // Test 3: Try the exact same query that API uses
    console.log('\n3. Testing game formats query...');
    try {
      const gameFormats = await db
        .select()
        .from(eventGameFormats)
        .where(eq(eventGameFormats.eventId, eventId));
      
      console.log('   ✅ Game formats query successful');
      console.log('   Result count:', gameFormats.length);
      if (gameFormats.length > 0) {
        console.log('   First result:', JSON.stringify(gameFormats[0], null, 2));
      }
    } catch (error) {
      console.log('   ❌ Game formats query failed:', error.message);
      console.log('   Error details:', error);
    }
    
    // Test 4: Try schedule constraints query
    console.log('\n4. Testing schedule constraints query...');
    try {
      const constraints = await db
        .select()
        .from(eventScheduleConstraints)
        .where(eq(eventScheduleConstraints.eventId, eventId))
        .limit(1);
      
      console.log('   ✅ Schedule constraints query successful');
      console.log('   Result count:', constraints.length);
      if (constraints.length > 0) {
        console.log('   First result:', JSON.stringify(constraints[0], null, 2));
      }
    } catch (error) {
      console.log('   ❌ Schedule constraints query failed:', error.message);
      console.log('   Error details:', error);
    }
    
    // Test 5: Check environment
    console.log('\n5. Environment check...');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
    
    // Test 6: Try with string conversion (old approach)
    console.log('\n6. Testing with string conversion (fallback)...');
    try {
      const eventIdStr = eventId.toString();
      const testQuery = await db.execute(`
        SELECT COUNT(*) as count 
        FROM event_game_formats 
        WHERE event_id = $1
      `, [eventIdStr]);
      
      console.log('   String conversion test result:', testQuery.rows[0]?.count);
    } catch (error) {
      console.log('   String conversion test failed:', error.message);
    }
    
    console.log('\n✅ PRODUCTION DIAGNOSTIC COMPLETE');
    console.log('If all tests passed, the API should work correctly');
    
  } catch (error) {
    console.error('\n❌ PRODUCTION DIAGNOSTIC FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugProductionGameMetadata().then(() => {
  console.log('\nDiagnostic completed');
  process.exit(0);
}).catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});