import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, eventBrackets } from '../../../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

const router = Router();

// Fix flight assignments for existing teams based on their games
router.post('/fix-teams/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`🔧 Starting flight assignment fix for event ${eventId}`);

    // Get all games with notes containing flight information
    const gamesWithFlights = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        notes: games.notes
      })
      .from(games)
      .where(and(
        eq(games.eventId, eventId),
        isNotNull(games.notes)
      ));

    console.log(`📋 Found ${gamesWithFlights.length} games with notes`);

    // Extract flight information from game notes
    const teamFlightAssignments = new Map();
    
    for (const game of gamesWithFlights) {
      if (game.notes && game.notes.includes('Flight:')) {
        const flightMatch = game.notes.match(/Flight:\s*([^|]+)/);
        if (flightMatch) {
          const flightName = flightMatch[1].trim();
          
          // Store flight assignment for both teams
          teamFlightAssignments.set(game.homeTeamId, {
            flightName,
            ageGroupId: game.ageGroupId
          });
          teamFlightAssignments.set(game.awayTeamId, {
            flightName,
            ageGroupId: game.ageGroupId
          });
          
          console.log(`✈️ Found flight "${flightName}" for teams ${game.homeTeamId} and ${game.awayTeamId}`);
        }
      }
    }

    console.log(`🎯 Found flight assignments for ${teamFlightAssignments.size} teams`);

    // Create or find flights in event_brackets table
    const flightIdMap = new Map();
    const uniqueFlights = new Map(); // flightName -> ageGroupId
    
    for (const [teamId, assignment] of teamFlightAssignments) {
      const key = `${assignment.flightName}_${assignment.ageGroupId}`;
      if (!uniqueFlights.has(key)) {
        uniqueFlights.set(key, assignment);
      }
    }

    console.log(`🚁 Creating/finding ${uniqueFlights.size} unique flights`);

    for (const [key, assignment] of uniqueFlights) {
      // Check if flight already exists
      const existingFlight = await db.query.eventBrackets.findFirst({
        where: and(
          eq(eventBrackets.ageGroupId, assignment.ageGroupId),
          eq(eventBrackets.name, assignment.flightName)
        )
      });

      if (existingFlight) {
        flightIdMap.set(key, existingFlight.id);
        console.log(`🔍 Found existing flight: ${assignment.flightName} (ID: ${existingFlight.id})`);
      } else {
        // Create new flight
        const [newFlight] = await db.insert(eventBrackets).values({
          eventId: parseInt(eventId),
          ageGroupId: assignment.ageGroupId,
          name: assignment.flightName,
          description: `Flight ${assignment.flightName}`,
          level: 'Competitive',
          eligibility: 'Open',
          tournamentFormat: 'round_robin',
          maxTeams: 16,
          isActive: true,
          sortOrder: 1
        }).returning();

        flightIdMap.set(key, newFlight.id);
        console.log(`✅ Created new flight: ${assignment.flightName} (ID: ${newFlight.id})`);
      }
    }

    // Update teams with bracket assignments
    let updatedTeams = 0;
    for (const [teamId, assignment] of teamFlightAssignments) {
      const key = `${assignment.flightName}_${assignment.ageGroupId}`;
      const bracketId = flightIdMap.get(key);
      
      if (bracketId) {
        await db.update(teams)
          .set({ bracketId })
          .where(eq(teams.id, teamId));
        
        updatedTeams++;
        console.log(`🔄 Updated team ${teamId} to flight ${assignment.flightName} (Bracket ID: ${bracketId})`);
      }
    }

    console.log(`🎉 Flight assignment fix complete: ${updatedTeams} teams updated`);

    res.json({
      success: true,
      message: `Successfully updated ${updatedTeams} teams with flight assignments`,
      teamsUpdated: updatedTeams,
      flightsCreated: uniqueFlights.size
    });

  } catch (error) {
    console.error('❌ Flight assignment fix error:', error);
    res.status(500).json({
      error: 'Failed to fix flight assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;