import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../../db';
import { teams, players, games, eventBrackets, eventAgeGroups, fields } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

const router = Router();

// Schema for PDF generation request
const pdfRequestSchema = z.object({
  type: z.enum(['teams', 'games']),
  selectedIds: z.array(z.number())
});

// Get detailed teams with players for gamecards
router.get('/events/:eventId/teams/detailed', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get teams with full details
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
      .where(and(
        eq(teams.eventId, eventId.toString()),
        eq(teams.status, 'approved')
      ))
      .orderBy(teams.name);

    // Get players for each team
    const teamsWithPlayers = await Promise.all(
      teamsData.map(async (team) => {
        const teamPlayers = await db
          .select({
            id: players.id,
            firstName: players.firstName,
            lastName: players.lastName,
            dateOfBirth: players.dateOfBirth,
            jerseyNumber: players.jerseyNumber
          })
          .from(players)
          .where(eq(players.teamId, team.id))
          .orderBy(players.lastName, players.firstName);

        return {
          ...team,
          players: teamPlayers
        };
      })
    );

    res.json(teamsWithPlayers);
  } catch (error) {
    console.error('Error fetching detailed teams:', error);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// Get detailed games with team information for gamecards
router.get('/events/:eventId/games/detailed', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Create aliases for the teams table
    const homeTeam = alias(teams, 'home_team');
    const awayTeam = alias(teams, 'away_team');

    const gamesData = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        fieldId: games.fieldId,
        fieldName: fields.name,
        round: games.round,
        matchNumber: games.matchNumber,
        gameNumber: sql<string>`CONCAT('G', ${games.id})`.as('game_number'),
        homeTeamName: homeTeam.name,
        homeTeamClub: homeTeam.clubName,
        homeTeamCoach: homeTeam.coach,
        homeTeamManager: homeTeam.managerName,
        awayTeamName: awayTeam.name,
        awayTeamClub: awayTeam.clubName,
        awayTeamCoach: awayTeam.coach,
        awayTeamManager: awayTeam.managerName
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(homeTeam, eq(games.homeTeamId, homeTeam.id))
      .leftJoin(awayTeam, eq(games.awayTeamId, awayTeam.id))
      .where(eq(games.eventId, eventId.toString()))
      .orderBy(games.scheduledDate, games.scheduledTime);

    // Transform to include nested team objects
    const formattedGames = gamesData.map(game => ({
      id: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      scheduledDate: game.scheduledDate?.toISOString().split('T')[0] || '',
      scheduledTime: game.scheduledTime || '',
      fieldId: game.fieldId,
      fieldName: game.fieldName || `Field ${game.fieldId}`,
      round: game.round || 'Group Play',
      matchNumber: game.matchNumber || 1,
      gameNumber: game.gameNumber,
      homeTeam: {
        id: game.homeTeamId,
        name: game.homeTeamName || 'TBD',
        clubName: game.homeTeamClub,
        coachName: game.homeTeamCoach,
        managerName: game.homeTeamManager,
        logoUrl: game.homeTeamLogo
      },
      awayTeam: {
        id: game.awayTeamId,
        name: game.awayTeamName || 'TBD',
        clubName: game.awayTeamClub,
        coachName: game.awayTeamCoach,
        managerName: game.awayTeamManager,
        logoUrl: game.awayTeamLogo
      }
    }));

    res.json(formattedGames);
  } catch (error) {
    console.error('Error fetching detailed games:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// Generate PDF for gamecards
router.post('/events/:eventId/gamecards/pdf', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { type, selectedIds } = pdfRequestSchema.parse(req.body);

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 20,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gamecards-${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
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

        // Get players
        const teamPlayers = await db
          .select({
            firstName: players.firstName,
            lastName: players.lastName,
            dateOfBirth: players.dateOfBirth,
            jerseyNumber: players.jerseyNumber
          })
          .from(players)
          .where(eq(players.teamId, teamId))
          .orderBy(players.lastName, players.firstName);

        // Add new page for each team (except first)
        if (i > 0) doc.addPage();

        // Generate team roster card
        generateTeamRosterPDF(doc, team, teamPlayers);
      }
    } else if (type === 'games') {
      // Generate game schedule cards
      for (let i = 0; i < selectedIds.length; i++) {
        const gameId = selectedIds[i];
        
        // Get game details
        const homeTeamPdf = alias(teams, 'home_team_pdf');
        const awayTeamPdf = alias(teams, 'away_team_pdf');
        
        const [game] = await db
          .select({
            id: games.id,
            scheduledDate: games.scheduledDate,
            scheduledTime: games.scheduledTime,
            fieldName: fields.name,
            round: games.round,
            homeTeamName: homeTeamPdf.name,
            awayTeamName: awayTeamPdf.name
          })
          .from(games)
          .leftJoin(fields, eq(games.fieldId, fields.id))
          .leftJoin(homeTeamPdf, eq(games.homeTeamId, homeTeamPdf.id))
          .leftJoin(awayTeamPdf, eq(games.awayTeamId, awayTeamPdf.id))
          .where(eq(games.id, gameId));

        if (!game) continue;

        // Add new page for each game (except first)
        if (i > 0) doc.addPage();

        // Generate game schedule card
        generateGameSchedulePDF(doc, game);
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to generate team roster PDF
function generateTeamRosterPDF(doc: PDFKit.PDFDocument, team: any, players: any[]) {
  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('Team Roster', 50, 50);
  
  // Team info
  doc.fontSize(16).font('Helvetica-Bold')
     .text(team.clubName || team.name, 400, 50, { align: 'right' });
  
  doc.fontSize(12).font('Helvetica')
     .text(`Head Coach: ${team.coach || 'TBD'}`, 400, 75, { align: 'right' })
     .text(`Manager: ${team.managerName || 'TBD'}`, 400, 90, { align: 'right' })
     .text(team.ageGroupName || '', 400, 105, { align: 'right' });

  // Players header
  doc.fontSize(12).font('Helvetica-Bold')
     .text('#', 50, 140)
     .text('NAME', 100, 140)
     .text('DOB', 400, 140);

  // Players list
  let yPos = 160;
  players.slice(0, 18).forEach((player, index) => {
    const dob = new Date(player.dateOfBirth).toLocaleDateString('en-US');
    
    doc.fontSize(10).font('Helvetica')
       .text(player.jerseyNumber?.toString() || '', 50, yPos)
       .text(`${player.lastName}, ${player.firstName}`, 100, yPos)
       .text(dob, 400, yPos);
    
    yPos += 20;
  });

  // Games section
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Games Schedule', 50, yPos + 40);

  // Add empty game templates
  const gameTemplates = [
    { title: 'Game 1', date: 'TBD', time: 'TBD', venue: 'TBD' },
    { title: 'Game 2', date: 'TBD', time: 'TBD', venue: 'TBD' },
    { title: 'Game 3', date: 'TBD', time: 'TBD', venue: 'TBD' }
  ];

  let gameYPos = yPos + 70;
  gameTemplates.forEach((game, index) => {
    const xPos = 50 + (index * 160);
    
    doc.rect(xPos, gameYPos, 150, 100).stroke();
    doc.fontSize(12).font('Helvetica-Bold')
       .text(game.title, xPos + 5, gameYPos + 5);
    
    doc.fontSize(10).font('Helvetica')
       .text(`${game.date} ${game.time}`, xPos + 5, gameYPos + 25)
       .text(`Venue: ${game.venue}`, xPos + 5, gameYPos + 40);
  });

  // Signature line
  doc.fontSize(10).font('Helvetica')
     .text('TEAM SIGNATURE', 400, doc.page.height - 100, { align: 'right' });
  doc.moveTo(300, doc.page.height - 85)
     .lineTo(550, doc.page.height - 85)
     .stroke();
}

// Helper function to generate game schedule PDF
function generateGameSchedulePDF(doc: PDFKit.PDFDocument, game: any) {
  // Header
  doc.fontSize(18).font('Helvetica-Bold')
     .text('Game Schedule', 50, 50, { align: 'center' });
  
  doc.fontSize(12).font('Helvetica')
     .text(`Game #${game.id}`, 50, 80, { align: 'center' });

  // Game details
  const gameDate = game.scheduledDate ? new Date(game.scheduledDate).toLocaleDateString('en-US') : 'TBD';
  const gameTime = game.scheduledTime || 'TBD';
  
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Game Information', 50, 120);
  
  doc.fontSize(12).font('Helvetica')
     .text(`Date: ${gameDate}`, 50, 145)
     .text(`Time: ${gameTime}`, 50, 165)
     .text(`Field: ${game.fieldName || 'TBD'}`, 50, 185)
     .text(`Round: ${game.round || 'Group Play'}`, 50, 205);

  // Teams
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Teams', 300, 120);
  
  doc.fontSize(12).font('Helvetica')
     .text(`Home: ${game.homeTeamName || 'TBD'}`, 300, 145)
     .text(`Away: ${game.awayTeamName || 'TBD'}`, 300, 165);

  // Score boxes
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Score Card', 50, 250);

  // Home team score box
  doc.rect(50, 280, 200, 100).stroke();
  doc.fontSize(12).font('Helvetica-Bold')
     .text('HOME TEAM', 50, 285, { width: 200, align: 'center' });
  
  doc.fontSize(10).font('Helvetica')
     .text(game.homeTeamName || 'TBD', 55, 305);

  // Away team score box
  doc.rect(300, 280, 200, 100).stroke();
  doc.fontSize(12).font('Helvetica-Bold')
     .text('AWAY TEAM', 300, 285, { width: 200, align: 'center' });
  
  doc.fontSize(10).font('Helvetica')
     .text(game.awayTeamName || 'TBD', 305, 305);

  // Referee section
  doc.rect(50, 420, 450, 80).stroke();
  doc.fontSize(12).font('Helvetica-Bold')
     .text('REFEREE INFORMATION', 50, 425, { width: 450, align: 'center' });
  
  doc.fontSize(10).font('Helvetica')
     .text('Referee: ___________________', 60, 450)
     .text('Signature: ___________________', 300, 450)
     .text('Date: ___________________', 60, 470)
     .text('Time: ___________________', 300, 470);
}

export default router;