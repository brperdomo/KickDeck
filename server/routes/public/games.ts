import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@db';
import { games, teams, eventAgeGroups, eventFieldConfigurations } from '@db/schema';

const router = Router();

// GET /api/public/games/:gameId - Get public game information
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const gameQuery = await db
      .select({
        // Game information
        id: games.id,
        startTime: games.startTime,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        status: games.status,
        isCompleted: games.isCompleted,
        isScoreLocked: games.isScoreLocked,
        // Home team
        homeTeamId: games.homeTeamId,
        homeTeamName: teams.name,
        // Field information
        fieldName: eventFieldConfigurations.fieldName,
        // Age group
        ageGroup: eventAgeGroups.ageGroup
      })
      .from(games)
      .innerJoin(teams, eq(games.homeTeamId, teams.id))
      .leftJoin(eventFieldConfigurations, eq(games.fieldId, eventFieldConfigurations.fieldId))
      .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);

    if (gameQuery.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const gameData = gameQuery[0];

    // Get away team separately
    const awayTeamQuery = await db
      .select({
        id: teams.id,
        name: teams.name
      })
      .from(teams)
      .where(eq(teams.id, gameData.homeTeamId === games.awayTeamId ? games.homeTeamId : games.awayTeamId))
      .limit(1);

    // Get the actual away team
    const awayTeamData = await db
      .select({
        id: teams.id,
        name: teams.name
      })
      .from(games)
      .innerJoin(teams, eq(games.awayTeamId, teams.id))
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);

    const awayTeam = awayTeamData.length > 0 ? awayTeamData[0] : { id: 0, name: 'TBD' };

    const game = {
      id: gameData.id,
      homeTeam: {
        id: gameData.homeTeamId,
        name: gameData.homeTeamName || 'TBD'
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name
      },
      homeScore: gameData.homeScore,
      awayScore: gameData.awayScore,
      startTime: gameData.startTime,
      field: {
        name: gameData.fieldName || 'Field TBD'
      },
      status: gameData.status,
      ageGroup: {
        ageGroup: gameData.ageGroup || 'Age Group'
      },
      isCompleted: gameData.isCompleted || false,
      isScoreLocked: gameData.isScoreLocked || false
    };

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/public/games/:gameId/score - Update game score (open submission)
router.post('/:gameId/score', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { homeScore, awayScore } = req.body;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || 
        homeScore < 0 || awayScore < 0) {
      return res.status(400).json({ error: 'Invalid scores. Scores must be non-negative numbers.' });
    }

    // Check if game exists and is not locked
    const gameCheck = await db
      .select({
        id: games.id,
        isScoreLocked: games.isScoreLocked,
        isCompleted: games.isCompleted
      })
      .from(games)
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);

    if (gameCheck.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (gameCheck[0].isScoreLocked) {
      return res.status(403).json({ 
        error: 'This game\'s score has been locked by tournament administrators. Contact event staff to make changes.' 
      });
    }

    // Update the game score
    await db
      .update(games)
      .set({
        homeScore,
        awayScore,
        isCompleted: true,
        status: 'completed',
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, parseInt(gameId)));

    // Log the score update
    console.log(`[PUBLIC SCORE UPDATE] Game ${gameId}: ${homeScore}-${awayScore} (IP: ${req.ip})`);

    res.json({ 
      success: true, 
      message: 'Score updated successfully',
      gameId: parseInt(gameId),
      homeScore,
      awayScore
    });

  } catch (error) {
    console.error('Error updating game score:', error);
    res.status(500).json({ error: 'Failed to update score. Please try again.' });
  }
});

export default router;