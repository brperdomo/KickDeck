import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, events, eventAgeGroups, eventBrackets, fields } from '../../../db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and, isNotNull, sql } from 'drizzle-orm';

const router = Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// EMPIRE SUPER CUP DEDICATED FIX ROUTE
router.get('/empire/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[EMPIRE DEDICATED FIX] Processing Empire Super Cup event ${eventId}`);
    
    if (eventIdNum !== 1844329078) {
      return res.status(400).json({ error: 'This endpoint is only for Empire Super Cup event 1844329078' });
    }
    
    // Direct SQL to bypass Drizzle type mismatch issues
    const gamesQueryResult = await db.execute(sql`
      SELECT 
        g.id,
        g.home_team_id as "homeTeamId",
        g.away_team_id as "awayTeamId", 
        ht.name as "homeTeamName",
        at.name as "awayTeamName",
        g.scheduled_date as "scheduledDate",
        g.scheduled_time as "scheduledTime",
        g.field_id as "fieldId",
        f.name as "fieldName",
        g.duration,
        g.status,
        g.age_group_id as "ageGroupId",
        g.match_number as "matchNumber",
        g.home_score as "homeScore",
        g.away_score as "awayScore",
        g.round
      FROM games g
      LEFT JOIN fields f ON g.field_id = f.id
      LEFT JOIN teams ht ON g.home_team_id = ht.id  
      LEFT JOIN teams at ON g.away_team_id = at.id
      WHERE g.event_id = ${eventIdNum}
      ORDER BY g.scheduled_date, g.scheduled_time
    `);
    
    const gamesData = gamesQueryResult.rows as any[];
    console.log(`[EMPIRE DEDICATED FIX] Found ${gamesData.length} games for Empire Super Cup`);
    
    if (gamesData.length > 0) {
      console.log(`[EMPIRE DEDICATED FIX] SUCCESS! Sample games:`, gamesData.slice(0, 3).map(g => ({
        id: g.id,
        matchNumber: g.matchNumber,
        ageGroupId: g.ageGroupId,
        homeTeam: g.homeTeamName || `Team ${g.homeTeamId}`,
        awayTeam: g.awayTeamName || `Team ${g.awayTeamId}`
      })));
    }

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

    return res.json({
      success: true,
      message: `Empire Super Cup Fix - Found ${gamesData.length} games`,
      eventInfo: eventInfo[0] || null,
      totalGames: gamesData.length,
      sampleGames: gamesData.slice(0, 5).map(g => ({
        id: g.id,
        matchNumber: g.matchNumber,
        ageGroupId: g.ageGroupId,
        homeTeam: g.homeTeamName || `Team ${g.homeTeamId}`,
        awayTeam: g.awayTeamName || `Team ${g.awayTeamId}`,
        scheduledDate: g.scheduledDate,
        scheduledTime: g.scheduledTime
      }))
    });

  } catch (error: any) {
    console.error(`[EMPIRE DEDICATED FIX] Error:`, error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch Empire Super Cup data',
      message: error.message 
    });
  }
});

export default router;