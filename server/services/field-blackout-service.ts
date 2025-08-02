/**
 * Field Blackout Service
 * 
 * Manages maintenance periods, ceremonies, and other field unavailability
 */

import { db } from "../../db";
import { eq, and, or, gte, lte, between } from "drizzle-orm";
import { gameTimeSlots, fields } from "../../db/schema";

export interface FieldBlackout {
  id?: number;
  fieldId: number;
  eventId: string;
  startTime: string;
  endTime: string;
  blackoutDate: string; // YYYY-MM-DD format
  dayIndex: number;
  reason: string;
  blackoutType: 'maintenance' | 'ceremony' | 'weather' | 'emergency' | 'custom';
  priority: 'high' | 'medium' | 'low';
  isRecurring: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface BlackoutConflict {
  blackoutId: number;
  conflictType: 'game_overlap' | 'setup_conflict' | 'buffer_violation';
  affectedItems: Array<{
    type: 'game' | 'time_slot';
    id: number;
    startTime: string;
    endTime: string;
  }>;
  severity: 'critical' | 'warning';
  suggestedAction: string;
}

export class FieldBlackoutService {

  /**
   * Create a new field blackout period
   */
  static async createBlackout(blackout: FieldBlackout): Promise<number> {
    console.log(`🚫 Creating blackout for field ${blackout.fieldId}: ${blackout.reason}`);
    console.log(`   Time: ${blackout.startTime}-${blackout.endTime} on day ${blackout.dayIndex}`);
    
    // Validate blackout doesn't conflict with existing games
    const conflicts = await this.checkBlackoutConflicts(blackout);
    
    if (conflicts.length > 0) {
      const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
      if (criticalConflicts.length > 0) {
        throw new Error(`Cannot create blackout: ${criticalConflicts.length} critical conflicts detected`);
      }
    }
    
    // Insert blackout as unavailable time slot
    const result = await db
      .insert(gameTimeSlots)
      .values({
        eventId: blackout.eventId,
        fieldId: blackout.fieldId,
        startTime: blackout.startTime,
        endTime: blackout.endTime,
        dayIndex: blackout.dayIndex,
        isAvailable: false,
        slotType: 'blackout',
        blackoutReason: blackout.reason,
        blackoutType: blackout.blackoutType,
        priority: blackout.priority,
        createdAt: new Date().toISOString()
      })
      .returning({ id: gameTimeSlots.id });
    
    const blackoutId = result[0].id;
    
    console.log(`🚫 Created blackout ${blackoutId} for field ${blackout.fieldId}`);
    return blackoutId;
  }

  /**
   * Remove a blackout period
   */
  static async removeBlackout(blackoutId: number): Promise<boolean> {
    console.log(`🔓 Removing blackout ${blackoutId}`);
    
    const result = await db
      .delete(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.id, blackoutId),
          eq(gameTimeSlots.slotType, 'blackout')
        )
      );
    
