import { Request, Response } from 'express';
import { generateGamesForEvent } from '../services/tournament-scheduler';

/**
 * Standalone API endpoint for game generation
 * This bypasses the complex routes.ts file to avoid compilation issues
 */
export async function handleGenerateGames(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    console.log(`🚀 [STANDALONE API] Game generation requested for event ${eventId}`);
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }
    
    console.log(`🚀 [STANDALONE API] Starting generateGamesForEvent...`);
    await generateGamesForEvent(eventId);
    
    console.log(`✅ [STANDALONE API] Game generation completed for event ${eventId}`);
    res.json({
      success: true,
      message: 'Games generated successfully for all brackets in the event'
    });
    
  } catch (error) {
    console.error(`❌ [STANDALONE API] Game generation failed for event ${req.params.eventId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate games',
      details: (error as Error).message
    });
  }
}