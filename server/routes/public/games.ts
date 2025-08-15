import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@db';
import { games } from '@db/schema';

const router = Router();

// GET /api/public/games/:gameId - Get public game information
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    // Use raw SQL to avoid Drizzle ORM issues
    const result = await db.execute(`
      SELECT 
        g.id,
        g.scheduled_date,
        g.scheduled_time,
        g.home_score,
        g.away_score,
        g.status,
        g.is_score_locked,
        g.home_team_id,
        g.away_team_id,
        g.field_id,
        g.age_group_id,
        ht.name as home_team_name,
        at.name as away_team_name,
        efc.field_name as field_name,
        eag.age_group as age_group_name
      FROM games g
      LEFT JOIN teams ht ON g.home_team_id = ht.id
      LEFT JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN event_field_configurations efc ON g.field_id = efc.field_id
      LEFT JOIN event_age_groups eag ON g.age_group_id = eag.id
      WHERE g.id = $1
      LIMIT 1
    `, [parseInt(gameId)]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const gameData = result.rows[0];

    const game = {
      id: gameData.id,
      homeTeam: {
        id: gameData.home_team_id,
        name: gameData.home_team_name || 'TBD'
      },
      awayTeam: {
        id: gameData.away_team_id,
        name: gameData.away_team_name || 'TBD'
      },
      homeScore: gameData.home_score,
      awayScore: gameData.away_score,
      startTime: `${gameData.scheduled_date} ${gameData.scheduled_time}`,
      field: {
        name: gameData.field_name || 'Field TBD'
      },
      status: gameData.status || 'scheduled',
      ageGroup: {
        ageGroup: gameData.age_group_name || 'Age Group'
      },
      isCompleted: gameData.status === 'completed',
      isScoreLocked: gameData.is_score_locked || false
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

    // Check if game exists and is not locked using raw SQL
    const gameCheckResult = await db.execute(`
      SELECT id, is_score_locked, status 
      FROM games 
      WHERE id = $1
    `, [parseInt(gameId)]);

    if (!gameCheckResult.rows || gameCheckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const gameCheck = gameCheckResult.rows[0];
    if (gameCheck.is_score_locked) {
      return res.status(403).json({ 
        error: 'This game\'s score has been locked by tournament administrators. Contact event staff to make changes.' 
      });
    }

    // Update the game score using raw SQL
    await db.execute(`
      UPDATE games 
      SET home_score = $1, away_score = $2, status = 'completed', updated_at = NOW()
      WHERE id = $3
    `, [homeScore, awayScore, parseInt(gameId)]);

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