import { Router } from 'express';
import { getTeams, getTeamById, updateTeamStatus, processRefund } from './teams';
import { db } from '@db';
import { eventFees, teams } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';

const router = Router();

// Get all teams with filtering
router.get('/', getTeams);

// Get team by ID
router.get('/:teamId', getTeamById);

// Get fee details for a team
router.get('/:teamId/fees', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { selectedFeeIds } = req.query;
    
    if (!selectedFeeIds) {
      return res.status(400).json({ message: "No fee IDs provided" });
    }
    
    // Get the team to access its selectedFeeIds
    const team = await db.select({
      selectedFeeIds: teams.selectedFeeIds
    })
    .from(teams)
    .where(eq(teams.id, parseInt(teamId)))
    .limit(1);
    
    // If no feeIds were provided in the query and we got them from the team, use those
    let feeIdString = selectedFeeIds as string;
    if ((!feeIdString || feeIdString === 'undefined') && team.length > 0 && team[0].selectedFeeIds) {
      feeIdString = team[0].selectedFeeIds;
    }
    
    // Split the comma-separated string and filter out any invalid values before parsing to int
    const feeIdsArray = feeIdString.split(',')
      .map(id => id.trim().replace(/[^0-9]/g, '')) // Remove any non-numeric characters
      .filter(id => id && !isNaN(parseInt(id)))    // Filter out empty or NaN values
      .map(id => parseInt(id));                    // Convert to integers
    
    // Check if we have any valid IDs after filtering
    if (feeIdsArray.length === 0) {
      return res.json([]);
    }
    
    const fees = await db.select({
      id: eventFees.id,
      name: eventFees.name,
      amount: eventFees.amount,
      feeType: eventFees.feeType,
      isRequired: eventFees.isRequired
    })
    .from(eventFees)
    .where(inArray(eventFees.id, feeIdsArray));
    
    res.json(fees);
  } catch (error) {
    console.error("Error fetching team fee details:", error);
    res.status(500).json({ 
      message: "Failed to fetch team fee details", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Update team status (approve/reject)
router.put('/:teamId/status', updateTeamStatus);
// Keep backward compatibility with PATCH as well
router.patch('/:teamId/status', updateTeamStatus);

// Process refund for rejected team
router.post('/:teamId/refund', processRefund);

export default router;