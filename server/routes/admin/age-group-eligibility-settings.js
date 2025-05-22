import { Router } from 'express';
import { db } from '../../../db/index.js';
import { eventAgeGroupEligibility } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get eligibility settings for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const settings = await db.query.eventAgeGroupEligibility.findMany({
      where: eq(eventAgeGroupEligibility.eventId, parseInt(eventId))
    });
    
    return res.json(settings);
  } catch (error) {
    console.error('Error getting age group eligibility settings:', error);
    return res.status(500).json({ error: 'Failed to get age group eligibility settings' });
  }
});

// Update age group eligibility status
router.put('/:ageGroupId', async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    const { isEligible, eventId } = req.body;
    
    console.log(`Updating age group ${ageGroupId} eligibility to: ${isEligible} for event ${eventId}`);
    
    if (isEligible === undefined || !eventId) {
      return res.status(400).json({ error: 'isEligible and eventId fields are required' });
    }
    
    // Convert to boolean to ensure consistent data type
    const eligibilityValue = Boolean(isEligible);
    const numericEventId = parseInt(eventId);
    const numericAgeGroupId = parseInt(ageGroupId);

    // Check if the setting already exists
    const existingSetting = await db.query.eventAgeGroupEligibility.findFirst({
      where: and(
        eq(eventAgeGroupEligibility.eventId, numericEventId),
        eq(eventAgeGroupEligibility.ageGroupId, numericAgeGroupId)
      )
    });

    if (existingSetting) {
      // Update existing setting
      await db
        .update(eventAgeGroupEligibility)
        .set({ isEligible: eligibilityValue })
        .where(and(
          eq(eventAgeGroupEligibility.eventId, numericEventId),
          eq(eventAgeGroupEligibility.ageGroupId, numericAgeGroupId)
        ));
    } else {
      // Create new setting
      await db.insert(eventAgeGroupEligibility).values({
        eventId: numericEventId,
        ageGroupId: numericAgeGroupId,
        isEligible: eligibilityValue
      });
    }
      
    console.log(`Successfully updated age group ${ageGroupId} eligibility to ${eligibilityValue} for event ${eventId}`);
    
    return res.json({ success: true, message: 'Age group eligibility updated successfully' });
  } catch (error) {
    console.error('Error updating age group eligibility:', error);
    return res.status(500).json({ error: 'Failed to update age group eligibility', details: error.message });
  }
});

// Bulk update age group eligibility for multiple age groups
router.put('/bulk/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ageGroups } = req.body;
    
    if (!ageGroups || !Array.isArray(ageGroups)) {
      return res.status(400).json({ error: 'ageGroups array is required' });
    }

    const numericEventId = parseInt(eventId);
    console.log(`Bulk updating eligibility for ${ageGroups.length} age groups in event ${eventId}`);
    
    // Update each age group's eligibility
    for (const ag of ageGroups) {
      if (ag.id && ag.isEligible !== undefined) {
        const numericAgeGroupId = parseInt(ag.id);
        // Convert to boolean to ensure consistent data type
        const eligibilityValue = Boolean(ag.isEligible);
        
        // Check if the setting already exists
        const existingSetting = await db.query.eventAgeGroupEligibility.findFirst({
          where: and(
            eq(eventAgeGroupEligibility.eventId, numericEventId),
            eq(eventAgeGroupEligibility.ageGroupId, numericAgeGroupId)
          )
        });

        if (existingSetting) {
          // Update existing setting
          await db
            .update(eventAgeGroupEligibility)
            .set({ isEligible: eligibilityValue })
            .where(and(
              eq(eventAgeGroupEligibility.eventId, numericEventId),
              eq(eventAgeGroupEligibility.ageGroupId, numericAgeGroupId)
            ));
        } else {
          // Create new setting
          await db.insert(eventAgeGroupEligibility).values({
            eventId: numericEventId,
            ageGroupId: numericAgeGroupId,
            isEligible: eligibilityValue
          });
        }
          
        console.log(`Updated age group ${ag.id} eligibility to ${eligibilityValue} for event ${eventId}`);
      }
    }
    
    return res.json({ 
      success: true, 
      message: `Updated eligibility for ${ageGroups.length} age groups` 
    });
  } catch (error) {
    console.error('Error bulk updating age group eligibility:', error);
    return res.status(500).json({ error: 'Failed to update age group eligibility', details: error.message });
  }
});

export default router;