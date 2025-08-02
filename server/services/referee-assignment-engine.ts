/**
 * Referee Assignment Engine
 * Intelligent assignment system for referees with constraint optimization
 */

interface Referee {
  id: number;
  name: string;
  email: string;
  certificationLevel: 'Youth' | 'Adult' | 'Advanced' | 'National';
  availability: string; // JSON schedule
  preferredComplexes: string; // JSON array
  payRate: number;
  isActive: boolean;
  totalGamesAssigned: number;
}

interface Game {
  id: number;
  startTime: string;
  endTime: string;
  date: string;
  fieldId: number;
  complexId: number;
  ageGroup: string;
  requiredCertification: 'Youth' | 'Adult' | 'Advanced' | 'National';
  estimatedPayment: number;
}

interface Assignment {
  gameId: number;
  refereeId: number;
  position: 'center' | 'assistant1' | 'assistant2' | '4th_official';
  paymentAmount: number;
  confidence: number; // 0-1 score
}

interface AssignmentConstraints {
  minimizeTravel: boolean;
  respectCertifications: boolean;
  balanceWorkload: boolean;
  avoidConflicts: boolean;
  preferredReferees: number[];
  maxGamesPerRefereePerDay: number;
  minRestBetweenGames: number; // minutes
}

export class RefereeAssignmentEngine {
  
  /**
   * Main assignment optimization function
   */
  static assignReferees(
    games: Game[], 
    availableReferees: Referee[], 
    constraints: AssignmentConstraints = this.getDefaultConstraints()
  ): Assignment[] {
    const assignments: Assignment[] = [];
    const refereeSchedule = new Map<number, Game[]>(); // Track referee assignments
    
    // Initialize referee schedules
    availableReferees.forEach(ref => refereeSchedule.set(ref.id, []));
    
    // Sort games by priority (importance, time, etc.)
    const prioritizedGames = this.prioritizeGames(games);
    
    for (const game of prioritizedGames) {
      const gameAssignments = this.assignRefereesToGame(
        game, 
        availableReferees, 
        refereeSchedule, 
        constraints
      );
      
      assignments.push(...gameAssignments);
      
      // Update referee schedules
      gameAssignments.forEach(assignment => {
        const refereeGames = refereeSchedule.get(assignment.refereeId) || [];
        refereeGames.push(game);
        refereeSchedule.set(assignment.refereeId, refereeGames);
      });
    }
    
    return assignments;
  }
  
  /**
   * Assign referees to a specific game
   */
  private static assignRefereesToGame(
    game: Game,
    availableReferees: Referee[],
    refereeSchedule: Map<number, Game[]>,
    constraints: AssignmentConstraints
  ): Assignment[] {
    const assignments: Assignment[] = [];
    const positions = this.determineRequiredPositions(game);
    
    for (const position of positions) {
      const bestReferee = this.findBestRefereeForPosition(
        game, 
        position, 
        availableReferees, 
        refereeSchedule, 
        constraints,
        assignments.map(a => a.refereeId) // Already assigned referees for this game
      );
      
      if (bestReferee) {
        assignments.push({
          gameId: game.id,
          refereeId: bestReferee.referee.id,
          position,
          paymentAmount: this.calculatePayment(game, position, bestReferee.referee),
          confidence: bestReferee.score
        });
      }
    }
    
    return assignments;
  }
  
  /**
   * Find the best referee for a specific position
   */
  private static findBestRefereeForPosition(
    game: Game,
    position: 'center' | 'assistant1' | 'assistant2' | '4th_official',
    availableReferees: Referee[],
    refereeSchedule: Map<number, Game[]>,
    constraints: AssignmentConstraints,
    alreadyAssigned: number[]
  ): { referee: Referee; score: number } | null {
    
    let bestReferee: Referee | null = null;
    let bestScore = -1;
    
    for (const referee of availableReferees) {
      // Skip if already assigned to this game
      if (alreadyAssigned.includes(referee.id)) continue;
      
      // Skip if inactive
      if (!referee.isActive) continue;
      
      const score = this.calculateRefereeScore(
        game, 
        position, 
        referee, 
        refereeSchedule, 
        constraints
      );
      
      if (score > bestScore && score > 0.3) { // Minimum acceptable score
        bestScore = score;
        bestReferee = referee;
      }
    }
    
    return bestReferee ? { referee: bestReferee, score: bestScore } : null;
  }
  
