import { Router } from 'express';
import { db } from '@db';
import { seasonalScopes, ageGroupSettings } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Get all seasonal scopes with their age groups
router.get('/', async (req, res) => {
  try {
    const scopes = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: {
          columns: {
            id: true,
            seasonalScopeId: true,
            ageGroup: true,
            gender: true,
            divisionCode: true,
            birthYear: true,
            minBirthYear: true,
            maxBirthYear: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      orderBy: (seasonalScopes, { desc }) => [desc(seasonalScopes.createdAt)]
    });

    res.json(scopes);
  } catch (error) {
    console.error('Error fetching seasonal scopes:', error);
    res.status(500).json({ message: 'Failed to fetch seasonal scopes' });
  }
});

// Create a new seasonal scope with age groups
router.post('/', async (req, res) => {
  try {
    const { name, startYear, endYear, ageGroups } = req.body;

    // Create the seasonal scope
    const [scope] = await db.insert(seasonalScopes).values({
      name,
      startYear,
      endYear,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Create age group settings for the scope
    if (ageGroups && ageGroups.length > 0) {
      const ageGroupsToInsert = ageGroups.map((group: {
        ageGroup: string;
        birthYear: number;
        gender: string;
        divisionCode: string;
        minBirthYear: number;
        maxBirthYear: number;
      }) => ({
        seasonalScopeId: scope.id,
        ageGroup: group.ageGroup,
        gender: group.gender,
        birthYear: group.birthYear,
        divisionCode: group.divisionCode,
        minBirthYear: group.minBirthYear,
        maxBirthYear: group.maxBirthYear,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await db.insert(ageGroupSettings).values(ageGroupsToInsert);
    }

    // Fetch the created scope with its age groups
    const createdScope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, scope.id),
      with: {
        ageGroups: {
          columns: {
            id: true,
            seasonalScopeId: true,
            ageGroup: true,
            gender: true,
            divisionCode: true,
            birthYear: true,
            minBirthYear: true,
            maxBirthYear: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    res.status(200).json(createdScope);
  } catch (error) {
    console.error('Error creating seasonal scope:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to create seasonal scope' });
  }
});

// Update a seasonal scope
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, startYear, endYear } = req.body;

    // Update the seasonal scope
    const [updatedScope] = await db.update(seasonalScopes)
      .set({
        name,
        startYear,
        endYear,
        updatedAt: new Date(),
      })
      .where(eq(seasonalScopes.id, id))
      .returning();

    if (!updatedScope) {
      return res.status(404).json({ message: 'Seasonal scope not found' });
    }

    // Fetch the updated scope with its age groups
    const scope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, id),
      with: {
        ageGroups: {
          columns: {
            id: true,
            seasonalScopeId: true,
            ageGroup: true,
            gender: true,
            divisionCode: true,
            birthYear: true,
            minBirthYear: true,
            maxBirthYear: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    res.json(scope);
  } catch (error) {
    console.error('Error updating seasonal scope:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to update seasonal scope' });
  }
});

// Delete a seasonal scope
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Due to cascade delete setup in schema, deleting the seasonal scope
    // will automatically delete associated age groups
    const [deletedScope] = await db.delete(seasonalScopes)
      .where(eq(seasonalScopes.id, id))
      .returning();

    if (!deletedScope) {
      return res.status(404).json({ message: 'Seasonal scope not found' });
    }

    res.status(200).json({ message: 'Seasonal scope deleted successfully' });
  } catch (error) {
    console.error('Error deleting seasonal scope:', error);
    res.status(500).json({ message: 'Failed to delete seasonal scope' });
  }
});

export default router;