    console.log(`🔓 Blackout ${blackoutId} removed successfully`);
    return true;
  }

  /**
   * Get all blackouts for an event
   */
  static async getEventBlackouts(eventId: string): Promise<FieldBlackout[]> {
    console.log(`📋 Getting all blackouts for event ${eventId}`);
    
    const blackouts = await db
      .select({
        id: gameTimeSlots.id,
        fieldId: gameTimeSlots.fieldId,
        eventId: gameTimeSlots.eventId,
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime,
        dayIndex: gameTimeSlots.dayIndex,
        reason: gameTimeSlots.blackoutReason,
        blackoutType: gameTimeSlots.blackoutType,
        priority: gameTimeSlots.priority,
        createdAt: gameTimeSlots.createdAt,
        fieldName: fields.name
      })
      .from(gameTimeSlots)
      .innerJoin(fields, eq(gameTimeSlots.fieldId, fields.id))
      .where(
        and(
          eq(gameTimeSlots.eventId, eventId),
          eq(gameTimeSlots.slotType, 'blackout')
        )
      )
      .orderBy(gameTimeSlots.dayIndex, gameTimeSlots.startTime);
    
    const formattedBlackouts = blackouts.map(b => ({
      id: b.id,
      fieldId: b.fieldId,
      eventId: b.eventId,
      startTime: b.startTime,
      endTime: b.endTime,
      blackoutDate: '', // Would be calculated from dayIndex + event start date
      dayIndex: b.dayIndex,
      reason: b.reason || 'No reason specified',
      blackoutType: (b.blackoutType as any) || 'custom',
      priority: (b.priority as any) || 'medium',
      isRecurring: false,
      createdAt: b.createdAt || new Date().toISOString()
    }));
    
    console.log(`📋 Found ${formattedBlackouts.length} blackouts for event ${eventId}`);
    return formattedBlackouts;
  }

  /**
   * Get blackouts for a specific field and day
   */
  static async getFieldBlackouts(
    eventId: string,
    fieldId: number,
    dayIndex: number
  ): Promise<FieldBlackout[]> {
    console.log(`🔍 Getting blackouts for field ${fieldId} on day ${dayIndex}`);
    
    const blackouts = await db
      .select()
      .from(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.eventId, eventId),
          eq(gameTimeSlots.fieldId, fieldId),
          eq(gameTimeSlots.dayIndex, dayIndex),
          eq(gameTimeSlots.slotType, 'blackout')
        )
      )
      .orderBy(gameTimeSlots.startTime);
    
    return blackouts.map(b => ({
      id: b.id,
      fieldId: b.fieldId,
      eventId: b.eventId,
      startTime: b.startTime,
      endTime: b.endTime,
      blackoutDate: '',
      dayIndex: b.dayIndex,
      reason: b.blackoutReason || 'No reason specified',
      blackoutType: (b.blackoutType as any) || 'custom',
      priority: (b.priority as any) || 'medium',
      isRecurring: false,
      createdAt: b.createdAt || new Date().toISOString()
    }));
  }

  /**
   * Check if proposed time conflicts with blackouts
   */
  static async checkBlackoutConflicts(
    blackout: FieldBlackout
  ): Promise<BlackoutConflict[]> {
    console.log(`🔍 Checking blackout conflicts for field ${blackout.fieldId}`);
    
    const conflicts: BlackoutConflict[] = [];
    
    // Check against existing games/time slots
    const existingSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.eventId, blackout.eventId),
          eq(gameTimeSlots.fieldId, blackout.fieldId),
          eq(gameTimeSlots.dayIndex, blackout.dayIndex),
          eq(gameTimeSlots.isAvailable, false)
        )
      );
    
    const blackoutStart = this.timeToMinutes(blackout.startTime);
    const blackoutEnd = this.timeToMinutes(blackout.endTime);
    
    for (const slot of existingSlots) {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);
      
      // Check for time overlap
      if (this.hasTimeOverlap(blackoutStart, blackoutEnd, slotStart, slotEnd)) {
        conflicts.push({
          blackoutId: blackout.id || 0,
          conflictType: 'game_overlap',
          affectedItems: [{
            type: 'time_slot',
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime
          }],
          severity: 'critical',
          suggestedAction: `Reschedule conflicting time slot ${slot.startTime}-${slot.endTime}`
        });
      }
    }
    
    console.log(`🔍 Found ${conflicts.length} blackout conflicts`);
    return conflicts;
  }

  /**
   * Check if a time slot conflicts with existing blackouts
   */
  static async hasBlackoutConflict(
    eventId: string,
    fieldId: number,
    dayIndex: number,
    startTime: string,
    endTime: string
  ): Promise<{ hasConflict: boolean; conflictingBlackouts: FieldBlackout[] }> {
    const blackouts = await this.getFieldBlackouts(eventId, fieldId, dayIndex);
    
    const proposedStart = this.timeToMinutes(startTime);
    const proposedEnd = this.timeToMinutes(endTime);
    
    const conflictingBlackouts = blackouts.filter(blackout => {
      const blackoutStart = this.timeToMinutes(blackout.startTime);
      const blackoutEnd = this.timeToMinutes(blackout.endTime);
      
      return this.hasTimeOverlap(proposedStart, proposedEnd, blackoutStart, blackoutEnd);
    });
    
    return {
      hasConflict: conflictingBlackouts.length > 0,
      conflictingBlackouts
    };
  }

  /**
   * Create recurring blackouts (weekly maintenance, etc.)
   */
  static async createRecurringBlackout(
    baseBlackout: FieldBlackout,
    recurrencePattern: {
      frequency: 'daily' | 'weekly' | 'biweekly';
      endDate: string;
      skipDays?: number[]; // Skip specific day indices
    }
  ): Promise<number[]> {
    console.log(`🔄 Creating recurring blackout: ${recurrencePattern.frequency}`);
    
    const createdBlackouts: number[] = [];
    const maxDays = 30; // Reasonable limit for tournament duration
    
    let currentDay = baseBlackout.dayIndex;
    
    while (currentDay < maxDays) {
      if (!recurrencePattern.skipDays?.includes(currentDay)) {
        try {
          const blackoutId = await this.createBlackout({
            ...baseBlackout,
            dayIndex: currentDay,
            isRecurring: true
          });
          createdBlackouts.push(blackoutId);
        } catch (error) {
          console.log(`⚠️ Skipped recurring blackout on day ${currentDay}: conflicts detected`);
        }
      }
      
      // Calculate next occurrence
      switch (recurrencePattern.frequency) {
        case 'daily':
          currentDay += 1;
          break;
        case 'weekly':
          currentDay += 7;
          break;
        case 'biweekly':
          currentDay += 14;
          break;
      }
    }
    
    console.log(`🔄 Created ${createdBlackouts.length} recurring blackouts`);
    return createdBlackouts;
  }

  /**
   * Get blackout statistics for reporting
   */
  static async getBlackoutStats(eventId: string): Promise<{
    totalBlackouts: number;
    blackoutsByType: Record<string, number>;
    blackoutsByField: Record<number, number>;
    totalBlockedHours: number;
  }> {
    const blackouts = await this.getEventBlackouts(eventId);
    
    const stats = {
      totalBlackouts: blackouts.length,
      blackoutsByType: {} as Record<string, number>,
      blackoutsByField: {} as Record<number, number>,
      totalBlockedHours: 0
    };
    
    blackouts.forEach(blackout => {
      // Count by type
      stats.blackoutsByType[blackout.blackoutType] = 
        (stats.blackoutsByType[blackout.blackoutType] || 0) + 1;
      
      // Count by field
      stats.blackoutsByField[blackout.fieldId] = 
        (stats.blackoutsByField[blackout.fieldId] || 0) + 1;
      
      // Calculate blocked hours
      const startMinutes = this.timeToMinutes(blackout.startTime);
      const endMinutes = this.timeToMinutes(blackout.endTime);
      const durationHours = (endMinutes - startMinutes) / 60;
      stats.totalBlockedHours += durationHours;
    });
    
    return stats;
  }

  /**
   * Utility: Check if two time ranges overlap
   */
  private static hasTimeOverlap(
    start1: number, end1: number,
    start2: number, end2: number
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Utility: Convert time string to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}