import { Router } from 'express';
import { db } from '../../../db';
import { eq, and, inArray } from 'drizzle-orm';
import { events, eventGameFormats, eventScheduleConstraints, teams, fields, complexes } from '../../../db/schema';

const router = Router();

/**
 * Simulate scheduling feasibility for given parameters
 */
router.post('/simulate-feasibility', async (req, res) => {
  try {
    const { eventId, workflowData, gameMetadata, fieldsData, teams: teamsData } = req.body;

    console.log('Running feasibility simulation for event:', eventId);

    // Get event data
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);

    if (eventResult.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult[0];

    // Calculate simulation parameters
    const simulationParams = {
      totalTeams: teamsData?.length || 0,
      gameFormats: gameMetadata?.gameFormats || [],
      constraints: gameMetadata?.constraints || {},
      availableFields: fieldsData?.length || 0,
      eventDuration: calculateEventDuration(event.startDate, event.endDate)
    };

    // Run feasibility calculations
    const feasibilityResult = await calculateFeasibility(simulationParams);

    res.json(feasibilityResult);
  } catch (error) {
    console.error('Feasibility simulation error:', error);
    res.status(500).json({ 
      error: 'Simulation failed',
      message: error.message 
    });
  }
});

/**
 * Simulate different scheduling scenarios
 */
router.post('/simulate-scenarios', async (req, res) => {
  try {
    const { eventId, scenarios } = req.body;

    console.log('Running scenario simulation for event:', eventId);

    const results = await Promise.all(
      scenarios.map(async (scenario: any) => {
        const feasibility = await calculateFeasibility(scenario);
        return {
          scenarioId: scenario.id,
          ...feasibility
        };
      })
    );

    res.json({ scenarios: results });
  } catch (error) {
    console.error('Scenario simulation error:', error);
    res.status(500).json({ 
      error: 'Scenario simulation failed',
      message: error.message 
    });
  }
});

/**
 * Analyze schedule quality metrics
 */
router.post('/analyze-quality', async (req, res) => {
  try {
    const { eventId, scheduleData } = req.body;

    console.log('Analyzing schedule quality for event:', eventId);

    const qualityMetrics = await calculateScheduleQuality(scheduleData, eventId);

    res.json(qualityMetrics);
  } catch (error) {
    console.error('Quality analysis error:', error);
    res.status(500).json({ 
      error: 'Quality analysis failed',
      message: error.message 
    });
  }
});

// Helper functions

