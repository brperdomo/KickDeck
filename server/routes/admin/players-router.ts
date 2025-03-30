import { Router } from "express";
import { db } from "@db";
import { playersTable, teams, insertPlayerSchema, selectPlayerSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Input validation schema for player data
const playerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  jerseyNumber: z.string().optional(),
  position: z.string().optional(),
  medicalNotes: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().optional(),
  parentGuardianPhone: z.string().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  isActive: z.boolean().default(true),
});

// GET /api/admin/teams/:teamId/players - Get all players for a team
router.get('/:teamId/players', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    
    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get players for the team
    const players = await db.query.playersTable.findMany({
      where: eq(playersTable.teamId, teamId)
    });
    
    return res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// POST /api/admin/teams/:teamId/players - Add a player to a team
router.post('/:teamId/players', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerData = req.body;
    
    // Verify team exists
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId)
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Validate player data
    try {
      playerSchema.parse(playerData);
    } catch (error: any) {
      return res.status(400).json({ error: error.errors || 'Invalid player data' });
    }
    
    // Insert the player
    const newPlayer = await db.insert(playersTable).values({
      ...playerData,
      teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    
    return res.status(201).json(newPlayer[0]);
  } catch (error) {
    console.error('Error adding player:', error);
    return res.status(500).json({ error: 'Failed to add player' });
  }
});

// PUT /api/admin/teams/:teamId/players/:playerId - Update a player
router.put('/:teamId/players/:playerId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    const playerData = req.body;
    
    // Verify team exists and player belongs to team
    const player = await db.query.playersTable.findFirst({
      where: eq(playersTable.id, playerId)
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.teamId !== teamId) {
      return res.status(403).json({ error: 'Player does not belong to this team' });
    }
    
    // Validate player data
    try {
      playerSchema.parse(playerData);
    } catch (error: any) {
      return res.status(400).json({ error: error.errors || 'Invalid player data' });
    }
    
    // Update the player
    const updatedPlayer = await db.update(playersTable)
      .set({
        ...playerData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(playersTable.id, playerId))
      .returning();
    
    return res.json(updatedPlayer[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    return res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE /api/admin/teams/:teamId/players/:playerId - Delete a player
router.delete('/:teamId/players/:playerId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    
    // Verify player exists and belongs to team
    const player = await db.query.playersTable.findFirst({
      where: eq(playersTable.id, playerId)
    });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.teamId !== teamId) {
      return res.status(403).json({ error: 'Player does not belong to this team' });
    }
    
    // Delete the player
    await db.delete(playersTable).where(eq(playersTable.id, playerId));
    
    return res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;