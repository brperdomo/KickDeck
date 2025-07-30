import express from 'express';
import { db } from 'db';
import { eq, sql } from 'drizzle-orm';
import { 
  events, 
  teams, 
  eventGameFormats, 
  eventScheduleConstraints,
  fields,
  complexes,
  clubs,
  eventAgeGroups
} from '@db/schema';
import { isAdmin } from '../../middleware/auth';

const router = express.Router();

// GET /api/admin/events/:eventId/scheduling-readiness
// Analyze tournament configuration for scheduling readiness
router.get('/events/:eventId/scheduling-readiness', isAdmin, async (req, res) => {
  try {
    console.log(`=== SCHEDULING READINESS ANALYSIS ===`);
    console.log(`Event ID: ${req.params.eventId}`);
    
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ 
        error: 'Invalid event ID',
        providedEventId: req.params.eventId
      });
    }

    // 1. Fetch tournament teams with coach information
    console.log('Fetching teams...');
    const tournamentTeams = await db.select({
      id: teams.id,
      name: teams.name,
      ageGroupId: teams.ageGroupId,
      coach: teams.coach,
      coachNames: sql<string[]>`
        CASE 
          WHEN ${teams.coach}::text LIKE '%{%' 
          THEN ARRAY[${teams.coach}->>'headCoachName']
          ELSE ARRAY[${teams.coach}]
        END
      `,
      clubId: teams.clubId,
      status: teams.status
    })
    .from(teams)
    .where(eq(teams.eventId, eventId.toString()));

    console.log(`Found ${tournamentTeams.length} teams`);

    // 2. Fetch game formats
    console.log('Fetching game formats...');
    const gameFormats = await db.select()
      .from(eventGameFormats)
      .where(eq(eventGameFormats.eventId, eventId));

    console.log(`Found ${gameFormats.length} game formats`);

    // 3. Fetch schedule constraints
    console.log('Fetching schedule constraints...');
    const scheduleConstraints = await db.select()
      .from(eventScheduleConstraints)
      .where(eq(eventScheduleConstraints.eventId, eventId));

    console.log(`Found ${scheduleConstraints.length} schedule constraints`);

    // 4. Fetch fields and complexes
    console.log('Fetching fields...');
    const tournamentFields = await db.select({
      id: fields.id,
      name: fields.name,
      fieldSize: fields.fieldSize,
      hasLights: fields.hasLights,
      openTime: fields.openTime,
      closeTime: fields.closeTime,
      complexId: fields.complexId,
      complexName: complexes.name,
      complexOpenTime: complexes.openTime,
      complexCloseTime: complexes.closeTime
    })
    .from(fields)
    .leftJoin(complexes, eq(fields.complexId, complexes.id))
    .where(eq(fields.isOpen, true));

    console.log(`Found ${tournamentFields.length} available fields`);

    // 5. Fetch clubs
    console.log('Fetching clubs...');
    const tournamentClubs = await db.select()
      .from(clubs);

    console.log(`Found ${tournamentClubs.length} clubs`);

    // 6. Fetch age groups
    console.log('Fetching age groups...');
    const ageGroups = await db.select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId.toString()));

    console.log(`Found ${ageGroups.length} age groups`);

    // 7. Analyze coach conflicts
    console.log('Analyzing coach conflicts...');
    const coachTeamMap = new Map<string, any[]>();
    
    tournamentTeams.forEach(team => {
      if (team.coachNames && team.coachNames.length > 0) {
        team.coachNames.forEach((coachName: string) => {
          if (coachName && coachName.trim()) {
            const cleanCoachName = coachName.trim().toLowerCase();
            if (!coachTeamMap.has(cleanCoachName)) {
              coachTeamMap.set(cleanCoachName, []);
            }
            const teamList = coachTeamMap.get(cleanCoachName);
            if (teamList) {
              teamList.push(team);
            }
          }
        });
      }
    });

    const coachConflicts = Array.from(coachTeamMap.entries())
      .filter(([_, teams]) => teams.length > 1)
      .map(([coachName, teams]) => ({
        coachName,
        teams: teams.map(t => ({ id: t.id, name: t.name, ageGroupId: t.ageGroupId })),
        conflictCount: teams.length
      }));

    console.log(`Found ${coachConflicts.length} coaches with multiple teams`);

    // 8. Build comprehensive readiness report
    const readinessReport = {
      // Core data
      teams: tournamentTeams,
      gameFormats,
      scheduleConstraints: scheduleConstraints[0] || null,
      fields: tournamentFields,
      clubs: tournamentClubs,
      ageGroups,
      coachConflicts,

      // Analysis flags
      hasTeams: tournamentTeams.length > 0,
      hasGameFormats: gameFormats.length > 0,
      hasScheduleConstraints: scheduleConstraints.length > 0,
      hasFields: tournamentFields.length > 0,
      hasCoachInfo: tournamentTeams.some(t => t.coachNames && t.coachNames.length > 0),
      hasAgeGroups: ageGroups.length > 0,

      // Missing components (will be added when we implement them)
      flights: [], // TODO: Implement flights
      brackets: [], // TODO: Implement brackets
      seedingLogic: null, // TODO: Implement seeding
      advancementRules: null, // TODO: Implement advancement rules
      tieBreakerRules: null, // TODO: Implement tie-breaker rules
      spacingRules: scheduleConstraints[0] || null,
      timeSlotGenerator: true, // Automatic

      // Summary statistics
      stats: {
        totalTeams: tournamentTeams.length,
        approvedTeams: tournamentTeams.filter(t => t.status === 'approved').length,
        ageGroupCount: new Set(tournamentTeams.map(t => t.ageGroupId)).size,
        fieldCount: tournamentFields.length,
        coachConflictCount: coachConflicts.length,
        gameFormatCount: gameFormats.length
      }
    };

    console.log('Tournament readiness analysis complete');
    console.log('Stats:', readinessReport.stats);

    res.json(readinessReport);

  } catch (error: any) {
    console.error('=== SCHEDULING READINESS ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    
    res.status(500).json({ 
      error: 'Failed to analyze scheduling readiness', 
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;