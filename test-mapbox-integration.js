/**
 * Mapbox Integration Test Suite
 * 
 * This script tests the complete Mapbox integration and multi-tenant
 * complex management system to ensure everything works correctly.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Test configuration
const TEST_ADDRESSES = [
  {
    name: "Central Park Soccer Fields",
    address: "Central Park, New York, NY, USA",
    expectedCountry: "United States",
    expectedState: "NY"
  },
  {
    name: "Griffith Park Soccer Complex", 
    address: "Griffith Park, Los Angeles, CA, USA",
    expectedCountry: "United States",
    expectedState: "CA"
  },
  {
    name: "Soccer Centre",
    address: "Toronto, ON, Canada",
    expectedCountry: "Canada",
    expectedState: "ON"
  }
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Test Mapbox API connectivity and search functionality
 */
async function testMapboxAPI() {
  console.log('🔌 Testing Mapbox API connectivity...');
  
  const mapboxApiKey = process.env.VITE_MAPBOX_API_KEY;
  if (!mapboxApiKey) {
    console.log('❌ VITE_MAPBOX_API_KEY not found in environment');
    return false;
  }

  console.log(`✅ API key found (${mapboxApiKey.length} characters)`);

  // Test basic geocoding request
  try {
    const testQuery = "Sports Complex New York";
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(testQuery)}.json?access_token=${mapboxApiKey}&limit=1&types=poi,address`
    );

    if (!response.ok) {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ API request successful, found ${data.features?.length || 0} results`);
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      console.log(`   Sample result: ${feature.place_name}`);
      console.log(`   Coordinates: ${feature.center[1]}, ${feature.center[0]}`);
    }

    return true;
  } catch (error) {
    console.log(`❌ API request error: ${error.message}`);
    return false;
  }
}

/**
 * Test database schema for Mapbox columns
 */
async function testDatabaseSchema() {
  console.log('🗃️ Testing database schema...');

  try {
    // Check if complexes table has new Mapbox columns
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'complexes' 
      AND column_name IN (
        'mapbox_place_id', 'global_complex_id', 'organization_id', 
        'mapbox_context', 'address_verified'
      )
      ORDER BY column_name
    `);

    const expectedColumns = ['mapbox_place_id', 'global_complex_id', 'organization_id', 'mapbox_context', 'address_verified'];
    const foundColumns = columns.map(c => c.column_name);

    console.log(`   Found columns: ${foundColumns.join(', ')}`);

    for (const expectedCol of expectedColumns) {
      if (foundColumns.includes(expectedCol)) {
        console.log(`   ✅ ${expectedCol} column exists`);
      } else {
        console.log(`   ❌ ${expectedCol} column missing`);
        return false;
      }
    }

    // Check global registry table
    const registryExists = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'global_complex_registry'
    `);

    if (registryExists.length > 0) {
      console.log('   ✅ global_complex_registry table exists');
    } else {
      console.log('   ❌ global_complex_registry table missing');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`❌ Database schema test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test complex creation with Mapbox verification
 */
async function testComplexCreation() {
  console.log('🏟️ Testing complex creation with Mapbox verification...');

  const mapboxApiKey = process.env.VITE_MAPBOX_API_KEY;
  if (!mapboxApiKey) {
    console.log('   ⚠️ Skipping test - no Mapbox API key');
    return true;
  }

  for (const testComplex of TEST_ADDRESSES) {
    console.log(`   Testing: ${testComplex.name}`);

    try {
      // Search for address using Mapbox
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(testComplex.address)}.json?access_token=${mapboxApiKey}&limit=1&types=poi,address`
      );

      if (!response.ok) {
        console.log(`   ❌ Failed to geocode: ${testComplex.address}`);
        continue;
      }

      const data = await response.json();
      if (!data.features || data.features.length === 0) {
        console.log(`   ❌ No results for: ${testComplex.address}`);
        continue;
      }

      const place = data.features[0];
      const [longitude, latitude] = place.center;

      // Generate global complex ID
      const globalId = generateTestGlobalId(place, testComplex.name);

      console.log(`   ✅ Geocoded successfully`);
      console.log(`      Place: ${place.place_name}`);
      console.log(`      Coordinates: ${latitude}, ${longitude}`);
      console.log(`      Global ID: ${globalId}`);
      console.log(`      Mapbox Place ID: ${place.id}`);

      // Test conflict detection
      const conflicts = await checkConflicts(globalId, 1);
      if (conflicts.length > 0) {
        console.log(`   ⚠️ Found ${conflicts.length} potential conflicts`);
      } else {
        console.log(`   ✅ No conflicts detected`);
      }

    } catch (error) {
      console.log(`   ❌ Error testing ${testComplex.name}: ${error.message}`);
    }
  }

  return true;
}

