import express from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../../db';
import { teams, players, games, eventBrackets, eventAgeGroups, fields } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

const router = Router();

// Get all teams for an event with player details for roster cards
router.get('/events/:eventId/teams/detailed', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        clubName: teams.clubName,
        coach: teams.coach,
        managerName: teams.managerName,
        ageGroupId: teams.ageGroupId,
        bracketId: teams.bracketId,
        ageGroupName: eventAgeGroups.ageGroup,
        bracketName: eventBrackets.name
      })
      .from(teams)
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
      .where(eq(teams.eventId, eventId.toString()));

    // Get players for each team
    for (const team of teamsData) {
      const playersData = await db
        .select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          jerseyNumber: players.jerseyNumber,
          position: players.position
        })
        .from(players)
        .where(eq(players.teamId, team.id))
        .orderBy(players.jerseyNumber);

      (team as any).players = playersData;
    }

    res.json(teamsData);
  } catch (error) {
    console.error('Error fetching teams with details:', error);
    res.status(500).json({ error: 'Failed to fetch teams with details' });
  }
});

// Get detailed games with basic team information for gamecards
router.get('/events/:eventId/games/detailed', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    const gamesData = await db
      .select({
        id: games.id,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        duration: games.duration,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        fieldId: games.fieldId,
        fieldName: fields.name,
        round: games.round,
        matchNumber: games.matchNumber,
        gameNumber: sql<string>`CONCAT('G', ${games.id})`.as('game_number')
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(eq(games.eventId, eventId.toString()))
      .orderBy(games.scheduledDate, games.scheduledTime);

    // Get team details for each game
    const gamesWithTeams = [];
    for (const game of gamesData) {
      // Get home team
      const homeTeam = game.homeTeamId ? await db
        .select({
          id: teams.id,
          name: teams.name,
          clubName: teams.clubName,
          coach: teams.coach,
          managerName: teams.managerName
        })
        .from(teams)
        .where(eq(teams.id, game.homeTeamId))
        .limit(1) : null;

      // Get away team
      const awayTeam = game.awayTeamId ? await db
        .select({
          id: teams.id,
          name: teams.name,
          clubName: teams.clubName,
          coach: teams.coach,
          managerName: teams.managerName
        })
        .from(teams)
        .where(eq(teams.id, game.awayTeamId))
        .limit(1) : null;

      gamesWithTeams.push({
        ...game,
        homeTeam: homeTeam?.[0] || null,
        awayTeam: awayTeam?.[0] || null
      });
    }

    res.json(gamesWithTeams);
  } catch (error) {
    console.error('Error fetching games with details:', error);
    res.status(500).json({ error: 'Failed to fetch games with details' });
  }
});

