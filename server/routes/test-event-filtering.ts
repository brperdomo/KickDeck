import { Request, Response } from 'express';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { users, roles, adminRoles, eventAdministrators, events, teams } from '../../db/schema.js';
import { sql } from 'drizzle-orm/sql';

/**
 * Test endpoint to validate event filtering for finance admin
 * This simulates the behavior of the /api/admin/events endpoint without requiring authentication
 */
export const testFinanceAdminEventFiltering = async (req: Request, res: Response) => {
  try {
    // Force user ID to be the finance admin (ID: 73)
    const userId = 73;
    
    // Get the user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Finance admin user not found' });
    }
    
    // Get the user's role
    const userRoles = await db
      .select({
        roleName: roles.name
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, userId));
    
    // Check if the user is a super admin (shouldn't be for finance admin)
    const isSuperAdmin = userRoles.some(role => role.roleName === 'super_admin');
    
    // Get the events the user is assigned to
    const userEventIds = await db
      .select({
        eventId: eventAdministrators.eventId
      })
      .from(eventAdministrators)
      .where(eq(eventAdministrators.userId, userId))
      .then(results => results.map(r => r.eventId));
    
    // Get all events in the system for comparison
    const allEvents = await db.select().from(events);
    
    // Build the events query similar to the actual endpoint
    let eventsQuery = db
      .select({
        event: events,
        applicationCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
        teamCount: sql<number>`count(${teams.id})`.mapWith(Number),
      })
      .from(events)
      .leftJoin(teams, eq(events.id, teams.eventId));
    
    // For non-super-admin users, restrict events to those they are administrators for
    if (!isSuperAdmin && userEventIds.length > 0) {
      // Modify the query to only include events the user has access to
      eventsQuery = eventsQuery.where(
        sql`${events.id} IN (${sql.join(userEventIds.map(id => sql`${id}`), sql`, `)})`
      );
    } else if (!isSuperAdmin && userEventIds.length === 0) {
      // If there are no events assigned and not super admin, return empty list
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          roles: userRoles.map(r => r.roleName)
        },
        isSuperAdmin,
        assignedEventIds: userEventIds,
        totalEvents: allEvents.length,
        visibleEvents: []
      });
    }
    
    // Execute the query
    const eventsList = await eventsQuery
      .groupBy(events.id)
      .orderBy(events.startDate);
    
    // Format the response
    const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
      ...event,
      applicationCount,
      teamCount
    }));
    
    // Return comprehensive details for validation
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        roles: userRoles.map(r => r.roleName)
      },
      isSuperAdmin,
      assignedEventIds: userEventIds,
      totalEvents: allEvents.length,
      visibleEvents: formattedEvents
    });
    
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({ error: 'Test failed', details: String(error) });
  }
};