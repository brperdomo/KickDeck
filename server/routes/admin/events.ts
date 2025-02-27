import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups, seasonalScopes, eventScoringRules, eventComplexes, eventFieldSizes, eventFees, eventAgeGroupFees } from '@db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Event update validation schema
const updateEventSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timezone: z.string().optional(),
  applicationDeadline: z.string().optional(),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
  selectedAgeGroupIds: z.array(z.number()),
  seasonalScopeId: z.number()
});

// Get event details
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Fetching event details for:', eventId);

    // Get main event details
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event || event.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get age groups with their associated fees
    const ageGroups = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        birthYear: eventAgeGroups.birthYear,
        gender: eventAgeGroups.gender,
        projectedTeams: eventAgeGroups.projectedTeams,
        fieldSize: eventAgeGroups.fieldSize,
        scoringRule: eventAgeGroups.scoringRule,
        amountDue: eventAgeGroups.amountDue,
        birthDateStart: eventAgeGroups.birthDateStart,
        birthDateEnd: eventAgeGroups.birthDateEnd,
        divisionCode: eventAgeGroups.divisionCode,
        seasonalScopeId: eventAgeGroups.seasonalScopeId,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log('Fetched age groups:', ageGroups);

    // Combine all data
    const result = {
      ...event[0],
      ageGroups,
      seasonalScopeId: ageGroups[0]?.seasonalScopeId // Include the seasonal scope ID
    };

    console.log('Sending event details:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch event details', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update event
router.patch('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Updating event:', eventId, 'with data:', JSON.stringify(req.body, null, 2));

    const validatedData = updateEventSchema.parse(req.body);

    // Start a transaction
    await db.transaction(async (tx) => {
      // Update event details
      await tx
        .update(events)
        .set({
          name: validatedData.name,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          timezone: validatedData.timezone,
          applicationDeadline: validatedData.applicationDeadline,
          details: validatedData.details,
          agreement: validatedData.agreement,
          refundPolicy: validatedData.refundPolicy,
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId));

      // Delete existing age group associations
      await tx
        .delete(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId));

      // Get the selected age groups from the seasonal scope
      const scopeAgeGroups = await tx
        .select()
        .from(seasonalScopes)
        .where(eq(seasonalScopes.id, validatedData.seasonalScopeId))
        .limit(1);

      if (!scopeAgeGroups || scopeAgeGroups.length === 0) {
        throw new Error('Selected seasonal scope not found');
      }

      // Insert new age group associations
      const selectedAgeGroups = scopeAgeGroups[0].ageGroups.filter(
        (group: any) => validatedData.selectedAgeGroupIds.includes(group.id)
      );

      if (selectedAgeGroups.length > 0) {
        await tx
          .insert(eventAgeGroups)
          .values(selectedAgeGroups.map((group: any) => ({
            eventId,
            ageGroup: group.ageGroup,
            birthYear: group.birthYear,
            gender: group.gender,
            divisionCode: group.divisionCode,
            seasonalScopeId: validatedData.seasonalScopeId,
            birthDateStart: group.birthDateStart,
            birthDateEnd: group.birthDateEnd,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })));
      }
    });

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      message: 'Failed to update event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;