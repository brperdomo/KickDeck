/**
 * Enhanced Field Management API Routes
 * 
 * Flexible time slots, buffer configuration, and blackout management
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { isAdmin } from '../../middleware';
import { FlexibleTimeSlotService } from '../../services/flexible-time-slot-service';
import { FieldBlackoutService } from '../../services/field-blackout-service';

const router = Router();

/**
 * Generate flexible time slots with configurable granularity
 */
router.post('/events/:eventId/fields/:fieldId/flexible-slots', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId, fieldId } = req.params;
    const { dayIndex, config } = req.body;
    
    console.log(`⏰ API: Generating flexible slots for field ${fieldId} with ${config?.incrementMinutes || 15}min increments`);
    
    const timeSlotConfig = {
      incrementMinutes: config?.incrementMinutes || 15,
      gameDuration: config?.gameDuration || 90,
      bufferBefore: config?.bufferBefore || 10,
      bufferAfter: config?.bufferAfter || 10,
      allowFlexibleStart: config?.allowFlexibleStart || true
    };
    
    const slots = await FlexibleTimeSlotService.generateFlexibleTimeSlots(
      eventId,
      parseInt(fieldId),
      dayIndex,
      timeSlotConfig
    );
    
    console.log(`⏰ Generated ${slots.length} flexible time slots`);
    
    res.json({
      success: true,
      slots,
      config: timeSlotConfig,
      summary: {
        totalSlots: slots.length,
        availableSlots: slots.filter(s => s.isAvailable).length,
        increment: timeSlotConfig.incrementMinutes,
        gameDuration: timeSlotConfig.gameDuration
      }
    });
    
  } catch (error: any) {
    console.error('❌ Flexible slot generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate flexible time slots',
      details: error.message
    });
  }
});

/**
 * Find optimal time slots with intelligent buffer management
 */
router.post('/events/:eventId/optimal-slots', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fieldSize, dayIndex, gameType = 'regular', config } = req.body;
    
    console.log(`🎯 API: Finding optimal slots for ${fieldSize} ${gameType} games`);
    
    const timeSlotConfig = {
      incrementMinutes: config?.incrementMinutes || 15,
      gameDuration: config?.gameDuration || 90,
      bufferBefore: config?.bufferBefore || 10,
      bufferAfter: config?.bufferAfter || 10,
      allowFlexibleStart: config?.allowFlexibleStart || true
    };
    
    const optimalSlots = await FlexibleTimeSlotService.findOptimalTimeSlots(
      eventId,
      fieldSize,
      dayIndex,
      gameType,
      timeSlotConfig
    );
    
    console.log(`🎯 Found ${optimalSlots.length} optimal time slots`);
    
    res.json({
      success: true,
      slots: optimalSlots,
      criteria: {
        fieldSize,
        gameType,
        dayIndex,
        config: timeSlotConfig
      }
    });
    
  } catch (error: any) {
    console.error('❌ Optimal slot finding failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find optimal time slots',
      details: error.message
    });
  }
});

/**
 * Create a field blackout period
 */
router.post('/events/:eventId/blackouts', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const blackoutData = req.body;
    
    console.log(`🚫 API: Creating blackout for field ${blackoutData.fieldId}: ${blackoutData.reason}`);
    
    const blackout = {
      ...blackoutData,
      eventId,
      blackoutType: blackoutData.blackoutType || 'custom',
      priority: blackoutData.priority || 'medium'
    };
    
    const blackoutId = await FieldBlackoutService.createBlackout(blackout);
    
    console.log(`🚫 Created blackout ${blackoutId}`);
    
    res.json({
      success: true,
      blackoutId,
      message: 'Field blackout created successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Blackout creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create field blackout',
      details: error.message
    });
  }
});

/**
 * Get all blackouts for an event
 */
router.get('/events/:eventId/blackouts', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`📋 API: Getting blackouts for event ${eventId}`);
    
    const blackouts = await FieldBlackoutService.getEventBlackouts(eventId);
    const stats = await FieldBlackoutService.getBlackoutStats(eventId);
    
    console.log(`📋 Found ${blackouts.length} blackouts`);
    
    res.json({
      success: true,
      blackouts,
      stats,
      summary: {
        totalBlackouts: blackouts.length,
        byType: stats.blackoutsByType,
        totalBlockedHours: stats.totalBlockedHours
      }
    });
    
  } catch (error: any) {
    console.error('❌ Blackout retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blackouts',
      details: error.message
    });
  }
});

/**
 * Remove a blackout period
 */
router.delete('/events/:eventId/blackouts/:blackoutId', requireAuth, isAdmin, async (req, res) => {
  try {
    const { blackoutId } = req.params;
    
    console.log(`🔓 API: Removing blackout ${blackoutId}`);
    
    await FieldBlackoutService.removeBlackout(parseInt(blackoutId));
    
    console.log(`🔓 Blackout ${blackoutId} removed`);
    
    res.json({
      success: true,
      message: 'Blackout removed successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Blackout removal failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove blackout',
      details: error.message
    });
  }
});

/**
 * Check for blackout conflicts
 */
router.post('/events/:eventId/blackouts/check-conflicts', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { fieldId, dayIndex, startTime, endTime } = req.body;
    
    console.log(`🔍 API: Checking blackout conflicts for field ${fieldId}`);
    
    const conflictCheck = await FieldBlackoutService.hasBlackoutConflict(
      eventId,
      fieldId,
      dayIndex,
      startTime,
      endTime
    );
    
    console.log(`🔍 Conflict check: ${conflictCheck.hasConflict ? 'CONFLICTS' : 'CLEAR'}`);
    
    res.json({
      success: true,
      hasConflict: conflictCheck.hasConflict,
      conflictingBlackouts: conflictCheck.conflictingBlackouts,
      summary: {
        conflictCount: conflictCheck.conflictingBlackouts.length,
        canSchedule: !conflictCheck.hasConflict
      }
    });
    
  } catch (error: any) {
    console.error('❌ Blackout conflict check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check blackout conflicts',
      details: error.message
    });
  }
});

/**
 * Create recurring blackouts
 */
router.post('/events/:eventId/blackouts/recurring', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { blackout, recurrencePattern } = req.body;
    
    console.log(`🔄 API: Creating recurring blackout: ${recurrencePattern.frequency}`);
    
    const baseBlackout = {
      ...blackout,
      eventId,
      isRecurring: true
    };
    
    const createdBlackouts = await FieldBlackoutService.createRecurringBlackout(
      baseBlackout,
      recurrencePattern
    );
    
    console.log(`🔄 Created ${createdBlackouts.length} recurring blackouts`);
    
    res.json({
      success: true,
      createdBlackouts,
      summary: {
        totalCreated: createdBlackouts.length,
        frequency: recurrencePattern.frequency,
        pattern: recurrencePattern
      }
    });
    
  } catch (error: any) {
    console.error('❌ Recurring blackout creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create recurring blackouts',
      details: error.message
    });
  }
});

export default router;