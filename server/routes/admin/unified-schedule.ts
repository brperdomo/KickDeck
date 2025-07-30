import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { db } from '../../../db';
import { events, teams, complexes, fields, games, gameTimeSlots } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Generate unified schedule for a single age group
router.post('/events/:eventId/unified-schedule', requireAuth, requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      selectedAgeGroup,
      gameFormat,
      teamNames,
      gameDuration,
      restPeriod,
      maxGamesPerDay,
      startDate,
      endDate,
      operatingStart,
      operatingEnd,
      availableFields,
      fieldType
    } = req.body;

    console.log(`[Unified Schedule] Generating schedule for event ${eventId}, age group: ${selectedAgeGroup}`);

    // Parse team names from the text input
    const teamsInGroup = teamNames.split('\n').filter((name: string) => name.trim()).map((name: string) => name.trim());
    
    if (teamsInGroup.length < 2) {
      return res.status(400).json({ error: 'At least 2 teams are required for schedule generation' });
    }

    console.log(`[Unified Schedule] Teams in ${selectedAgeGroup}: ${teamsInGroup.length} teams`);

    // Get event data to validate
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get available fields for this event
    const eventFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.isOpen, true));

    console.log(`[Unified Schedule] Available fields: ${eventFields.length}`);

    // Generate round-robin games for this age group
    const generatedGames = [];
    const gameId = Date.now(); // Simple ID generation for demo
    
    // Create round-robin matchups
    for (let i = 0; i < teamsInGroup.length; i++) {
      for (let j = i + 1; j < teamsInGroup.length; j++) {
        generatedGames.push({
          id: gameId + generatedGames.length,
          team1: teamsInGroup[i],
          team2: teamsInGroup[j],
          ageGroup: selectedAgeGroup,
          format: gameFormat,
          duration: gameDuration,
          status: 'scheduled'
        });
      }
    }

    // Assign time slots and fields
    const scheduledGames = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    let gameIndex = 0;
    let currentField = 0;
    
    while (currentDate <= endDateObj && gameIndex < generatedGames.length) {
      // Parse operating hours
      const [startHour, startMinute] = operatingStart.split(':').map(Number);
      const [endHour, endMinute] = operatingEnd.split(':').map(Number);
      
      let currentTime = startHour * 60 + startMinute; // Convert to minutes
      const endTime = endHour * 60 + endMinute;
      
      // Schedule games for current day
      let gamesPerDay = 0;
      
      while (currentTime + gameDuration + restPeriod <= endTime && 
             gameIndex < generatedGames.length && 
             gamesPerDay < availableFields * 8) { // Max games per field per day
        
        const game = generatedGames[gameIndex];
        const selectedField = eventFields[currentField % eventFields.length];
        
        const startTimeHours = Math.floor(currentTime / 60);
        const startTimeMinutes = currentTime % 60;
        const endTimeMinutes = currentTime + gameDuration;
        const endTimeHours = Math.floor(endTimeMinutes / 60);
        const endTimeMins = endTimeMinutes % 60;
        
        scheduledGames.push({
          ...game,
          date: currentDate.toISOString().split('T')[0],
          startTime: `${startTimeHours.toString().padStart(2, '0')}:${startTimeMinutes.toString().padStart(2, '0')}`,
          endTime: `${endTimeHours.toString().padStart(2, '0')}:${endTimeMins.toString().padStart(2, '0')}`,
          field: selectedField?.name || `Field ${currentField + 1}`,
          complex: selectedField?.complexName || 'Main Complex'
        });
        
        currentTime += gameDuration + restPeriod;
        currentField = (currentField + 1) % availableFields;
        gameIndex++;
        gamesPerDay++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`[Unified Schedule] Generated ${scheduledGames.length} scheduled games`);

    // Return the generated schedule
    res.json({
      success: true,
      ageGroup: selectedAgeGroup,
      gamesCount: scheduledGames.length,
      teamsCount: teamsInGroup.length,
      schedule: scheduledGames,
      summary: {
        totalGames: scheduledGames.length,
        teamsInvolved: teamsInGroup.length,
        daysUsed: Math.ceil(scheduledGames.length / (availableFields * 6)),
        fieldsUsed: Math.min(availableFields, scheduledGames.length),
        format: gameFormat,
        duration: gameDuration
      }
    });

  } catch (error) {
    console.error('[Unified Schedule] Error generating schedule:', error);
    res.status(500).json({ 
      error: 'Failed to generate schedule',
      details: error.message 
    });
  }
});

export default router;