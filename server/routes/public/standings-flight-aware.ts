import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, teamStandings, eventScoringRules, eventAgeGroups, events, eventBrackets } from '../../../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { StandingsCalculator } from '../../utils/standingsCalculator';

const router = Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// Get live standings for public viewing with flight-aware grouping
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Flight-Aware Public Standings] Fetching standings for event ${eventId}`);
    
    // Get event info
    const eventInfo = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        logoUrl: events.logoUrl
      })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (!eventInfo.length) {
      console.log(`[Flight-Aware Public Standings] Event ${eventId} not found`);
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    console.log(`[Flight-Aware Public Standings] Found event: ${eventInfo[0].name}`);

    // Get scoring rules to understand the point system
    const scoringRules = await db
      .select()
      .from(eventScoringRules)
      .where(and(
        eq(eventScoringRules.eventId, eventId),
        eq(eventScoringRules.isActive, true)
      ))
      .limit(1);

    // Get flight-aware age group and bracket combinations
    const flightGroups = await db
      .select({
        ageGroupId: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode,
        bracketId: eventBrackets.id,
        flightName: eventBrackets.name,
        teamCount: sql<number>`COUNT(DISTINCT teams.id)`
      })
      .from(games)
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
      .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
      .leftJoin(eventBrackets, eq(homeTeamTable.bracketId, eventBrackets.id))
      .leftJoin(teams, sql`teams.id IN (${games.homeTeamId}, ${games.awayTeamId})`)
      .where(and(
        eq(games.eventId, eventIdNum),
        sql`event_brackets.name IS NOT NULL`
      ))
      .groupBy(
        eventAgeGroups.id,
        eventAgeGroups.ageGroup,
        eventAgeGroups.gender,
        eventAgeGroups.birthYear,
        eventAgeGroups.divisionCode,
        eventBrackets.id,
        eventBrackets.name
      )
      .orderBy(eventAgeGroups.ageGroup, eventBrackets.name);

    console.log(`[Flight-Aware Public Standings] Found ${flightGroups.length} flight groups`);

    // Calculate standings for each flight group
    const standingsByFlightGroup = await Promise.all(
      flightGroups.map(async (flightGroup) => {
        try {
          console.log(`[Flight-Aware Public Standings] Processing ${flightGroup.ageGroup} ${flightGroup.gender} - ${flightGroup.flightName}`);

          // Get teams in this flight
          const flightTeams = await db
            .select({
              id: teams.id,
              name: teams.name,
              bracketId: teams.bracketId
            })
            .from(teams)
            .where(and(
              eq(teams.eventId, eventId),
              eq(teams.bracketId, flightGroup.bracketId)
            ));

          if (flightTeams.length === 0) {
            console.log(`[Flight-Aware Public Standings] No teams found for flight ${flightGroup.flightName}`);
            return null;
          }

          const teamIds = flightTeams.map(t => t.id);

          // Get games between teams in this flight only
          const flightGames = await db
            .select({
              id: games.id,
              homeTeamId: games.homeTeamId,
              awayTeamId: games.awayTeamId,
              homeTeamName: homeTeamTable.name,
              awayTeamName: awayTeamTable.name,
              homeScore: games.homeScore,
              awayScore: games.awayScore,
              status: games.status,
              homeYellowCards: games.homeYellowCards,
              awayYellowCards: games.awayYellowCards,
              homeRedCards: games.homeRedCards,
              awayRedCards: games.awayRedCards
            })
            .from(games)
            .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
            .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
            .where(and(
              eq(games.eventId, eventIdNum),
              eq(games.ageGroupId, flightGroup.ageGroupId),
              inArray(games.homeTeamId, teamIds),
              inArray(games.awayTeamId, teamIds)
            ));

          console.log(`[Flight-Aware Public Standings] Found ${flightGames.length} games for flight ${flightGroup.flightName}`);

          // Calculate standings for this flight
          let standings: any[] = [];
          
          if (flightGames.length > 0) {
            const calculator = new StandingsCalculator(eventId, flightGroup.ageGroupId);
            const calculatedStandings = await calculator.calculateStandings(flightGames);
            
            standings = calculatedStandings.map((team, index) => ({
              teamId: team.teamId,
              teamName: team.teamName,
              position: index + 1, // Force sequential positions for flight-level standings
              gamesPlayed: team.gamesPlayed,
              wins: team.wins,
              losses: team.losses,
              ties: team.ties,
              goalsScored: team.goalsScored,
              goalsAllowed: team.goalsAllowed,
              goalDifferential: team.goalDifferential,
              shutouts: team.shutouts,
              yellowCards: team.yellowCards,
              redCards: team.redCards,
              fairPlayPoints: team.fairPlayPoints,
              totalPoints: team.totalPoints,
              winPoints: team.winPoints || 0,
              tiePoints: team.tiePoints || 0,
              goalPoints: team.goalPoints || 0,
              shutoutPoints: team.shutoutPoints || 0,
              cardPenaltyPoints: team.cardPenaltyPoints || 0
            }));
          } else {
            // No games yet, create standings with 0 stats
            standings = flightTeams.map((team, index) => ({
              teamId: team.id,
              teamName: team.name,
              position: index + 1,
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              ties: 0,
              goalsScored: 0,
              goalsAllowed: 0,
              goalDifferential: 0,
              shutouts: 0,
              yellowCards: 0,
              redCards: 0,
              fairPlayPoints: 0,
              totalPoints: 0,
              winPoints: 0,
              tiePoints: 0,
              goalPoints: 0,
              shutoutPoints: 0,
              cardPenaltyPoints: 0
            }));
          }

          return {
            ageGroupId: flightGroup.ageGroupId,
            ageGroup: flightGroup.ageGroup,
            gender: flightGroup.gender,
            birthYear: flightGroup.birthYear,
            divisionCode: flightGroup.divisionCode,
            bracketId: flightGroup.bracketId,
            flightName: flightGroup.flightName,
            displayName: `${flightGroup.ageGroup} ${flightGroup.gender} - ${flightGroup.flightName}`,
            teamCount: standings.length,
            standings: standings
          };

        } catch (error) {
          console.error(`[Flight-Aware Public Standings] Error calculating standings for flight ${flightGroup.flightName}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and group by gender for display
    const validFlightGroups = standingsByFlightGroup.filter(fg => fg !== null);
    
    // Group by gender for frontend display
    const standingsByGender = {
      boys: validFlightGroups.filter(fg => fg.gender?.toLowerCase() === 'boys'),
      girls: validFlightGroups.filter(fg => fg.gender?.toLowerCase() === 'girls'),
      coed: validFlightGroups.filter(fg => fg.gender?.toLowerCase() === 'coed')
    };

    const totalTeams = validFlightGroups.reduce((sum, fg) => sum + fg.teamCount, 0);
    const totalFlights = validFlightGroups.length;

    console.log(`[Flight-Aware Public Standings] Calculated standings for ${totalFlights} flight groups with ${totalTeams} total teams`);

    res.json({
      success: true,
      eventInfo: eventInfo[0],
      scoringRules: scoringRules.length > 0 ? {
        title: scoringRules[0].title,
        systemType: scoringRules[0].systemType,
        scoring: {
          win: scoringRules[0].win,
          loss: scoringRules[0].loss,
          tie: scoringRules[0].tie,
          shutout: scoringRules[0].shutout,
          goalScored: scoringRules[0].goalScored,
          goalCap: scoringRules[0].goalCap,
          redCard: scoringRules[0].redCard,
          yellowCard: scoringRules[0].yellowCard
        },
        tiebreakers: [
          scoringRules[0].tiebreaker1,
          scoringRules[0].tiebreaker2,
          scoringRules[0].tiebreaker3,
          scoringRules[0].tiebreaker4,
          scoringRules[0].tiebreaker5,
          scoringRules[0].tiebreaker6,
          scoringRules[0].tiebreaker7,
          scoringRules[0].tiebreaker8
        ]
      } : null,
      standingsByGender,
      totalFlightGroups: totalFlights,
      totalTeams,
      lastUpdated: new Date().toISOString(),
      flightAware: true // Indicate this is flight-aware standings
    });

  } catch (error) {
    console.error('[Flight-Aware Public Standings] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flight-aware standings data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;