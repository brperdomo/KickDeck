/**
 * Facility Constraint Service
 * Integrates existing lighting, parking, and concession constraints into scheduling
 */

interface Field {
  id: number;
  name: string;
  hasLights: boolean;
  hasParking: boolean;
  hasConcessions: boolean;
  concessionCapacity: number;
  concessionHours: string; // JSON string
  parkingCapacity: number;
  openTime: string;
  closeTime: string;
  fieldSize: string;
  complexId: number;
}

interface Game {
  id: number;
  startTime: string;
  endTime: string;
  fieldId: number;
  estimatedAttendance?: number;
  requiresConcessions?: boolean;
}

interface FacilityValidationResult {
  isValid: boolean;
  severity: 'ok' | 'warning' | 'critical';
  message: string;
  suggestion?: string;
  facilityType: 'lighting' | 'parking' | 'concessions';
}

export class FacilityConstraintService {
  
  /**
   * Validate lighting requirements for a game
   */
  static validateLightingRequirements(game: Game, field: Field): FacilityValidationResult {
    const gameStart = new Date(`2025-01-01 ${game.startTime}`);
    const gameEnd = new Date(`2025-01-01 ${game.endTime}`);
    
    // Define lighting required times (before 7 AM, after 6 PM)
    const lightingRequiredBefore = new Date(`2025-01-01 07:00`);
    const lightingRequiredAfter = new Date(`2025-01-01 18:00`);
    
    const needsLighting = gameStart < lightingRequiredBefore || 
                         gameEnd > lightingRequiredAfter ||
                         gameStart > lightingRequiredAfter;
    
    if (!needsLighting) {
      return {
        isValid: true,
        severity: 'ok',
        message: `Natural lighting adequate for ${game.startTime}-${game.endTime}`,
        facilityType: 'lighting'
      };
    }
    
    if (field.hasLights) {
      return {
        isValid: true,
        severity: 'ok',
        message: `Field lighting available for ${game.startTime}-${game.endTime}`,
        facilityType: 'lighting'
      };
    }
    
    return {
      isValid: false,
      severity: 'critical',
      message: `Game at ${game.startTime}-${game.endTime} requires lighting but field has no lights`,
      suggestion: `Reschedule to daylight hours (7:00 AM - 6:00 PM) or assign to field with lighting`,
      facilityType: 'lighting'
    };
  }
  
  /**
   * Validate parking capacity for simultaneous games
   */
  static validateParkingCapacity(
    simultaneousGames: Game[], 
    fieldsMap: Map<number, Field>
  ): FacilityValidationResult[] {
    const complexParkingUsage = new Map<number, number>();
    const results: FacilityValidationResult[] = [];
    
    // Group games by complex and calculate parking demand
    simultaneousGames.forEach(game => {
      const field = fieldsMap.get(game.fieldId);
      if (!field) return;
      
      const complexId = field.complexId;
      const estimatedCars = this.estimateParkingDemand(game);
      
      const currentUsage = complexParkingUsage.get(complexId) || 0;
      complexParkingUsage.set(complexId, currentUsage + estimatedCars);
    });
    
    // Validate each complex's parking capacity
    complexParkingUsage.forEach((demand, complexId) => {
      const complexFields = Array.from(fieldsMap.values())
        .filter(f => f.complexId === complexId);
      
      const totalParkingCapacity = complexFields.reduce((sum, field) => 
        sum + (field.parkingCapacity || 50), 0);
      
      if (demand <= totalParkingCapacity) {
        results.push({
          isValid: true,
          severity: 'ok',
          message: `Parking adequate: ${demand}/${totalParkingCapacity} spaces at complex ${complexId}`,
          facilityType: 'parking'
        });
      } else if (demand <= totalParkingCapacity * 1.2) {
        results.push({
          isValid: false,
          severity: 'warning',
          message: `Parking tight: ${demand}/${totalParkingCapacity} spaces at complex ${complexId}`,
          suggestion: `Consider staggering game times or advising carpooling`,
          facilityType: 'parking'
        });
      } else {
        results.push({
          isValid: false,
          severity: 'critical',
          message: `Parking overflow: ${demand}/${totalParkingCapacity} spaces at complex ${complexId}`,
          suggestion: `Reschedule games to different times or consider off-site parking`,
          facilityType: 'parking'
        });
      }
    });
    
    return results;
  }
  
