/**
 * Team API routes for retrieving team information
 */
import { Request, Response } from 'express';
import { db } from '@db';
import { teams, events, eventAgeGroups, users } from '@db/schema';
import { eq, and, inArray, or, like, sql } from 'drizzle-orm';

/**
 * Get teams associated with the current authenticated user as coach or manager
 * Used in the "My Teams" component in the member dashboard
 */
export async function getMyTeams(req: Request, res: Response) {
  try {
    // User must be authenticated to access their teams
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userEmail = req.user.email.toLowerCase();
    
    // Fetch teams where the user is either the coach or manager
    const result = await db.select({
      id: teams.id,
      name: teams.name,
      eventId: teams.eventId,
      eventName: events.name,
      ageGroup: eventAgeGroups.ageGroup,
      status: teams.status,
      createdAt: teams.createdAt,
      startDate: events.startDate,
      coach: teams.coach,
      managerEmail: teams.managerEmail
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
    .where(
      or(
        // Check if user is the coach (stored in the coach JSON field)
        like(teams.coach, `%${userEmail}%`),
        // Check if user is the team manager
        eq(teams.managerEmail, userEmail)
      )
    );
    
    // Determine role for each team (coach or manager)
    const teamsWithRole = result.map(team => {
      // Parse the coach JSON to check if user is the coach
      let isCoach = false;
      try {
        const coachData = JSON.parse(team.coach as string);
        if (coachData && coachData.headCoachEmail === userEmail) {
          isCoach = true;
        }
      } catch (e) {
        // If JSON parsing fails, assume not coach
      }
      
      return {
        id: team.id,
        name: team.name,
        eventId: team.eventId,
        eventName: team.eventName,
        ageGroup: team.ageGroup,
        status: team.status,
        createdAt: team.createdAt,
        startDate: team.startDate,
        role: isCoach ? 'coach' : 'manager'
      };
    });
    
    return res.json(teamsWithRole);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
}
