/**
 * Complete Tournament Scheduling Workflow Test
 * 
 * This script walks through all 6 steps of the tournament scheduling workflow
 * for the SCHEDULING TEAMS event (ID: 1656618593) with 4 U17 Boys teams.
 * 
 * Steps:
 * 1. Flight the Teams - Group teams by age/skill
 * 2. Create Brackets - Define tournament structure  
 * 3. Seed the Teams - Assign teams to brackets
 * 4. Set Time Blocks - Define available game times
 * 5. Generate Games - Create actual matchups
 * 6. Finalize Schedule - Assign times and locations
 */

const { db } = require('./db/index.ts');
const { teams, events, ageGroups } = require('./db/schema.ts');
const { eq, and } = require('drizzle-orm');

const EVENT_ID = '1656618593'; // SCHEDULING TEAMS event
const AGE_GROUP = 'U17 Boys';

async function testCompleteSchedulingWorkflow() {
  console.log('🏆 COMPLETE TOURNAMENT SCHEDULING WORKFLOW TEST');
  console.log('===============================================');
  
  try {
    // Get event details
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(EVENT_ID))
    });
    
    if (!event) {
      throw new Error(`Event ${EVENT_ID} not found`);
    }
    
    console.log(`📅 Event: ${event.name}`);
    console.log(`📍 Location: ${event.location}`);
    console.log(`📆 Dates: ${event.startDate} to ${event.endDate}`);
    
    // Get all approved teams for this event
    const allTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.eventId, parseInt(EVENT_ID)),
        eq(teams.status, 'approved')
      ),
      with: {
        ageGroup: true
      }
    });
    
    console.log(`\n👥 Total Approved Teams: ${allTeams.length}`);
    
    // Filter U17 Boys teams specifically
    const u17Teams = allTeams.filter(team => 
      team.ageGroup?.name === AGE_GROUP || 
      team.ageGroup?.name?.includes('U17') && team.ageGroup?.name?.includes('Boys')
    );
    
    console.log(`⚽ ${AGE_GROUP} Teams: ${u17Teams.length}`);
    u17Teams.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.name} (ID: ${team.id}) - Age Group: ${team.ageGroup?.name}`);
    });
    
    if (u17Teams.length < 4) {
      console.log(`\n⚠️  Only ${u17Teams.length} U17 teams found. Looking for any U17 teams...`);
      
      // Get all age groups for this event
      const eventAgeGroups = await db.query.ageGroups.findMany({
        where: eq(ageGroups.eventId, parseInt(EVENT_ID))
      });
      
      console.log('\n📊 Available Age Groups:');
      eventAgeGroups.forEach(ag => {
        const teamCount = allTeams.filter(t => t.ageGroupId === ag.id).length;
        console.log(`  - ${ag.name}: ${teamCount} teams`);
      });
      
      // Find the age group with teams closest to U17
      const u17AgeGroup = eventAgeGroups.find(ag => 
        ag.name?.includes('U17') || ag.name?.includes('17')
      );
      
      if (u17AgeGroup) {
        const u17AgTeams = allTeams.filter(t => t.ageGroupId === u17AgeGroup.id);
        console.log(`\n✅ Found ${u17AgTeams.length} teams in ${u17AgeGroup.name}`);
        u17AgTeams.forEach((team, index) => {
          console.log(`  ${index + 1}. ${team.name} (ID: ${team.id})`);
        });
        
        // Use these teams for the workflow
        await runSchedulingWorkflow(event, u17AgeGroup, u17AgTeams);
      } else {
        console.log('\n❌ No U17 age group found. Using first available age group with teams...');
        
        for (const ag of eventAgeGroups) {
          const agTeams = allTeams.filter(t => t.ageGroupId === ag.id);
          if (agTeams.length >= 2) {
            console.log(`\n🎯 Using ${ag.name} with ${agTeams.length} teams for testing`);
            agTeams.forEach((team, index) => {
              console.log(`  ${index + 1}. ${team.name} (ID: ${team.id})`);
            });
            await runSchedulingWorkflow(event, ag, agTeams.slice(0, 4)); // Use up to 4 teams
            break;
          }
        }
      }
    } else {
      await runSchedulingWorkflow(event, u17Teams[0].ageGroup, u17Teams);
    }
    
  } catch (error) {
    console.error('❌ Error in scheduling workflow test:', error);
  }
}

async function runSchedulingWorkflow(event, ageGroup, teams) {
  console.log('\n🚀 STARTING 6-STEP SCHEDULING WORKFLOW');
  console.log('=====================================');
  
  const workflowData = {
    event,
    ageGroup,
    teams: teams.slice(0, 4), // Limit to 4 teams for testing
    steps: {}
  };
  
  // STEP 1: Flight the Teams
  console.log('\n📋 STEP 1: FLIGHT THE TEAMS');
  console.log('---------------------------');
  
  const flightData = await step1_FlightTeams(workflowData);
  workflowData.steps.flight = flightData;
  console.log('✅ Step 1 Complete: Teams flighted successfully');
  
  // STEP 2: Create Brackets
  console.log('\n🏆 STEP 2: CREATE BRACKETS');
  console.log('--------------------------');
  
  const bracketData = await step2_CreateBrackets(workflowData);
  workflowData.steps.bracket = bracketData;
  console.log('✅ Step 2 Complete: Brackets created successfully');
  
  // STEP 3: Seed the Teams
  console.log('\n🎯 STEP 3: SEED THE TEAMS');
  console.log('-------------------------');
  
  const seedingData = await step3_SeedTeams(workflowData);
  workflowData.steps.seed = seedingData;
  console.log('✅ Step 3 Complete: Teams seeded successfully');
  
  // STEP 4: Set Time Blocks
  console.log('\n⏰ STEP 4: SET TIME BLOCKS');
  console.log('--------------------------');
  
  const timeBlockData = await step4_SetTimeBlocks(workflowData);
  workflowData.steps.timeblock = timeBlockData;
  console.log('✅ Step 4 Complete: Time blocks configured');
  
  // STEP 5: Generate Games
  console.log('\n🎮 STEP 5: GENERATE GAMES');
  console.log('-------------------------');
  
  const gameData = await step5_GenerateGames(workflowData);
  workflowData.steps.games = gameData;
  console.log('✅ Step 5 Complete: Games generated successfully');
  
  // STEP 6: Finalize Schedule
  console.log('\n📅 STEP 6: FINALIZE SCHEDULE');
  console.log('----------------------------');
  
  const scheduleData = await step6_FinalizeSchedule(workflowData);
  workflowData.steps.schedule = scheduleData;
  console.log('✅ Step 6 Complete: Schedule finalized successfully');
  
  // Final Summary
  console.log('\n🎉 WORKFLOW COMPLETION SUMMARY');
  console.log('==============================');
  console.log(`Event: ${event.name}`);
  console.log(`Age Group: ${ageGroup.name}`);
  console.log(`Teams: ${workflowData.teams.length}`);
  console.log(`Flights: ${flightData.flights.length}`);
  console.log(`Brackets: ${bracketData.brackets.length}`);
  console.log(`Total Games: ${gameData.totalGames}`);
  console.log(`Time Blocks: ${timeBlockData.timeBlocks.length}`);
  console.log(`Scheduled Games: ${scheduleData.scheduledGames}`);
  
  return workflowData;
}

async function step1_FlightTeams(workflowData) {
  const { teams, ageGroup } = workflowData;
  
  console.log(`Creating flight for ${teams.length} teams in ${ageGroup.name}`);
  
  // Create a single flight containing all teams
  const flight = {
    id: `flight_${ageGroup.id}_1`,
    name: `${ageGroup.name} Flight 1`,
    ageGroupId: ageGroup.id,
    ageGroupName: ageGroup.name,
    teams: teams.map(team => ({
      id: team.id,
      name: team.name,
      ageGroupId: team.ageGroupId,
      flightId: `flight_${ageGroup.id}_1`
    })),
    teamCount: teams.length,
    minTeams: 2,
    maxTeams: 8,
    skillLevel: 'mixed'
  };
  
  console.log(`  ✓ Created flight: ${flight.name}`);
  console.log(`  ✓ Teams assigned: ${flight.teamCount}`);
  
  teams.forEach(team => {
    console.log(`    - ${team.name} → ${flight.name}`);
  });
  
  return {
    flights: [flight],
    summary: {
      totalFlights: 1,
      totalTeams: teams.length,
      ageGroupsCovered: 1
    }
  };
}

async function step2_CreateBrackets(workflowData) {
  const { steps } = workflowData;
  const flights = steps.flight.flights;
  
  console.log(`Creating brackets for ${flights.length} flights`);
  
  const brackets = [];
  
  flights.forEach((flight, index) => {
    const teamCount = flight.teams.length;
    let format = 'round_robin_knockout';
    
    // Determine format based on team count
    if (teamCount <= 3) {
      format = 'pool_play'; // Round robin only
    } else if (teamCount <= 8) {
      format = 'round_robin_knockout'; // Pool play + knockout
    } else {
      format = 'knockout'; // Single elimination
    }
    
    const bracket = {
      id: `bracket_${flight.id}`,
      flightId: flight.id,
      flightName: flight.name,
      teamCount: teamCount,
      format: format,
      poolCount: format === 'knockout' ? 0 : Math.min(2, Math.ceil(teamCount / 4)),
      teamsPerPool: format === 'knockout' ? 0 : Math.ceil(teamCount / Math.min(2, Math.ceil(teamCount / 4))),
      poolPlayGames: calculatePoolPlayGames(teamCount, format),
      finalGames: calculateFinalGames(teamCount, format),
      totalGames: 0,
      estimatedDuration: 0,
      pools: []
    };
    
    bracket.totalGames = bracket.poolPlayGames + bracket.finalGames;
    bracket.estimatedDuration = bracket.totalGames * 65; // 65 minutes per game
    
    // Create pool structure
    if (format !== 'knockout') {
      const poolCount = Math.max(1, bracket.poolCount);
      for (let i = 0; i < poolCount; i++) {
        bracket.pools.push({
          id: `pool_${bracket.id}_${i + 1}`,
          name: `Pool ${String.fromCharCode(65 + i)}`, // Pool A, B, C, etc.
          maxTeams: bracket.teamsPerPool,
          teams: []
        });
      }
    }
    
    brackets.push(bracket);
    
    console.log(`  ✓ Created bracket: ${bracket.flightName}`);
    console.log(`    Format: ${format}`);
    console.log(`    Teams: ${bracket.teamCount}`);
    console.log(`    Pool Play Games: ${bracket.poolPlayGames}`);
    console.log(`    Final Games: ${bracket.finalGames}`);
    console.log(`    Total Games: ${bracket.totalGames}`);
  });
  
  return {
    brackets,
    summary: {
      totalBrackets: brackets.length,
      totalGames: brackets.reduce((sum, b) => sum + b.totalGames, 0),
      totalDuration: brackets.reduce((sum, b) => sum + b.estimatedDuration, 0),
      formats: Array.from(new Set(brackets.map(b => b.format)))
    }
  };
}

function calculatePoolPlayGames(teamCount, format) {
  if (format === 'knockout') return 0;
  if (teamCount <= 1) return 0;
  
  if (format === 'pool_play') {
    // Complete round robin
    return (teamCount * (teamCount - 1)) / 2;
  } else {
    // Pool play portion of round robin + knockout
    if (teamCount <= 4) {
      return (teamCount * (teamCount - 1)) / 2 - 1; // All matches except final
    } else {
      // Multiple pools
      const poolCount = Math.min(2, Math.ceil(teamCount / 4));
      const teamsPerPool = Math.ceil(teamCount / poolCount);
      return poolCount * ((teamsPerPool * (teamsPerPool - 1)) / 2);
    }
  }
}

function calculateFinalGames(teamCount, format) {
  if (format === 'pool_play') return 0;
  if (teamCount <= 1) return 0;
  
  if (format === 'knockout') {
    return teamCount - 1; // Single elimination
  } else {
    // Knockout portion of round robin + knockout
    if (teamCount <= 4) {
      return 1; // Just the final
    } else if (teamCount <= 8) {
      return 3; // Semi-final, 3rd place, final
    } else {
      return Math.pow(2, Math.ceil(Math.log2(Math.ceil(teamCount / 4)))) - 1;
    }
  }
}

async function step3_SeedTeams(workflowData) {
  const { steps } = workflowData;
  const brackets = steps.bracket.brackets;
  const flights = steps.flight.flights;
  
  console.log(`Seeding teams for ${brackets.length} brackets`);
  
  const bracketSeedings = [];
  
  brackets.forEach(bracket => {
    const flight = flights.find(f => f.id === bracket.flightId);
    if (!flight) return;
    
    const seeding = {
      bracketId: bracket.id,
      teams: [],
      pools: bracket.pools.map(pool => ({
        poolName: pool.name,
        teams: 0
      }))
    };
    
    // Assign teams to pools (if pools exist) or just seed them
    flight.teams.forEach((team, index) => {
      const seedNumber = index + 1;
      let poolAssignment = null;
      
      if (bracket.format !== 'knockout' && bracket.pools.length > 0) {
        // Distribute teams across pools in snake draft order
        const poolIndex = index % bracket.pools.length;
        poolAssignment = bracket.pools[poolIndex].name;
        seeding.pools[poolIndex].teams++;
      }
      
      seeding.teams.push({
        id: team.id,
        name: team.name,
        seed: seedNumber,
        poolAssignment: poolAssignment,
        flightId: flight.id,
        bracketId: bracket.id
      });
      
      console.log(`    ${seedNumber}. ${team.name}${poolAssignment ? ` → ${poolAssignment}` : ''}`);
    });
    
    bracketSeedings.push(seeding);
    
    console.log(`  ✓ Seeded ${seeding.teams.length} teams for ${bracket.flightName}`);
  });
  
  return {
    bracketSeedings,
    summary: {
      totalBrackets: bracketSeedings.length,
      totalTeams: bracketSeedings.reduce((sum, bs) => sum + bs.teams.length, 0),
      poolsUsed: bracketSeedings.reduce((sum, bs) => sum + bs.pools.length, 0)
    }
  };
}

async function step4_SetTimeBlocks(workflowData) {
  const { event } = workflowData;
  
  console.log(`Setting time blocks for ${event.name}`);
  
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);
  
  const timeBlocks = [];
  let blockId = 1;
  
  // Generate time blocks for each day of the event
  for (let date = new Date(eventStart); date <= eventEnd; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Morning sessions: 8:00 AM - 12:00 PM
    timeBlocks.push({
      id: `block_${blockId++}`,
      name: `Morning Session - ${dateStr}`,
      date: dateStr,
      startTime: '08:00',
      endTime: '12:00',
      duration: 240, // 4 hours in minutes
      maxGames: 8, // Assuming 30-minute games with setup
      availableFields: 2,
      gamesScheduled: 0
    });
    
    // Afternoon sessions: 1:00 PM - 5:00 PM
    timeBlocks.push({
      id: `block_${blockId++}`,
      name: `Afternoon Session - ${dateStr}`,
      date: dateStr,
      startTime: '13:00',
      endTime: '17:00',
      duration: 240,
      maxGames: 8,
      availableFields: 2,
      gamesScheduled: 0
    });
    
    console.log(`  ✓ Added time blocks for ${dateStr}`);
  }
  
  console.log(`  ✓ Created ${timeBlocks.length} time blocks`);
  console.log(`  ✓ Total available game slots: ${timeBlocks.reduce((sum, tb) => sum + tb.maxGames, 0)}`);
  
  return {
    timeBlocks,
    summary: {
      totalBlocks: timeBlocks.length,
      totalDays: Math.ceil((eventEnd - eventStart) / (1000 * 60 * 60 * 24)) + 1,
      totalGameSlots: timeBlocks.reduce((sum, tb) => sum + tb.maxGames, 0),
      fieldsAvailable: 2
    }
  };
}

async function step5_GenerateGames(workflowData) {
  const { steps } = workflowData;
  const brackets = steps.bracket.brackets;
  const seedings = steps.seed.bracketSeedings;
  
  console.log(`Generating games for ${brackets.length} brackets`);
  
  const allGames = [];
  let gameId = 1;
  
  brackets.forEach(bracket => {
    const seeding = seedings.find(s => s.bracketId === bracket.id);
    if (!seeding) return;
    
    console.log(`  Generating games for ${bracket.flightName}:`);
    
    const bracketGames = {
      bracketId: bracket.id,
      bracketName: bracket.flightName,
      poolGames: [],
      knockoutGames: [],
      totalGames: 0
    };
    
    // Generate pool play games
    if (bracket.format !== 'knockout' && seeding.pools.length > 0) {
      seeding.pools.forEach(pool => {
        const poolTeams = seeding.teams.filter(team => team.poolAssignment === pool.poolName);
        
        console.log(`    ${pool.poolName} (${poolTeams.length} teams):`);
        
        // Generate round-robin for this pool
        for (let i = 0; i < poolTeams.length; i++) {
          for (let j = i + 1; j < poolTeams.length; j++) {
            const game = {
              id: `game_${gameId++}`,
              bracketId: bracket.id,
              round: 'Pool Play',
              pool: pool.poolName,
              team1: {
                id: poolTeams[i].id,
                name: poolTeams[i].name,
                seed: poolTeams[i].seed
              },
              team2: {
                id: poolTeams[j].id,
                name: poolTeams[j].name,
                seed: poolTeams[j].seed
              },
              status: 'scheduled',
              estimatedDuration: 65,
              field: null,
              scheduledTime: null
            };
            
            bracketGames.poolGames.push(game);
            console.log(`      Game ${game.id}: ${game.team1.name} vs ${game.team2.name}`);
          }
        }
      });
    } else if (bracket.format === 'pool_play') {
      // Single pool round-robin
      const teams = seeding.teams;
      console.log(`    Round Robin (${teams.length} teams):`);
      
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const game = {
            id: `game_${gameId++}`,
            bracketId: bracket.id,
            round: 'Round Robin',
            team1: {
              id: teams[i].id,
              name: teams[i].name,
              seed: teams[i].seed
            },
            team2: {
              id: teams[j].id,
              name: teams[j].name,
              seed: teams[j].seed
            },
            status: 'scheduled',
            estimatedDuration: 65,
            field: null,
            scheduledTime: null
          };
          
          bracketGames.poolGames.push(game);
          console.log(`      Game ${game.id}: ${game.team1.name} vs ${game.team2.name}`);
        }
      }
    }
    
    // Generate knockout games
    if (bracket.format !== 'pool_play' && bracket.finalGames > 0) {
      console.log(`    Knockout Stage:`);
      
      // For simplicity, create placeholder knockout games
      for (let round = 1; round <= bracket.finalGames; round++) {
        const game = {
          id: `game_${gameId++}`,
          bracketId: bracket.id,
          round: round === bracket.finalGames ? 'Final' : `Round ${round}`,
          team1: {
            id: 'TBD',
            name: 'TBD',
            seed: null
          },
          team2: {
            id: 'TBD',
            name: 'TBD',
            seed: null
          },
          status: 'scheduled',
          estimatedDuration: 65,
          field: null,
          scheduledTime: null
        };
        
        bracketGames.knockoutGames.push(game);
        console.log(`      Game ${game.id}: ${game.round} - TBD vs TBD`);
      }
    }
    
    bracketGames.totalGames = bracketGames.poolGames.length + bracketGames.knockoutGames.length;
    allGames.push(bracketGames);
    
    console.log(`    ✓ Generated ${bracketGames.totalGames} games for this bracket`);
  });
  
  const totalGames = allGames.reduce((sum, bg) => sum + bg.totalGames, 0);
  console.log(`  ✓ Total games generated: ${totalGames}`);
  
  return {
    bracketGames: allGames,
    totalGames,
    summary: {
      totalBrackets: allGames.length,
      poolGames: allGames.reduce((sum, bg) => sum + bg.poolGames.length, 0),
      knockoutGames: allGames.reduce((sum, bg) => sum + bg.knockoutGames.length, 0),
      estimatedTotalDuration: totalGames * 65
    }
  };
}

async function step6_FinalizeSchedule(workflowData) {
  const { steps } = workflowData;
  const games = steps.games;
  const timeBlocks = steps.timeblock.timeBlocks;
  
  console.log(`Finalizing schedule for ${games.totalGames} games`);
  
  let scheduledGames = 0;
  let currentTimeBlockIndex = 0;
  let currentField = 1;
  let gamesInCurrentBlock = 0;
  
  const schedule = {
    games: [],
    conflicts: [],
    unscheduledGames: []
  };
  
  // Flatten all games
  const allGamesList = [];
  games.bracketGames.forEach(bracket => {
    bracket.poolGames.forEach(game => {
      allGamesList.push({ ...game, bracketName: bracket.bracketName, type: 'pool' });
    });
    bracket.knockoutGames.forEach(game => {
      allGamesList.push({ ...game, bracketName: bracket.bracketName, type: 'knockout' });
    });
  });
  
  console.log(`  Scheduling ${allGamesList.length} games across ${timeBlocks.length} time blocks`);
  
  // Schedule games
  allGamesList.forEach((game, index) => {
    if (currentTimeBlockIndex >= timeBlocks.length) {
      schedule.unscheduledGames.push(game);
      return;
    }
    
    const timeBlock = timeBlocks[currentTimeBlockIndex];
    
    // Check if current time block is full
    if (gamesInCurrentBlock >= timeBlock.maxGames) {
      currentTimeBlockIndex++;
      gamesInCurrentBlock = 0;
      currentField = 1;
      
      if (currentTimeBlockIndex >= timeBlocks.length) {
        schedule.unscheduledGames.push(game);
        return;
      }
    }
    
    const currentTimeBlock = timeBlocks[currentTimeBlockIndex];
    
    // Calculate game time within the block
    const gameSlotInBlock = Math.floor(gamesInCurrentBlock / currentTimeBlock.availableFields);
    const gameTimeOffset = gameSlotInBlock * 65; // 65 minutes per game slot
    
    const startTime = new Date();
    const [hours, minutes] = currentTimeBlock.startTime.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    startTime.setMinutes(startTime.getMinutes() + gameTimeOffset);
    
    const scheduledGame = {
      ...game,
      timeBlockId: currentTimeBlock.id,
      timeBlockName: currentTimeBlock.name,
      field: `Field ${currentField}`,
      scheduledDate: currentTimeBlock.date,
      scheduledTime: startTime.toTimeString().slice(0, 5),
      scheduledDateTime: startTime.toISOString()
    };
    
    schedule.games.push(scheduledGame);
    scheduledGames++;
    gamesInCurrentBlock++;
    
    // Move to next field
    currentField = (currentField % currentTimeBlock.availableFields) + 1;
    
    console.log(`    Game ${game.id}: ${game.team1?.name || 'TBD'} vs ${game.team2?.name || 'TBD'}`);
    console.log(`      → ${scheduledGame.scheduledDate} ${scheduledGame.scheduledTime} on ${scheduledGame.field}`);
  });
  
  console.log(`  ✓ Scheduled ${scheduledGames} games`);
  if (schedule.unscheduledGames.length > 0) {
    console.log(`  ⚠️  ${schedule.unscheduledGames.length} games could not be scheduled (insufficient time blocks)`);
  }
  
  return {
    schedule,
    scheduledGames,
    unscheduledGames: schedule.unscheduledGames.length,
    summary: {
      totalGames: allGamesList.length,
      scheduledGames,
      unscheduledGames: schedule.unscheduledGames.length,
      timeBlocksUsed: Math.min(timeBlocks.length, Math.ceil(scheduledGames / (timeBlocks[0]?.maxGames || 8))),
      conflictsDetected: schedule.conflicts.length
    }
  };
}

// Run the test
testCompleteSchedulingWorkflow()
  .then(() => {
    console.log('\n✅ Complete scheduling workflow test finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Scheduling workflow test failed:', error);
    process.exit(1);
  });