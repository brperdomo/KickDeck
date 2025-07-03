/**
 * Link Games to Time Slots Script
 * 
 * This script properly links the existing games (343-349) to the correct
 * time slots (5185-5191) so Step 7 displays the October schedule correctly.
 */

import { db } from './db/index.ts';
import { games } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function linkGamesToTimeSlots() {
  console.log('🔗 Linking games to their proper time slots...');
  
  // Game-to-time slot mappings based on field and match order
  const gameSlotMappings = [
    { gameId: 343, timeSlotId: 5185 }, // Game 1 -> Oct 1, 08:00, Field 9
    { gameId: 344, timeSlotId: 5186 }, // Game 2 -> Oct 1, 10:30, Field 8
    { gameId: 345, timeSlotId: 5187 }, // Game 3 -> Oct 1, 13:00, Field 9
    { gameId: 346, timeSlotId: 5188 }, // Game 4 -> Oct 1, 15:30, Field 8
    { gameId: 347, timeSlotId: 5189 }, // Game 5 -> Oct 1, 18:00, Field 9
    { gameId: 348, timeSlotId: 5190 }, // Game 6 -> Oct 2, 08:00, Field 8
    { gameId: 349, timeSlotId: 5191 }  // Game 7 -> Oct 2, 10:30, Field 9
  ];
  
  for (const mapping of gameSlotMappings) {
    console.log(`🎯 Linking Game ${mapping.gameId} to Time Slot ${mapping.timeSlotId}`);
    
    await db
      .update(games)
      .set({ timeSlotId: mapping.timeSlotId })
      .where(eq(games.id, mapping.gameId));
  }
  
  console.log('✅ All games successfully linked to time slots');
  
  // Verify the links
  console.log('\n📊 Verification:');
  const linkedGames = await db
    .select({ 
      id: games.id, 
      matchNumber: games.matchNumber, 
      timeSlotId: games.timeSlotId,
      fieldId: games.fieldId
    })
    .from(games)
    .where(eq(games.eventId, '1656618593'));
    
  linkedGames.forEach(game => {
    console.log(`Game ${game.id}: Match ${game.matchNumber}, Field ${game.fieldId}, TimeSlot ${game.timeSlotId}`);
  });
}

linkGamesToTimeSlots()
  .then(() => {
    console.log('\n🎉 Game-to-time slot linking completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error linking games to time slots:', error);
    process.exit(1);
  });