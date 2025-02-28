
import { Request, Response } from 'express';
import { db } from '../db';
import { eventAgeGroupFees, eventFees, eventAgeGroups } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Get fee assignments for an event
export const getFeeAssignments = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    // Get all age groups for this event
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId),
    });

    // Get all fees for this event
    const fees = await db.query.eventFees.findMany({
      where: eq(eventFees.eventId, eventId),
    });

    // Get all fee assignments
    const allAgeGroupIds = ageGroups.map(group => group.id);
    const allFeeIds = fees.map(fee => fee.id);
    
    const assignments = await db.query.eventAgeGroupFees.findMany({
      where: and(
        eventAgeGroupFees.ageGroupId in allAgeGroupIds,
        eventAgeGroupFees.feeId in allFeeIds
      ),
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching fee assignments:', error);
    return res.status(500).json({ error: 'Failed to fetch fee assignments' });
  }
};

// Update fee assignments for a specific fee
export const updateFeeAssignments = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { feeId, ageGroupIds } = req.body;

  if (!feeId || !Array.isArray(ageGroupIds)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Get all age groups for this event
      const ageGroups = await tx.query.eventAgeGroups.findMany({
        where: eq(eventAgeGroups.eventId, eventId),
      });
      
      const allAgeGroupIds = ageGroups.map(group => group.id);
      
      // Delete existing assignments for this fee
      await tx
        .delete(eventAgeGroupFees)
        .where(
          and(
            eq(eventAgeGroupFees.feeId, feeId),
            eventAgeGroupFees.ageGroupId in allAgeGroupIds
          )
        );
      
      // Create new assignments
      for (const ageGroupId of ageGroupIds) {
        // Verify this age group belongs to this event
        if (allAgeGroupIds.includes(ageGroupId)) {
          await tx.insert(eventAgeGroupFees).values({
            ageGroupId,
            feeId,
          });
        }
      }
    });

    return res.status(200).json({ message: 'Fee assignments updated successfully' });
  } catch (error) {
    console.error('Error updating fee assignments:', error);
    return res.status(500).json({ error: 'Failed to update fee assignments' });
  }
};