function calculateEventDuration(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

async function calculateFeasibility(params: any) {
  const {
    totalTeams,
    gameFormats,
    constraints,
    availableFields,
    eventDuration
  } = params;

  // Default values if not provided
  const gameDuration = gameFormats[0]?.gameLength || 90; // minutes
  const bufferTime = gameFormats[0]?.bufferTime || 15; // minutes
  const operatingHours = 12; // 8 AM to 8 PM
  const restPeriod = constraints?.minRestTimeBetweenGames || 60; // minutes

  // Calculate game requirements
  const estimatedGamesPerTeam = 4; // Average for tournament play
  const totalGamesRequired = Math.floor((totalTeams * estimatedGamesPerTeam) / 2);

  // Calculate time slot availability
  const gameSlotDuration = gameDuration + bufferTime;
  const slotsPerFieldPerDay = Math.floor((operatingHours * 60) / gameSlotDuration);
  const totalTimeSlotsAvailable = slotsPerFieldPerDay * availableFields * eventDuration;

  // Factor in team rest constraints
  const restPeriodHours = restPeriod / 60;
  const maxGamesPerTeamPerDay = Math.floor(operatingHours / (gameSlotDuration / 60 + restPeriodHours));
  const teamConstrainedSlots = Math.floor(totalTeams * maxGamesPerTeamPerDay * eventDuration / 2);

  const effectiveTimeSlots = Math.min(totalTimeSlotsAvailable, teamConstrainedSlots);

  // Calculate metrics
  const isFeasible = totalGamesRequired <= effectiveTimeSlots;
  const utilizationRate = totalGamesRequired / effectiveTimeSlots;
  const compressionRatio = totalGamesRequired / totalTimeSlotsAvailable;

  // Generate recommendations
  const recommendations: string[] = [];
  const conflicts: string[] = [];

  if (!isFeasible) {
    const shortage = totalGamesRequired - effectiveTimeSlots;
    conflicts.push(`Need ${shortage} additional time slots to accommodate all games`);
    recommendations.push('Consider adding more fields or extending tournament duration');
    recommendations.push('Reduce game duration or buffer time between games');
  }

  if (utilizationRate > 0.95) {
    recommendations.push('Schedule is very tight - consider adding buffer for delays');
  }

  if (compressionRatio > 0.8) {
    recommendations.push('High field utilization - minimal flexibility for adjustments');
  }

  if (maxGamesPerTeamPerDay < 2) {
    conflicts.push('Rest period constraints severely limit games per team per day');
    recommendations.push('Consider reducing minimum rest time between games');
  }

  return {
    isFeasible,
    totalGamesRequired,
    totalTimeSlotsAvailable,
    fieldsRequired: Math.ceil(totalGamesRequired / (slotsPerFieldPerDay * eventDuration)),
    fieldsAvailable: availableFields,
    estimatedDuration: `${eventDuration} days`,
    conflicts,
    recommendations,
    utilizationMetrics: {
      fieldUtilization: Math.min(utilizationRate * 100, 100),
      timeUtilization: Math.min((totalGamesRequired / (slotsPerFieldPerDay * eventDuration)) * 100, 100),
      gameDistribution: calculateGameDistribution(totalTeams, totalGamesRequired)
    }
  };
}

function calculateGameDistribution(totalTeams: number, totalGames: number): number {
  // Calculate how evenly games are distributed among teams
  const avgGamesPerTeam = (totalGames * 2) / totalTeams;
  const idealDistribution = totalTeams * avgGamesPerTeam;
  const actualDistribution = totalGames * 2;
  
  return Math.min((actualDistribution / idealDistribution) * 100, 100);
}

async function calculateScheduleQuality(scheduleData: any, eventId: string) {
  const games = scheduleData.games || [];
  
  // Fetch teams for analysis
  const teamsResult = await db
    .select()
    .from(teams)
    .where(eq(teams.eventId, parseInt(eventId)));

  const teamsList = teamsResult.map(team => team.name);

  // 1. Team Game Balance Analysis
  const teamGameCounts = new Map<string, number>();
  games.forEach((game: any) => {
    if (game.teamA) teamGameCounts.set(game.teamA, (teamGameCounts.get(game.teamA) || 0) + 1);
    if (game.teamB) teamGameCounts.set(game.teamB, (teamGameCounts.get(game.teamB) || 0) + 1);
  });

  const gameCounts = Array.from(teamGameCounts.values());
  const avgGamesPerTeam = gameCounts.reduce((sum, count) => sum + count, 0) / gameCounts.length || 0;
  const gameBalanceVariance = gameCounts.reduce((sum, count) => 
    sum + Math.pow(count - avgGamesPerTeam, 2), 0
  ) / gameCounts.length || 0;
  const teamGameBalance = Math.max(0, 100 - (gameBalanceVariance * 10));

  // 2. Rest Time Compliance Analysis
  let restTimeViolations = 0;
  let totalRestPeriods = 0;

  teamsList.forEach(teamName => {
    const teamGames = games.filter((game: any) => 
      game.teamA === teamName || game.teamB === teamName
    ).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    for (let i = 0; i < teamGames.length - 1; i++) {
      const currentGame = teamGames[i];
      const nextGame = teamGames[i + 1];
      
      const restTime = (new Date(nextGame.startTime).getTime() - new Date(currentGame.endTime).getTime()) / (1000 * 60);
      totalRestPeriods++;
      
      if (restTime < 60) { // Less than 1 hour
        restTimeViolations++;
      }
    }
  });

  const restTimeCompliance = totalRestPeriods > 0 ? 
    ((totalRestPeriods - restTimeViolations) / totalRestPeriods) * 100 : 100;

  // 3. Field Utilization Analysis
  const fieldUsageMap = new Map<string, number>();
  games.forEach((game: any) => {
    const fieldId = game.fieldId;
    fieldUsageMap.set(fieldId, (fieldUsageMap.get(fieldId) || 0) + 1);
  });

  const totalPossibleSlots = Array.from(fieldUsageMap.keys()).length * 12; // 12 hours per day
  const fieldUtilization = (games.length / totalPossibleSlots) * 100;

  // 4. Time Distribution Analysis
  const hourlyGameCounts = new Array(24).fill(0);
  games.forEach((game: any) => {
    const hour = new Date(game.startTime).getHours();
    hourlyGameCounts[hour]++;
  });

  const activeHours = hourlyGameCounts.filter(count => count > 0);
  const avgGamesPerHour = activeHours.reduce((sum, count) => sum + count, 0) / activeHours.length || 0;
  const hourlyVariance = activeHours.reduce((sum, count) => 
    sum + Math.pow(count - avgGamesPerHour, 2), 0
  ) / activeHours.length || 0;
  const timeSpreadEveness = Math.max(0, 100 - (hourlyVariance * 5));

  // 5. Conflict Detection
  const conflictCount = detectScheduleConflicts(games);

  // Calculate component scores
  const fairnessScore = (teamGameBalance + restTimeCompliance) / 2;
  const efficiencyScore = (fieldUtilization + timeSpreadEveness) / 2;
  const utilizationScore = Math.min(fieldUtilization, 100);
  const distributionScore = timeSpreadEveness;

  // Overall score (weighted average with conflict penalty)
  const overallScore = Math.max(0, Math.min(100, 
    fairnessScore * 0.3 + 
    efficiencyScore * 0.25 + 
    utilizationScore * 0.25 + 
    distributionScore * 0.2 - 
    (conflictCount * 5)
  ));

  // Generate recommendations
  const recommendations = generateQualityRecommendations({
    teamGameBalance,
    restTimeCompliance,
    fieldUtilization,
    timeSpreadEveness,
    conflictCount
  });

  return {
    overallScore,
    fairnessScore,
    efficiencyScore,
    utilizationScore,
    distributionScore,
    details: {
      teamGameBalance,
      restTimeCompliance,
      fieldUtilization,
      timeSpreadEveness,
      conflictCount,
      recommendations
    }
  };
}

function detectScheduleConflicts(games: any[]): number {
  let conflicts = 0;
  
  // Check for time/field conflicts
  const timeFieldMap = new Map<string, Set<string>>();
  
  games.forEach(game => {
    const timeKey = `${game.startTime}-${game.fieldId}`;
    if (timeFieldMap.has(timeKey)) {
      conflicts++;
    } else {
      timeFieldMap.set(timeKey, new Set([game.id]));
    }
  });
  
  return conflicts;
}

function generateQualityRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (metrics.teamGameBalance < 80) {
    recommendations.push("Rebalance games to ensure all teams play similar numbers of games");
  }
  
  if (metrics.restTimeCompliance < 90) {
    recommendations.push("Add more buffer time between games for the same teams");
  }
  
  if (metrics.fieldUtilization < 60) {
    recommendations.push("Increase field utilization by scheduling more games or reducing field count");
  } else if (metrics.fieldUtilization > 90) {
    recommendations.push("Consider adding more fields or extending tournament duration to reduce congestion");
  }
  
  if (metrics.timeSpreadEveness < 70) {
    recommendations.push("Distribute games more evenly across time slots");
  }
  
  if (metrics.conflictCount > 0) {
    recommendations.push(`Resolve ${metrics.conflictCount} scheduling conflicts before finalizing`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Schedule quality is excellent! Ready for tournament execution.");
  }
  
  return recommendations;
}

export default router;