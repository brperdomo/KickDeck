/**
 * Flexible Time Slot Service
 * 
 * Enhanced time slot generation with configurable granularity and buffer rules
 */

import { db } from "../../db";
import { eq, and, or, gte, lte } from "drizzle-orm";
import { gameTimeSlots, fields, complexes } from "../../db/schema";

export interface TimeSlotConfig {
  incrementMinutes: number; // 5, 10, 15, 30 minute increments
  gameDuration: number; // Game duration in minutes
  bufferBefore: number; // Buffer before game in minutes
  bufferAfter: number; // Buffer after game in minutes
  allowFlexibleStart: boolean; // Allow non-hour start times
}

export interface FieldBufferRules {
  fieldId: number;
  fieldSize: string;
  defaultBuffer: number; // Default buffer in minutes
  setupTime: number; // Setup time before games
  cleanupTime: number; // Cleanup time after games
  maintenanceBuffer: number; // Extra buffer for maintenance
  customRules?: {
    gameType?: string; // Tournament, playoff, final
    extraBuffer?: number;
  }[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  actualGameStart: string;
  actualGameEnd: string;
  bufferBefore: number;
  bufferAfter: number;
  fieldId: number;
  isAvailable: boolean;
  slotType: 'regular' | 'premium' | 'maintenance';
}

export class FlexibleTimeSlotService {

  /**
   * Generate flexible time slots with configurable granularity
   */
  static async generateFlexibleTimeSlots(
    eventId: string,
    fieldId: number,
    dayIndex: number,
    config: TimeSlotConfig
  ): Promise<TimeSlot[]> {
    console.log(`⏰ Generating flexible time slots for field ${fieldId} with ${config.incrementMinutes}min increments`);
    
    // Get field and complex information
    const fieldInfo = await db
      .select({
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        complexId: fields.complexId,
        openTime: complexes.openTime,
        closeTime: complexes.closeTime
      })
      .from(fields)
      .innerJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.id, fieldId))
      .limit(1);

    if (fieldInfo.length === 0) {
      throw new Error(`Field ${fieldId} not found`);
    }

    const field = fieldInfo[0];
    const slots: TimeSlot[] = [];
    
    // Parse operating hours
    const openMinutes = this.timeToMinutes(field.openTime);
    const closeMinutes = this.timeToMinutes(field.closeTime);
    
    // Get field-specific buffer rules
    const bufferRules = await this.getFieldBufferRules(fieldId, field.fieldSize);
    
    // Generate slots with flexible increments
    let currentTime = openMinutes;
    
