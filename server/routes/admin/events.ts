import { Router } from 'express';
import { db } from '../../../db';
import { events, eventAgeGroups, seasonalScopes, eventScoringRules, eventComplexes, eventFieldSizes } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const result = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        ageGroups: true,
        complexes: true,
        fieldSizes: true,
        scoringRules: true
      }
    });

    if (!result) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Failed to fetch event details', error: error.toString() });
  }
});

export default router;