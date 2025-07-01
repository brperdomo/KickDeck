/**
 * Frontend Scheduling Workflow Test
 * 
 * This script creates a test environment for the 6-step scheduling workflow
 * using the actual frontend components and authenticated session.
 */

// Function to simulate workflow data for testing
function createTestWorkflowData() {
  const testTeams = [
    { id: 1, name: "Thunder FC", ageGroupId: 1 },
    { id: 2, name: "Lightning United", ageGroupId: 1 },
    { id: 3, name: "Storm Rangers", ageGroupId: 1 },
    { id: 4, name: "Tornado FC", ageGroupId: 1 }
  ];
  
  const testEvent = {
    id: 1656618593,
    name: "SCHEDULING TEAMS",
    startDate: "2025-07-05",
    endDate: "2025-07-07",
    location: "Main Soccer Complex"
  };
  
  const testAgeGroup = {
    id: 1,
    name: "U17 Boys",
    minAge: 15,
    maxAge: 17
  };
  
  return {
    event: testEvent,
    ageGroup: testAgeGroup,
    teams: testTeams
  };
}

// Step 1: Flight Teams Function
function simulateStep1_FlightTeams(testData) {
  console.log("📋 STEP 1: FLIGHT THE TEAMS");
  console.log("---------------------------");
  
  const { teams, ageGroup } = testData;
  
  const flight = {
    id: `flight_${ageGroup.id}_1`,
    name: `${ageGroup.name} Flight 1`,
    ageGroupId: ageGroup.id,
    ageGroupName: ageGroup.name,
    teams: teams.map(team => ({
      ...team,
      flightId: `flight_${ageGroup.id}_1`
    })),
    teamCount: teams.length,
    skillLevel: 'mixed'
  };
  
  console.log(`✓ Created flight: ${flight.name}`);
  console.log(`✓ Assigned ${flight.teamCount} teams:`);
  teams.forEach((team, index) => {
    console.log(`  ${index + 1}. ${team.name}`);
  });
  
  return {
    flights: [flight],
    summary: {
      totalFlights: 1,
      totalTeams: teams.length
    }
  };
}

// Step 2: Create Brackets Function  
function simulateStep2_CreateBrackets(flightData) {
  console.log("\n🏆 STEP 2: CREATE BRACKETS");
  console.log("--------------------------");
  
  const flights = flightData.flights;
  const brackets = [];
  
  flights.forEach(flight => {
    const teamCount = flight.teams.length;
    const format = teamCount <= 4 ? 'round_robin_knockout' : 'knockout';
    
    const bracket = {
      id: `bracket_${flight.id}`,
      flightId: flight.id,
      flightName: flight.name,
      teamCount,
      format,
      poolCount: format === 'knockout' ? 0 : 1,
      poolPlayGames: format === 'knockout' ? 0 : (teamCount * (teamCount - 1)) / 2 - 1,
      finalGames: format === 'knockout' ? teamCount - 1 : 1,
      totalGames: 0,
      pools: []
    };
    
    bracket.totalGames = bracket.poolPlayGames + bracket.finalGames;
    
    if (format !== 'knockout') {
      bracket.pools.push({
        id: `pool_${bracket.id}_A`,
        name: 'Pool A',
        maxTeams: teamCount,
        teams: []
      });
    }
    
    brackets.push(bracket);
    
    console.log(`✓ Created bracket: ${bracket.flightName}`);
    console.log(`  Format: ${format}`);
    console.log(`  Pool Play Games: ${bracket.poolPlayGames}`);
    console.log(`  Final Games: ${bracket.finalGames}`);
    console.log(`  Total Games: ${bracket.totalGames}`);
  });
  
  return {
    brackets,
    summary: {
      totalBrackets: brackets.length,
      totalGames: brackets.reduce((sum, b) => sum + b.totalGames, 0)
    }
  };
}

// Step 3: Seed Teams Function
function simulateStep3_SeedTeams(bracketData, flightData) {
  console.log("\n🎯 STEP 3: SEED THE TEAMS");
  console.log("-------------------------");
  
  const brackets = bracketData.brackets;
  const flights = flightData.flights;
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
    
    flight.teams.forEach((team, index) => {
      const seedNumber = index + 1;
      const poolAssignment = bracket.format === 'knockout' ? null : 'Pool A';
      
      seeding.teams.push({
        id: team.id,
        name: team.name,
        seed: seedNumber,
        poolAssignment,
        flightId: flight.id,
        bracketId: bracket.id
      });
      
      console.log(`  ${seedNumber}. ${team.name}${poolAssignment ? ` → ${poolAssignment}` : ''}`);
    });
    
    if (seeding.pools.length > 0) {
      seeding.pools[0].teams = seeding.teams.length;
    }
    
    bracketSeedings.push(seeding);
    console.log(`✓ Seeded ${seeding.teams.length} teams for ${bracket.flightName}`);
  });
  
  return {
    bracketSeedings,
    summary: {
      totalBrackets: bracketSeedings.length,
      totalTeams: bracketSeedings.reduce((sum, bs) => sum + bs.teams.length, 0)
    }
  };
}