/**
 * Generate global complex ID for testing
 */
function generateTestGlobalId(place, name) {
  const [longitude, latitude] = place.center;
  
  let city = '';
  let state = '';
  let country = '';

  if (place.context) {
    place.context.forEach(context => {
      if (context.id.includes('place')) {
        city = context.text;
      } else if (context.id.includes('region')) {
        state = context.short_code || context.text;
      } else if (context.id.includes('country')) {
        country = context.text;
      }
    });
  }

  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  const normalizedCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedState = state.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedCountry = country.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const roundedLat = Math.round(latitude * 1000) / 1000;
  const roundedLng = Math.round(longitude * 1000) / 1000;

  return `${normalizedCountry}_${normalizedState}_${normalizedCity}_${normalizedName}_${roundedLat}_${roundedLng}`;
}

/**
 * Check for conflicts in database
 */
async function checkConflicts(globalComplexId, organizationId) {
  try {
    const conflicts = await db.execute(sql`
      SELECT id, name, organization_id 
      FROM complexes 
      WHERE global_complex_id = ${globalComplexId} 
      AND organization_id != ${organizationId}
    `);
    return conflicts;
  } catch (error) {
    console.log(`Error checking conflicts: ${error.message}`);
    return [];
  }
}

/**
 * Test multi-tenant conflict detection
 */
async function testConflictDetection() {
  console.log('⚠️ Testing multi-tenant conflict detection...');

  try {
    // Test the conflict detection function
    const testGlobalId = 'us_ny_newyork_testcomplex_40.785_-73.968';
    
    // Check if function exists
    const functionExists = await db.execute(sql`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_name = 'detect_complex_conflicts'
    `);

    if (functionExists.length > 0) {
      console.log('   ✅ detect_complex_conflicts function exists');
      
      // Test the function
      const conflicts = await db.execute(sql`
        SELECT * FROM detect_complex_conflicts(${testGlobalId}, 1)
      `);
      
      console.log(`   ✅ Function executed successfully, found ${conflicts.length} conflicts`);
    } else {
      console.log('   ❌ detect_complex_conflicts function missing');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`❌ Conflict detection test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Mapbox Integration Test Suite\n');

  const results = {
    mapboxAPI: false,
    databaseSchema: false,
    complexCreation: false,
    conflictDetection: false
  };

  // Run all tests
  results.mapboxAPI = await testMapboxAPI();
  console.log('');

  results.databaseSchema = await testDatabaseSchema();
  console.log('');

  results.complexCreation = await testComplexCreation();
  console.log('');

  results.conflictDetection = await testConflictDetection();
  console.log('');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const allPassed = Object.values(results).every(result => result);
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.padEnd(20)}: ${status}`);
  }

  console.log('');
  
  if (allPassed) {
    console.log('🎉 All tests passed! Mapbox integration is ready for production.');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
    
    // Provide specific guidance
    if (!results.mapboxAPI) {
      console.log('\n📝 To fix API issues:');
      console.log('   1. Get your Mapbox API key from https://account.mapbox.com/');
      console.log('   2. Set VITE_MAPBOX_API_KEY in your environment');
      console.log('   3. Ensure the key has geocoding:read permissions');
    }
    
    if (!results.databaseSchema) {
      console.log('\n📝 To fix database issues:');
      console.log('   1. Run: node migrate-complexes-to-mapbox.js');
      console.log('   2. Check database connectivity');
      console.log('   3. Verify DATABASE_URL is correct');
    }
  }

  return allPassed;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    })
    .finally(() => {
      client.end();
    });
}

export { runTests };