  /**
   * Validate concession capacity and hours
   */
  static validateConcessionRequirements(game: Game, field: Field): FacilityValidationResult {
    // If game doesn't require concessions, validation passes
    if (!game.requiresConcessions) {
      return {
        isValid: true,
        severity: 'ok',
        message: 'No concession requirements for this game',
        facilityType: 'concessions'
      };
    }
    
    // Check if field has concessions
    if (!field.hasConcessions) {
      return {
        isValid: false,
        severity: 'warning',
        message: 'Game requests concessions but field has no concession stand',
        suggestion: 'Consider assigning to field with concessions or arrange mobile concessions',
        facilityType: 'concessions'
      };
    }
    
    // Validate concession hours
    if (field.concessionHours) {
      try {
        const hours = JSON.parse(field.concessionHours);
        const gameStart = new Date(`2025-01-01 ${game.startTime}`);
        const concessionOpen = new Date(`2025-01-01 ${hours.open}`);
        const concessionClose = new Date(`2025-01-01 ${hours.close}`);
        
        if (gameStart < concessionOpen || gameStart > concessionClose) {
          return {
            isValid: false,
            severity: 'warning',
            message: `Concessions closed during game time (${hours.open}-${hours.close})`,
            suggestion: `Reschedule game within concession hours or arrange special opening`,
            facilityType: 'concessions'
          };
        }
      } catch (error) {
        console.warn('Invalid concession hours JSON:', field.concessionHours);
      }
    }
    
    // Validate capacity if provided
    const estimatedDemand = this.estimateConcessionDemand(game);
    if (field.concessionCapacity && estimatedDemand > field.concessionCapacity) {
      return {
        isValid: false,
        severity: 'warning',
        message: `High concession demand (${estimatedDemand}) may exceed capacity (${field.concessionCapacity})`,
        suggestion: 'Consider additional concession support or staggered game times',
        facilityType: 'concessions'
      };
    }
    
    return {
      isValid: true,
      severity: 'ok',
      message: 'Concession requirements satisfied',
      facilityType: 'concessions'
    };
  }
  
  /**
   * Comprehensive facility validation for a set of games
   */
  static validateAllFacilityConstraints(
    games: Game[], 
    fieldsMap: Map<number, Field>
  ): FacilityValidationResult[] {
    const results: FacilityValidationResult[] = [];
    
    // Group games by time slot for parking validation
    const gamesByTimeSlot = new Map<string, Game[]>();
    games.forEach(game => {
      const timeSlot = `${game.startTime}-${game.endTime}`;
      const existing = gamesByTimeSlot.get(timeSlot) || [];
      existing.push(game);
      gamesByTimeSlot.set(timeSlot, existing);
    });
    
    // Validate lighting and concessions for each game
    games.forEach(game => {
      const field = fieldsMap.get(game.fieldId);
      if (!field) return;
      
      results.push(this.validateLightingRequirements(game, field));
      results.push(this.validateConcessionRequirements(game, field));
    });
    
    // Validate parking for each time slot
    gamesByTimeSlot.forEach(simultaneousGames => {
      const parkingResults = this.validateParkingCapacity(simultaneousGames, fieldsMap);
      results.push(...parkingResults);
    });
    
    return results;
  }
  
  /**
   * Estimate parking demand for a game
   */
  private static estimateParkingDemand(game: Game): number {
    // Base calculation: 2 teams × 15 players × 2 parents + coaches + spectators
    const baseAttendance = game.estimatedAttendance || 80;
    
    // Assume 2.5 people per car (families carpooling)
    return Math.ceil(baseAttendance / 2.5);
  }
  
  /**
   * Estimate concession demand for a game
   */
  private static estimateConcessionDemand(game: Game): number {
    const baseAttendance = game.estimatedAttendance || 80;
    
    // Assume 60% of attendees will purchase concessions
    return Math.ceil(baseAttendance * 0.6);
  }
  
  /**
   * Get facility optimization recommendations
   */
  static getFacilityOptimizationRecommendations(
    validationResults: FacilityValidationResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    const lightingIssues = validationResults.filter(r => 
      r.facilityType === 'lighting' && !r.isValid);
    const parkingIssues = validationResults.filter(r => 
      r.facilityType === 'parking' && !r.isValid);
    const concessionIssues = validationResults.filter(r => 
      r.facilityType === 'concessions' && !r.isValid);
    
    if (lightingIssues.length > 0) {
      recommendations.push(`Consider installing lights on ${lightingIssues.length} fields for extended scheduling flexibility`);
    }
    
    if (parkingIssues.length > 0) {
      recommendations.push(`Parking constraints detected at ${parkingIssues.length} time slots - consider staggered scheduling`);
    }
    
    if (concessionIssues.length > 0) {
      recommendations.push(`Concession optimization needed for ${concessionIssues.length} games - consider mobile concessions`);
    }
    
    return recommendations;
  }
}

export default FacilityConstraintService;