// Step 4: Set Time Blocks Function
function simulateStep4_SetTimeBlocks(eventData) {
  console.log("\n⏰ STEP 4: SET TIME BLOCKS");
  console.log("--------------------------");
  
  const { event } = eventData;
  const timeBlocks = [];
  
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  let blockId = 1;
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Morning session
    timeBlocks.push({
      id: `block_${blockId++}`,
      name: `Morning Session - ${dateStr}`,
      date: dateStr,
      startTime: '08:00',
      endTime: '12:00',
      duration: 240,
      maxGames: 8,
      availableFields: 2
    });
    
    // Afternoon session
    timeBlocks.push({
      id: `block_${blockId++}`,
      name: `Afternoon Session - ${dateStr}`,
      date: dateStr,
      startTime: '13:00',
      endTime: '17:00',
      duration: 240,
      maxGames: 8,
      availableFields: 2
    });
    
    console.log(`✓ Added time blocks for ${dateStr}`);
  }
  
  console.log(`✓ Created ${timeBlocks.length} total time blocks`);
  
  return {
    timeBlocks,
    summary: {
      totalBlocks: timeBlocks.length,
      totalGameSlots: timeBlocks.reduce((sum, tb) => sum + tb.maxGames, 0)
    }
  };
}

// Step 5: Generate Games Function
function simulateStep5_GenerateGames(bracketData, seedingData) {
  console.log("\n🎮 STEP 5: GENERATE GAMES");
  console.log("-------------------------");
  
  const brackets = bracketData.brackets;
  const seedings = seedingData.bracketSeedings;
  const allGames = [];
  let gameId = 1;
  
  brackets.forEach(bracket => {
    const seeding = seedings.find(s => s.bracketId === bracket.id);
    if (!seeding) return;
    
    console.log(`Generating games for ${bracket.flightName}:`);
    
    const bracketGames = {
      bracketId: bracket.id,
      bracketName: bracket.flightName,
      poolGames: [],
      knockoutGames: [],
      totalGames: 0
    };
    
    // Generate pool play games
    if (bracket.format !== 'knockout') {
      const teams = seeding.teams;
      console.log(`  Pool Play (${teams.length} teams):`);
      
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const game = {
            id: `game_${gameId++}`,
            bracketId: bracket.id,
            round: 'Pool Play',
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
            estimatedDuration: 65
          };
          
          bracketGames.poolGames.push(game);
          console.log(`    Game ${game.id}: ${game.team1.name} vs ${game.team2.name}`);
        }
      }
    }
    
    // Generate final game
    if (bracket.finalGames > 0) {
      console.log(`  Final Game:`);
      const finalGame = {
        id: `game_${gameId++}`,
        bracketId: bracket.id,
        round: 'Final',
        team1: { id: 'TBD', name: 'Pool Winner 1', seed: null },
        team2: { id: 'TBD', name: 'Pool Winner 2', seed: null },
        status: 'scheduled',
        estimatedDuration: 65
      };
      
      bracketGames.knockoutGames.push(finalGame);
      console.log(`    Game ${finalGame.id}: ${finalGame.team1.name} vs ${finalGame.team2.name}`);
    }
    
    bracketGames.totalGames = bracketGames.poolGames.length + bracketGames.knockoutGames.length;
    allGames.push(bracketGames);
    
    console.log(`✓ Generated ${bracketGames.totalGames} games for this bracket`);
  });
  
  const totalGames = allGames.reduce((sum, bg) => sum + bg.totalGames, 0);
  console.log(`✓ Total games generated: ${totalGames}`);
  
  return {
    bracketGames: allGames,
    totalGames,
    summary: {
      totalBrackets: allGames.length,
      poolGames: allGames.reduce((sum, bg) => sum + bg.poolGames.length, 0),
      knockoutGames: allGames.reduce((sum, bg) => sum + bg.knockoutGames.length, 0)
    }
  };
}