  /**
   * Calculate referee suitability score for a game/position
   */
  private static calculateRefereeScore(
    game: Game,
    position: 'center' | 'assistant1' | 'assistant2' | '4th_official',
    referee: Referee,
    refereeSchedule: Map<number, Game[]>,
    constraints: AssignmentConstraints
  ): number {
    let score = 1.0;
    
    // Certification level check (critical)
    if (!this.hasSufficientCertification(referee, game)) {
      return 0; // Disqualify
    }
    
    // Availability check (critical)
    if (!this.isRefereeAvailable(referee, game)) {
      return 0; // Disqualify
    }
    
    // Conflict check (critical)
    if (constraints.avoidConflicts && this.hasScheduleConflict(referee, game, refereeSchedule)) {
      return 0; // Disqualify
    }
    
    // Workload balancing (important)
    if (constraints.balanceWorkload) {
      const dayGames = this.getRefereeDayGames(referee, game, refereeSchedule);
      if (dayGames >= constraints.maxGamesPerRefereePerDay) {
        return 0; // Disqualify
      }
      
      // Prefer referees with fewer total assignments
      const workloadFactor = 1 - (referee.totalGamesAssigned / 100); // Normalize to 0-1
      score *= Math.max(0.3, workloadFactor);
    }
    
    // Travel minimization (moderate)
    if (constraints.minimizeTravel) {
      const travelScore = this.calculateTravelScore(referee, game);
      score *= travelScore;
    }
    
    // Rest period validation (moderate)
    const restScore = this.calculateRestScore(referee, game, refereeSchedule, constraints);
    score *= restScore;
    
    // Position suitability (minor)
    const positionScore = this.calculatePositionScore(referee, position);
    score *= positionScore;
    
    // Preferred referee bonus (minor)
    if (constraints.preferredReferees.includes(referee.id)) {
      score *= 1.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Check if referee has sufficient certification for game
   */
  private static hasSufficientCertification(referee: Referee, game: Game): boolean {
    const certLevels = {
      'Youth': 1,
      'Adult': 2,
      'Advanced': 3,
      'National': 4
    };
    
    const refLevel = certLevels[referee.certificationLevel] || 0;
    const requiredLevel = certLevels[game.requiredCertification] || 1;
    
    return refLevel >= requiredLevel;
  }
  
  /**
   * Check if referee is available for the game time
   */
  private static isRefereeAvailable(referee: Referee, game: Game): boolean {
    if (!referee.availability) return true; // No restrictions
    
    try {
      const availability = JSON.parse(referee.availability);
      const gameDate = new Date(game.date);
      const dayOfWeek = gameDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const gameTime = game.startTime;
      
      // Check if referee is available on this day
      const dayAvailability = availability[dayOfWeek];
      if (!dayAvailability || !dayAvailability.available) {
        return false;
      }
      
      // Check time windows if specified
      if (dayAvailability.timeWindows) {
        return dayAvailability.timeWindows.some((window: any) => 
          gameTime >= window.start && gameTime <= window.end
        );
      }
      
      return true;
    } catch (error) {
      console.warn('Invalid availability JSON for referee:', referee.id);
      return true; // Default to available if parsing fails
    }
  }
  
  /**
   * Check for schedule conflicts
   */
  private static hasScheduleConflict(
    referee: Referee, 
    game: Game, 
    refereeSchedule: Map<number, Game[]>
  ): boolean {
    const assignedGames = refereeSchedule.get(referee.id) || [];
    
    return assignedGames.some(assignedGame => {
      // Check if games overlap in time
      const gameStart = new Date(`${game.date} ${game.startTime}`);
      const gameEnd = new Date(`${game.date} ${game.endTime}`);
      const assignedStart = new Date(`${assignedGame.date} ${assignedGame.startTime}`);
      const assignedEnd = new Date(`${assignedGame.date} ${assignedGame.endTime}`);
      
      return (gameStart < assignedEnd && gameEnd > assignedStart);
    });
  }
  
  /**
   * Calculate travel score based on complex preferences and distance
   */
  private static calculateTravelScore(referee: Referee, game: Game): number {
    try {
      if (referee.preferredComplexes) {
        const preferredIds = JSON.parse(referee.preferredComplexes);
        if (preferredIds.includes(game.complexId)) {
          return 1.0; // Perfect score for preferred complex
        }
      }
    } catch (error) {
      console.warn('Invalid preferred complexes JSON for referee:', referee.id);
    }
    
    // Default moderate score if no preference specified
    return 0.7;
  }
  
  /**
   * Calculate rest period score
   */
  private static calculateRestScore(
    referee: Referee, 
    game: Game, 
    refereeSchedule: Map<number, Game[]>,
    constraints: AssignmentConstraints
  ): number {
    const assignedGames = refereeSchedule.get(referee.id) || [];
    const gameTime = new Date(`${game.date} ${game.startTime}`);
    
    for (const assignedGame of assignedGames) {
      const assignedEndTime = new Date(`${assignedGame.date} ${assignedGame.endTime}`);
      const timeDiffMinutes = (gameTime.getTime() - assignedEndTime.getTime()) / (1000 * 60);
      
      if (Math.abs(timeDiffMinutes) < constraints.minRestBetweenGames) {
        return 0.5; // Reduced score for insufficient rest
      }
    }
    
    return 1.0; // Full score for adequate rest
  }
  
  /**
   * Calculate position suitability score
   */
  private static calculatePositionScore(
    referee: Referee, 
    position: 'center' | 'assistant1' | 'assistant2' | '4th_official'
  ): number {
    // Center referee requires higher certification
    if (position === 'center') {
      return referee.certificationLevel === 'Advanced' || referee.certificationLevel === 'National' ? 1.0 : 0.8;
    }
    
    // Assistant referees can be slightly lower certification
    return 1.0;
  }
  
  /**
   * Get number of games referee has on same day
   */
  private static getRefereeDayGames(
    referee: Referee, 
    game: Game, 
    refereeSchedule: Map<number, Game[]>
  ): number {
    const assignedGames = refereeSchedule.get(referee.id) || [];
    return assignedGames.filter(g => g.date === game.date).length;
  }
  
  /**
   * Determine required referee positions for a game
   */
  private static determineRequiredPositions(game: Game): ('center' | 'assistant1' | 'assistant2' | '4th_official')[] {
    // Standard configuration: 1 center + 2 assistants
    // Can be customized based on age group, tournament level, etc.
    
    if (game.ageGroup.includes('U8') || game.ageGroup.includes('U6')) {
      return ['center']; // Young ages need only center referee
    }
    
    if (game.ageGroup.includes('U10') || game.ageGroup.includes('U12')) {
      return ['center', 'assistant1']; // Intermediate ages
    }
    
    // Standard full referee crew for older ages
    return ['center', 'assistant1', 'assistant2'];
  }
  
  /**
   * Calculate payment for referee position
   */
  private static calculatePayment(
    game: Game, 
    position: 'center' | 'assistant1' | 'assistant2' | '4th_official', 
    referee: Referee
  ): number {
    // Base payment from referee's rate or game estimate
    let basePayment = referee.payRate || game.estimatedPayment || 5000; // Default $50
    
    // Position multipliers
    const multipliers = {
      center: 1.0,
      assistant1: 0.8,
      assistant2: 0.8,
      '4th_official': 0.6
    };
    
    return Math.round(basePayment * multipliers[position]);
  }
  
  /**
   * Prioritize games for assignment order
   */
  private static prioritizeGames(games: Game[]): Game[] {
    return [...games].sort((a, b) => {
      // Prioritize by start time (earlier games first)
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      
      return a.startTime.localeCompare(b.startTime);
    });
  }
  
  /**
   * Get default assignment constraints
   */
  private static getDefaultConstraints(): AssignmentConstraints {
    return {
      minimizeTravel: true,
      respectCertifications: true,
      balanceWorkload: true,
      avoidConflicts: true,
      preferredReferees: [],
      maxGamesPerRefereePerDay: 4,
      minRestBetweenGames: 60 // 1 hour
    };
  }
  
  /**
   * Validate assignment results
   */
  static validateAssignments(
    assignments: Assignment[], 
    games: Game[], 
    referees: Referee[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for unassigned games
    const assignedGameIds = new Set(assignments.map(a => a.gameId));
    const unassignedGames = games.filter(g => !assignedGameIds.has(g.id));
    
    if (unassignedGames.length > 0) {
      issues.push(`${unassignedGames.length} games have no referee assignments`);
    }
    
    // Check for duplicate assignments
    const positionAssignments = new Map<string, number>();
    assignments.forEach(assignment => {
      const key = `${assignment.gameId}-${assignment.position}`;
      positionAssignments.set(key, (positionAssignments.get(key) || 0) + 1);
    });
    
    positionAssignments.forEach((count, key) => {
      if (count > 1) {
        issues.push(`Multiple referees assigned to same position: ${key}`);
      }
    });
    
    // Check referee workload
    const refereeWorkload = new Map<number, number>();
    assignments.forEach(assignment => {
      const count = refereeWorkload.get(assignment.refereeId) || 0;
      refereeWorkload.set(assignment.refereeId, count + 1);
    });
    
    refereeWorkload.forEach((count, refereeId) => {
      if (count > 8) { // Arbitrary high limit
        const referee = referees.find(r => r.id === refereeId);
        issues.push(`Referee ${referee?.name || refereeId} assigned to ${count} games (potentially overloaded)`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Generate assignment summary report
   */
  static generateAssignmentReport(
    assignments: Assignment[], 
    games: Game[], 
    referees: Referee[]
  ): any {
    const refereeMap = new Map(referees.map(r => [r.id, r]));
    const gameMap = new Map(games.map(g => [g.id, g]));
    
    // Calculate statistics
    const totalAssignments = assignments.length;
    const uniqueReferees = new Set(assignments.map(a => a.refereeId)).size;
    const assignedGames = new Set(assignments.map(a => a.gameId)).size;
    const totalPayments = assignments.reduce((sum, a) => sum + a.paymentAmount, 0);
    
    // Referee workload distribution
    const workloadDistribution = new Map<number, number>();
    assignments.forEach(assignment => {
      const count = workloadDistribution.get(assignment.refereeId) || 0;
      workloadDistribution.set(assignment.refereeId, count + 1);
    });
    
    // Position distribution
    const positionDistribution = assignments.reduce((dist, assignment) => {
      dist[assignment.position] = (dist[assignment.position] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    return {
      summary: {
        totalAssignments,
        uniqueReferees,
        assignedGames,
        unassignedGames: games.length - assignedGames,
        totalPayments: totalPayments / 100, // Convert to dollars
        averagePaymentPerAssignment: totalPayments / totalAssignments / 100
      },
      workloadDistribution: Array.from(workloadDistribution.entries()).map(([refereeId, count]) => ({
        referee: refereeMap.get(refereeId)?.name || `Referee ${refereeId}`,
        assignments: count,
        estimatedPay: assignments
          .filter(a => a.refereeId === refereeId)
          .reduce((sum, a) => sum + a.paymentAmount, 0) / 100
      })),
      positionDistribution,
      averageConfidence: assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length
    };
  }
}

export default RefereeAssignmentEngine;