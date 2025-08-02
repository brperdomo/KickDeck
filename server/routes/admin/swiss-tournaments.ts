/**
 * Swiss Tournament Management Routes
 * API endpoints for Swiss system tournament creation and management
 */

import { Router } from 'express';
import SwissSystemScheduler from '../../services/swiss-system-scheduler.js';

const router = Router();

/**
 * POST /api/admin/swiss-tournaments/validate
 * Validate Swiss tournament parameters
 */
router.post('/validate', async (req, res) => {
  try {
    const { teams, rounds } = req.body;
    
    if (!teams || !Array.isArray(teams)) {
      return res.status(400).json({ 
        error: 'Teams array is required',
        isValid: false 
      });
    }
    
    if (!rounds || typeof rounds !== 'number') {
      return res.status(400).json({ 
        error: 'Number of rounds is required',
        isValid: false 
      });
    }
    
    const validation = SwissSystemScheduler.validateSwissTournament(teams, rounds);
    
    res.json({
      success: true,
      validation,
      recommendedRounds: Math.ceil(Math.log2(teams.length)),
      maxRounds: teams.length - 1
    });
    
  } catch (error: any) {
    console.error('Swiss tournament validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate Swiss tournament parameters',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/swiss-tournaments/generate-round
 * Generate pairings for a specific round
 */
router.post('/generate-round', async (req, res) => {
  try {
    const { round, teams, previousResults } = req.body;
    
    if (!round || typeof round !== 'number') {
      return res.status(400).json({ error: 'Round number is required' });
    }
    
    if (!teams || !Array.isArray(teams)) {
      return res.status(400).json({ error: 'Teams array is required' });
    }
    
    const pairings = SwissSystemScheduler.generateRoundPairings(
      round, 
      teams, 
      previousResults || []
    );
    
    res.json({
      success: true,
      round,
      pairings,
      pairingCount: pairings.length,
      byeTeams: teams.length % 2 === 1 ? 1 : 0
    });
    
  } catch (error: any) {
    console.error('Swiss round generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate Swiss round pairings',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/swiss-tournaments/standings
 * Calculate current standings from results
 */
router.post('/standings', async (req, res) => {
  try {
    const { teams, results } = req.body;
    
    if (!teams || !Array.isArray(teams)) {
      return res.status(400).json({ error: 'Teams array is required' });
    }
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required' });
    }
    
    const standings = SwissSystemScheduler.calculateCurrentStandings(teams, results);
    
    res.json({
      success: true,
      standings,
      totalGames: results.length,
      roundsCompleted: Math.max(...results.map(r => r.round), 0)
    });
    
  } catch (error: any) {
    console.error('Swiss standings calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate Swiss tournament standings',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/swiss-tournaments/final-rankings
 * Calculate final rankings with all tiebreakers
 */
router.post('/final-rankings', async (req, res) => {
  try {
    const { teams, results } = req.body;
    
    if (!teams || !Array.isArray(teams)) {
      return res.status(400).json({ error: 'Teams array is required' });
    }
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required' });
    }
    
    const standings = SwissSystemScheduler.calculateCurrentStandings(teams, results);
    const finalRankings = SwissSystemScheduler.calculateFinalRankings(standings);
    
    res.json({
      success: true,
      finalRankings,
      totalRounds: Math.max(...results.map(r => r.round), 0),
      tiebreakersUsed: ['Points', 'Buchholz Score', 'Strength of Schedule', 'Wins']
    });
    
  } catch (error: any) {
    console.error('Swiss final rankings error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate final Swiss tournament rankings',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/swiss-tournaments/tournament-info
 * Get information about Swiss tournament format
 */
router.get('/tournament-info', async (req, res) => {
  try {
    res.json({
      success: true,
      format: 'Swiss System',
      description: 'Performance-based pairing system where teams play multiple rounds without elimination',
      characteristics: {
        pairingMethod: 'Teams with similar scores are paired together',
        numberOfRounds: 'Typically log2(teams) to teams-1 rounds',
        tiebreakers: ['Head-to-head', 'Buchholz Score', 'Strength of Schedule', 'Number of Wins'],
        advantages: [
          'No elimination - all teams play full tournament',
          'Fair matchups based on performance',
          'Accurate final rankings',
          'Flexible number of rounds'
        ]
      },
      recommendedFor: [
        'Large tournaments (16+ teams)',
        'Skill-based competition',
        'Limited field availability',
        'Ranking determination'
      ],
      minimumTeams: 4,
      idealTeamCount: 'Even numbers (8, 16, 32, etc.)'
    });
    
  } catch (error: any) {
    console.error('Swiss tournament info error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve Swiss tournament information',
      details: error.message 
    });
  }
});

export default router;