// Step 6: Finalize Schedule Function
function simulateStep6_FinalizeSchedule(gameData, timeBlockData) {
  console.log("\n📅 STEP 6: FINALIZE SCHEDULE");
  console.log("----------------------------");
  
  const games = gameData;
  const timeBlocks = timeBlockData.timeBlocks;
  
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
  
  console.log(`Scheduling ${allGamesList.length} games across ${timeBlocks.length} time blocks`);
  
  const schedule = { games: [], unscheduledGames: [] };
  let scheduledGames = 0;
  let timeBlockIndex = 0;
  let field = 1;
  let gameInBlock = 0;
  
  allGamesList.forEach(game => {
    if (timeBlockIndex >= timeBlocks.length) {
      schedule.unscheduledGames.push(game);
      return;
    }
    
    const timeBlock = timeBlocks[timeBlockIndex];
    
    if (gameInBlock >= timeBlock.maxGames) {
      timeBlockIndex++;
      gameInBlock = 0;
      field = 1;
      
      if (timeBlockIndex >= timeBlocks.length) {
        schedule.unscheduledGames.push(game);
        return;
      }
    }
    
    const currentTimeBlock = timeBlocks[timeBlockIndex];
    const gameSlot = Math.floor(gameInBlock / currentTimeBlock.availableFields);
    const timeOffset = gameSlot * 65; // 65 minutes per game
    
    const startTime = new Date();
    const [hours, minutes] = currentTimeBlock.startTime.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    startTime.setMinutes(startTime.getMinutes() + timeOffset);
    
    const scheduledGame = {
      ...game,
      timeBlockId: currentTimeBlock.id,
      field: `Field ${field}`,
      scheduledDate: currentTimeBlock.date,
      scheduledTime: startTime.toTimeString().slice(0, 5)
    };
    
    schedule.games.push(scheduledGame);
    scheduledGames++;
    gameInBlock++;
    field = (field % currentTimeBlock.availableFields) + 1;
    
    console.log(`  Game ${game.id}: ${game.team1?.name || 'TBD'} vs ${game.team2?.name || 'TBD'}`);
    console.log(`    → ${scheduledGame.scheduledDate} ${scheduledGame.scheduledTime} on ${scheduledGame.field}`);
  });
  
  console.log(`✓ Scheduled ${scheduledGames} games`);
  if (schedule.unscheduledGames.length > 0) {
    console.log(`⚠️ ${schedule.unscheduledGames.length} games could not be scheduled`);
  }
  
  return {
    schedule,
    scheduledGames,
    unscheduledGames: schedule.unscheduledGames.length,
    summary: {
      totalGames: allGamesList.length,
      scheduledGames,
      unscheduledGames: schedule.unscheduledGames.length
    }
  };
}

// Main workflow execution function
function runCompleteSchedulingWorkflow() {
  console.log("🏆 COMPLETE TOURNAMENT SCHEDULING WORKFLOW TEST");
  console.log("===============================================");
  
  // Create test data
  const testData = createTestWorkflowData();
  console.log(`📅 Event: ${testData.event.name}`);
  console.log(`📍 Location: ${testData.event.location}`);
  console.log(`📆 Dates: ${testData.event.startDate} to ${testData.event.endDate}`);
  console.log(`⚽ Age Group: ${testData.ageGroup.name}`);
  console.log(`👥 Teams: ${testData.teams.length}`);
  
  testData.teams.forEach((team, index) => {
    console.log(`  ${index + 1}. ${team.name}`);
  });
  
  // Execute workflow steps
  const workflowResults = {};
  
  // Step 1: Flight Teams
  workflowResults.flight = simulateStep1_FlightTeams(testData);
  
  // Step 2: Create Brackets  
  workflowResults.bracket = simulateStep2_CreateBrackets(workflowResults.flight);
  
  // Step 3: Seed Teams
  workflowResults.seed = simulateStep3_SeedTeams(workflowResults.bracket, workflowResults.flight);
  
  // Step 4: Set Time Blocks
  workflowResults.timeblock = simulateStep4_SetTimeBlocks(testData);
  
  // Step 5: Generate Games
  workflowResults.games = simulateStep5_GenerateGames(workflowResults.bracket, workflowResults.seed);
  
  // Step 6: Finalize Schedule  
  workflowResults.schedule = simulateStep6_FinalizeSchedule(workflowResults.games, workflowResults.timeblock);
  
  // Final Summary
  console.log("\n🎉 WORKFLOW COMPLETION SUMMARY");
  console.log("==============================");
  console.log(`Event: ${testData.event.name}`);
  console.log(`Age Group: ${testData.ageGroup.name}`);
  console.log(`Teams: ${testData.teams.length}`);
  console.log(`Flights: ${workflowResults.flight.summary.totalFlights}`);
  console.log(`Brackets: ${workflowResults.bracket.summary.totalBrackets}`);
  console.log(`Total Games: ${workflowResults.games.totalGames}`);
  console.log(`Time Blocks: ${workflowResults.timeblock.summary.totalBlocks}`);
  console.log(`Scheduled Games: ${workflowResults.schedule.scheduledGames}`);
  console.log(`Unscheduled Games: ${workflowResults.schedule.unscheduledGames}`);
  
  return workflowResults;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runCompleteSchedulingWorkflow = runCompleteSchedulingWorkflow;
  console.log("🚀 Scheduling workflow test loaded! Run 'runCompleteSchedulingWorkflow()' in console.");
} else {
  // Run directly if in Node.js
  runCompleteSchedulingWorkflow();
}