// Generate and download PDF for selected teams or games
router.post('/events/:eventId/generate-pdf', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { type, selectedIds } = req.body;

    if (!type || !selectedIds || selectedIds.length === 0) {
      return res.status(400).json({ error: 'Type and selectedIds are required' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-cards.pdf"`);
    doc.pipe(res);

    if (type === 'teams') {
      // Generate team roster cards
      for (let i = 0; i < selectedIds.length; i++) {
        const teamId = selectedIds[i];
        
        // Get team details
        const [team] = await db
          .select({
            id: teams.id,
            name: teams.name,
            clubName: teams.clubName,
            coach: teams.coach,
            managerName: teams.managerName,
            ageGroupName: eventAgeGroups.ageGroup,
            bracketName: eventBrackets.name
          })
          .from(teams)
          .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
          .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
          .where(eq(teams.id, teamId));

        if (!team) continue;

        // Get players for this team
        const playersData = await db
          .select({
            firstName: players.firstName,
            lastName: players.lastName,
            jerseyNumber: players.jerseyNumber,
            position: players.position
          })
          .from(players)
          .where(eq(players.teamId, teamId))
          .orderBy(players.jerseyNumber);

        // Add new page for each team (except first)
        if (i > 0) doc.addPage();

        // Create team roster card
        generateTeamCard(doc, team, playersData);
      }
    } else if (type === 'games') {
      // Generate game schedule cards
      for (let i = 0; i < selectedIds.length; i++) {
        const gameId = selectedIds[i];
        
        // Get game details with basic team info
        const [game] = await db
          .select({
            id: games.id,
            scheduledDate: games.scheduledDate,
            scheduledTime: games.scheduledTime,
            fieldName: fields.name,
            round: games.round,
            homeTeamId: games.homeTeamId,
            awayTeamId: games.awayTeamId
          })
          .from(games)
          .leftJoin(fields, eq(games.fieldId, fields.id))
          .where(eq(games.id, gameId));

        if (!game) continue;

        // Get team names
        const homeTeam = game.homeTeamId ? await db
          .select({ name: teams.name })
          .from(teams)
          .where(eq(teams.id, game.homeTeamId))
          .limit(1) : null;

        const awayTeam = game.awayTeamId ? await db
          .select({ name: teams.name })
          .from(teams)
          .where(eq(teams.id, game.awayTeamId))
          .limit(1) : null;

        // Add new page for each game (except first)
        if (i > 0) doc.addPage();

        // Create game card
        generateGameCard(doc, {
          ...game,
          homeTeamName: homeTeam?.[0]?.name || 'TBD',
          awayTeamName: awayTeam?.[0]?.name || 'TBD'
        });
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to generate team roster card
function generateTeamCard(doc: PDFKit.PDFDocument, team: any, players: any[]) {
  // Header
  doc.fontSize(20).font('Helvetica-Bold')
     .text('TEAM ROSTER CARD', 50, 50, { align: 'center' });

  // Team info
  doc.fontSize(16).font('Helvetica-Bold')
     .text(team.clubName || team.name, 400, 50, { align: 'right' });
  
  doc.fontSize(12).font('Helvetica')
     .text(`Head Coach: ${team.coach || 'TBD'}`, 400, 75, { align: 'right' })
     .text(`Manager: ${team.managerName || 'TBD'}`, 400, 90, { align: 'right' })
     .text(team.ageGroupName || '', 400, 105, { align: 'right' });

  // Team name
  doc.fontSize(18).font('Helvetica-Bold')
     .text(team.name, 50, 120);

  // Player roster table
  let yPos = 160;
  doc.fontSize(12).font('Helvetica-Bold')
     .text('#', 50, yPos)
     .text('Player Name', 80, yPos)
     .text('Position', 250, yPos);

  yPos += 20;
  doc.moveTo(50, yPos).lineTo(500, yPos).stroke();
  yPos += 10;

  // Player rows
  players.forEach((player) => {
    doc.fontSize(10).font('Helvetica')
       .text(player.jerseyNumber?.toString() || '', 50, yPos)
       .text(`${player.firstName} ${player.lastName}`, 80, yPos)
       .text(player.position || '', 250, yPos);
    yPos += 15;
  });

  // Signature section
  yPos = 650;
  doc.fontSize(10).font('Helvetica')
     .text('Coach Signature: ____________________', 50, yPos)
     .text('Date: ____________________', 300, yPos);
}

// Helper function to generate game card
function generateGameCard(doc: PDFKit.PDFDocument, game: any) {
  // Header
  doc.fontSize(20).font('Helvetica-Bold')
     .text('GAME CARD', 50, 50, { align: 'center' });

  // Game info
  doc.fontSize(14).font('Helvetica-Bold')
     .text(`Game G${game.id}`, 50, 100)
     .text(`Round: ${game.round || 'TBD'}`, 300, 100);

  doc.fontSize(12).font('Helvetica')
     .text(`Date: ${game.scheduledDate || 'TBD'}`, 50, 120)
     .text(`Time: ${game.scheduledTime || 'TBD'}`, 200, 120)
     .text(`Field: ${game.fieldName || 'TBD'}`, 350, 120);

  // Teams
  doc.fontSize(16).font('Helvetica-Bold')
     .text('HOME:', 50, 180)
     .text(game.homeTeamName, 100, 180)
     .text('vs', 280, 180, { align: 'center' })
     .text('AWAY:', 350, 180)
     .text(game.awayTeamName, 400, 180);

  // Score section
  let yPos = 230;
  doc.fontSize(14).font('Helvetica-Bold')
     .text('FINAL SCORE', 50, yPos);
  
  yPos += 30;
  doc.rect(50, yPos, 100, 40).stroke();
  doc.rect(350, yPos, 100, 40).stroke();
  doc.fontSize(12).text('HOME', 70, yPos + 15);
  doc.text('AWAY', 370, yPos + 15);

  // Referee section
  yPos += 80;
  doc.fontSize(12).font('Helvetica-Bold')
     .text('REFEREE INFORMATION', 50, yPos);
  
  yPos += 25;
  doc.fontSize(10).font('Helvetica')
     .text('Referee Name: ____________________', 50, yPos)
     .text('Signature: ____________________', 300, yPos);
}

export default router;