    while (currentTime + config.gameDuration + bufferRules.defaultBuffer <= closeMinutes) {
      const slotStartTime = this.minutesToTime(currentTime);
      const gameStartTime = this.minutesToTime(currentTime + bufferRules.setupTime);
      const gameEndTime = this.minutesToTime(currentTime + bufferRules.setupTime + config.gameDuration);
      const slotEndTime = this.minutesToTime(currentTime + bufferRules.setupTime + config.gameDuration + bufferRules.cleanupTime);
      
      // Check if slot conflicts with existing reservations
      const isAvailable = await this.checkSlotAvailability(
        eventId, fieldId, dayIndex, slotStartTime, slotEndTime
      );
      
      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        actualGameStart: gameStartTime,
        actualGameEnd: gameEndTime,
        bufferBefore: bufferRules.setupTime,
        bufferAfter: bufferRules.cleanupTime,
        fieldId,
        isAvailable,
        slotType: 'regular'
      });
      
      // Move to next slot based on increment
      currentTime += config.incrementMinutes;
    }
    
    console.log(`⏰ Generated ${slots.length} flexible time slots with ${config.incrementMinutes}min increments`);
    return slots;
  }

  /**
   * Get field-specific buffer rules with fallback defaults
   */
  static async getFieldBufferRules(fieldId: number, fieldSize: string): Promise<FieldBufferRules> {
    // Check if custom buffer rules exist in database (future enhancement)
    // For now, return intelligent defaults based on field size
    
    const defaultRules: Record<string, Partial<FieldBufferRules>> = {
      '4v4': { defaultBuffer: 10, setupTime: 5, cleanupTime: 5, maintenanceBuffer: 15 },
      '7v7': { defaultBuffer: 15, setupTime: 10, cleanupTime: 5, maintenanceBuffer: 20 },
      '9v9': { defaultBuffer: 15, setupTime: 10, cleanupTime: 5, maintenanceBuffer: 20 },
      '11v11': { defaultBuffer: 20, setupTime: 15, cleanupTime: 5, maintenanceBuffer: 25 }
    };
    
    const rules = defaultRules[fieldSize] || defaultRules['11v11'];
    
    return {
      fieldId,
      fieldSize,
      defaultBuffer: rules.defaultBuffer || 15,
      setupTime: rules.setupTime || 10,
      cleanupTime: rules.cleanupTime || 5,
      maintenanceBuffer: rules.maintenanceBuffer || 20,
      customRules: [
        { gameType: 'final', extraBuffer: 10 },
        { gameType: 'playoff', extraBuffer: 5 }
      ]
    };
  }

  /**
   * Calculate optimal buffer time based on game type and field
   */
  static calculateOptimalBuffer(
    bufferRules: FieldBufferRules,
    gameType: string = 'regular',
    previousGameType?: string
  ): { before: number; after: number } {
    let baseBuffer = bufferRules.defaultBuffer;
    
    // Apply custom rules for special game types
    const customRule = bufferRules.customRules?.find(rule => rule.gameType === gameType);
    if (customRule && customRule.extraBuffer) {
      baseBuffer += customRule.extraBuffer;
    }
    
    // Extra buffer after maintenance-heavy games
    if (previousGameType === 'final' || previousGameType === 'playoff') {
      baseBuffer += 5;
    }
    
    return {
      before: bufferRules.setupTime,
      after: baseBuffer - bufferRules.setupTime
    };
  }

  /**
   * Find optimal time slots with intelligent buffer management
   */
  static async findOptimalTimeSlots(
    eventId: string,
    fieldSize: string,
    dayIndex: number,
    gameType: string = 'regular',
    config: TimeSlotConfig
  ): Promise<TimeSlot[]> {
    console.log(`🎯 Finding optimal time slots for ${fieldSize} ${gameType} games`);
    
    // Get all available fields of the required size
    const availableFields = await db
      .select({
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        complexId: fields.complexId
      })
      .from(fields)
      .innerJoin(complexes, eq(fields.complexId, complexes.id))
      .where(and(
        eq(fields.fieldSize, fieldSize),
        eq(fields.isOpen, true),
        eq(complexes.isOpen, true)
      ));

    let allSlots: TimeSlot[] = [];
    
    // Generate slots for each available field
    for (const field of availableFields) {
      const fieldSlots = await this.generateFlexibleTimeSlots(
        eventId, field.fieldId, dayIndex, config
      );
      
      // Apply game-type specific buffer adjustments
      const bufferRules = await this.getFieldBufferRules(field.fieldId, field.fieldSize);
      const optimalBuffer = this.calculateOptimalBuffer(bufferRules, gameType);
      
      const adjustedSlots = fieldSlots.map(slot => ({
        ...slot,
        bufferBefore: optimalBuffer.before,
        bufferAfter: optimalBuffer.after,
        slotType: gameType === 'final' ? 'premium' as const : 'regular' as const
      }));
      
      allSlots.push(...adjustedSlots);
    }
    
    // Sort by availability and field preference
    allSlots.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.startTime.localeCompare(b.startTime);
    });
    
    console.log(`🎯 Found ${allSlots.filter(s => s.isAvailable).length} optimal time slots for ${gameType} games`);
    return allSlots.filter(slot => slot.isAvailable);
  }

  /**
   * Check slot availability against existing reservations
   */
  private static async checkSlotAvailability(
    eventId: string,
    fieldId: number,
    dayIndex: number,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const conflictingSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.eventId, eventId),
          eq(gameTimeSlots.fieldId, fieldId),
          eq(gameTimeSlots.dayIndex, dayIndex),
          eq(gameTimeSlots.isAvailable, false),
          or(
            // Overlap detection
            and(
              lte(gameTimeSlots.startTime, startTime),
              gte(gameTimeSlots.endTime, startTime)
            ),
            and(
              lte(gameTimeSlots.startTime, endTime),
              gte(gameTimeSlots.endTime, endTime)
            ),
            and(
              gte(gameTimeSlots.startTime, startTime),
              lte(gameTimeSlots.endTime, endTime)
            )
          )
        )
      );

    return conflictingSlots.length === 0;
  }

  /**
   * Utility: Convert time string to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Utility: Convert minutes since midnight to time string
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}