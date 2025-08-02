/**
 * Swiss System Tournament Scheduler
 * Implements Swiss tournament format with intelligent pairing algorithms
 */

interface Team {
  id: number;
  name: string;
  rating?: number;
}

interface SwissStanding {
  teamId: number;
  teamName: string;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  opponentsPlayed: number[];
  opponentPoints: number; // Buchholz score
  strengthOfSchedule: number;
  colorPreference: 'home' | 'away' | 'neutral';
  colorCount: { home: number; away: number };
}

interface SwissPairing {
  round: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  pointDifference: number;
  previousMeetings: number;
}

interface SwissRoundResult {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  result: 'home_win' | 'away_win' | 'draw';
  round: number;
}

export class SwissSystemScheduler {
  
  /**
   * Generate pairings for a Swiss round
   */
  static generateRoundPairings(
    round: number,
    teams: Team[],
    previousResults: SwissRoundResult[]
  ): SwissPairing[] {
    const standings = this.calculateCurrentStandings(teams, previousResults);
    
    if (round === 1) {
      return this.generateFirstRoundPairings(teams);
    }
    
    return this.generateSubsequentRoundPairings(round, standings);
  }
  
  /**
   * Generate first round pairings (random or seeded)
   */
  private static generateFirstRoundPairings(teams: Team[]): SwissPairing[] {
    const pairings: SwissPairing[] = [];
    const shuffledTeams = [...teams];
    
    // If teams have ratings, seed the pairings
    if (teams.some(t => t.rating)) {
      shuffledTeams.sort((a, b) => (b.rating || 1200) - (a.rating || 1200));
    } else {
      // Random shuffle for first round
      for (let i = shuffledTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
      }
    }
    
    // Pair teams: 1-2, 3-4, 5-6, etc.
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        pairings.push({
          round: 1,
          homeTeamId: shuffledTeams[i].id,
          awayTeamId: shuffledTeams[i + 1].id,
          homeTeamName: shuffledTeams[i].name,
          awayTeamName: shuffledTeams[i + 1].name,
          pointDifference: 0,
          previousMeetings: 0
        });
      }
    }
    
    return pairings;
  }
  
  /**
   * Generate pairings for subsequent rounds using Swiss algorithm
   */
  private static generateSubsequentRoundPairings(
    round: number,
    standings: SwissStanding[]
  ): SwissPairing[] {
    const pairings: SwissPairing[] = [];
    const availableTeams = [...standings];
    
    // Sort by points (descending), then by tiebreakers
    availableTeams.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.opponentPoints !== b.opponentPoints) return b.opponentPoints - a.opponentPoints;
      return b.strengthOfSchedule - a.strengthOfSchedule;
    });
    
    // Group teams by point totals
    const pointGroups = this.groupTeamsByPoints(availableTeams);
    
    // Pair within point groups, then across adjacent groups if needed
    Object.keys(pointGroups)
      .sort((a, b) => parseFloat(b) - parseFloat(a))
      .forEach(pointGroup => {
        const teams = pointGroups[parseFloat(pointGroup)];
        const groupPairings = this.pairWithinGroup(round, teams);
        pairings.push(...groupPairings);
      });
    
    return pairings;
  }
  
  /**
   * Group teams by point totals
   */
  private static groupTeamsByPoints(standings: SwissStanding[]): { [points: number]: SwissStanding[] } {
    const groups: { [points: number]: SwissStanding[] } = {};
    
    standings.forEach(standing => {
      if (!groups[standing.points]) {
        groups[standing.points] = [];
      }
      groups[standing.points].push(standing);
    });
    
    return groups;
  }
  
  /**
   * Pair teams within a point group
   */
  private static pairWithinGroup(round: number, teams: SwissStanding[]): SwissPairing[] {
    const pairings: SwissPairing[] = [];
    const unpaired = [...teams];
    
    while (unpaired.length >= 2) {
      const team1 = unpaired.shift()!;
      
      // Find best opponent for team1
      let bestOpponentIndex = -1;
      let bestScore = -Infinity;
      
      unpaired.forEach((team2, index) => {
        const score = this.calculatePairingScore(team1, team2);
        if (score > bestScore) {
          bestScore = score;
          bestOpponentIndex = index;
        }
      });
      
      if (bestOpponentIndex >= 0) {
        const team2 = unpaired.splice(bestOpponentIndex, 1)[0];
        
        // Determine home/away based on color preference
        const { homeTeam, awayTeam } = this.determineColors(team1, team2);
        
        pairings.push({
          round,
          homeTeamId: homeTeam.teamId,
          awayTeamId: awayTeam.teamId,
          homeTeamName: homeTeam.teamName,
          awayTeamName: awayTeam.teamName,
          pointDifference: Math.abs(homeTeam.points - awayTeam.points),
          previousMeetings: this.countPreviousMeetings(homeTeam, awayTeam)
        });
      }
    }
    
    return pairings;
  }
  
  /**
   * Calculate pairing score (higher is better)
   */
  private static calculatePairingScore(team1: SwissStanding, team2: SwissStanding): number {
    let score = 0;
    
    // Avoid teams that have already played (critical)
    if (team1.opponentsPlayed.includes(team2.teamId)) {
      score -= 1000;
    }
    
    // Prefer similar point totals (important)
    const pointDifference = Math.abs(team1.points - team2.points);
    score -= pointDifference * 100;
    
    // Color balance preference (moderate)
    if (this.hasColorImbalance(team1) || this.hasColorImbalance(team2)) {
      score += 50;
    }
    
    // Strength of schedule balancing (minor)
    const sosBalance = Math.abs(team1.strengthOfSchedule - team2.strengthOfSchedule);
    score -= sosBalance * 10;
    
    return score;
  }
  
  /**
   * Determine home/away colors based on team preferences
   */
  private static determineColors(
    team1: SwissStanding, 
    team2: SwissStanding
  ): { homeTeam: SwissStanding; awayTeam: SwissStanding } {
    const team1HomePreference = team1.colorCount.home - team1.colorCount.away;
    const team2HomePreference = team2.colorCount.home - team2.colorCount.away;
    
    // Team with fewer home games gets home
    if (team1HomePreference < team2HomePreference) {
      return { homeTeam: team1, awayTeam: team2 };
    } else if (team2HomePreference < team1HomePreference) {
      return { homeTeam: team2, awayTeam: team1 };
    }
    
    // Random assignment if equal
    return Math.random() < 0.5 
      ? { homeTeam: team1, awayTeam: team2 }
      : { homeTeam: team2, awayTeam: team1 };
  }
  
  /**
   * Check if team has color imbalance
   */
  private static hasColorImbalance(team: SwissStanding): boolean {
    const difference = Math.abs(team.colorCount.home - team.colorCount.away);
    return difference >= 2;
  }
  
  /**
   * Count previous meetings between two teams
   */
  private static countPreviousMeetings(team1: SwissStanding, team2: SwissStanding): number {
    return team1.opponentsPlayed.filter(id => id === team2.teamId).length;
  }
  
  /**
   * Calculate current standings from results
   */
  static calculateCurrentStandings(
    teams: Team[], 
    results: SwissRoundResult[]
  ): SwissStanding[] {
    const standings: SwissStanding[] = teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      points: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      opponentsPlayed: [],
      opponentPoints: 0,
      strengthOfSchedule: 0,
      colorPreference: 'neutral',
      colorCount: { home: 0, away: 0 }
    }));
    
    const standingsMap = new Map(standings.map(s => [s.teamId, s]));
    
    // Process all results
    results.forEach(result => {
      const homeStanding = standingsMap.get(result.homeTeamId);
      const awayStanding = standingsMap.get(result.awayTeamId);
      
      if (!homeStanding || !awayStanding) return;
      
      // Update matches played and opponents
      homeStanding.matchesPlayed++;
      awayStanding.matchesPlayed++;
      homeStanding.opponentsPlayed.push(result.awayTeamId);
      awayStanding.opponentsPlayed.push(result.homeTeamId);
      
      // Update color counts
      homeStanding.colorCount.home++;
      awayStanding.colorCount.away++;
      
      // Update points and records based on result
      switch (result.result) {
        case 'home_win':
          homeStanding.points += 3;
          homeStanding.wins++;
          awayStanding.losses++;
          break;
        case 'away_win':
          awayStanding.points += 3;
          awayStanding.wins++;
          homeStanding.losses++;
          break;
        case 'draw':
          homeStanding.points += 1;
          awayStanding.points += 1;
          homeStanding.draws++;
          awayStanding.draws++;
          break;
      }
    });
    
    // Calculate tiebreakers
    standings.forEach(standing => {
      standing.opponentPoints = this.calculateBuchholzScore(standing, standingsMap);
      standing.strengthOfSchedule = standing.opponentPoints / Math.max(standing.matchesPlayed, 1);
    });
    
    return standings;
  }
  
  /**
   * Calculate Buchholz score (sum of opponents' points)
   */
  private static calculateBuchholzScore(
    standing: SwissStanding, 
    standingsMap: Map<number, SwissStanding>
  ): number {
    return standing.opponentsPlayed.reduce((sum, opponentId) => {
      const opponent = standingsMap.get(opponentId);
      return sum + (opponent?.points || 0);
    }, 0);
  }
  
  /**
   * Calculate final rankings with tiebreakers
   */
  static calculateFinalRankings(standings: SwissStanding[]): SwissStanding[] {
    return [...standings].sort((a, b) => {
      // Primary: Points
      if (a.points !== b.points) return b.points - a.points;
      
      // Tiebreaker 1: Head-to-head record
      const headToHead = this.getHeadToHeadRecord(a, b);
      if (headToHead !== 0) return headToHead;
      
      // Tiebreaker 2: Buchholz score (opponents' points)
      if (a.opponentPoints !== b.opponentPoints) return b.opponentPoints - a.opponentPoints;
      
      // Tiebreaker 3: Strength of schedule
      if (a.strengthOfSchedule !== b.strengthOfSchedule) return b.strengthOfSchedule - a.strengthOfSchedule;
      
      // Tiebreaker 4: Number of wins
      if (a.wins !== b.wins) return b.wins - a.wins;
      
      return 0; // Equal ranking
    });
  }
  
  /**
   * Get head-to-head record between two teams
   */
  private static getHeadToHeadRecord(team1: SwissStanding, team2: SwissStanding): number {
    // This would need additional data structure to track actual game results
    // For now, return 0 (equal)
    return 0;
  }
  
  /**
   * Validate Swiss tournament constraints
   */
  static validateSwissTournament(
    teams: Team[], 
    rounds: number
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check minimum teams
    if (teams.length < 4) {
      issues.push('Swiss tournament requires at least 4 teams');
    }
    
    // Check maximum rounds (should not exceed teams - 1)
    if (rounds >= teams.length) {
      issues.push(`Maximum rounds for ${teams.length} teams is ${teams.length - 1}`);
    }
    
    // Check odd number of teams
    if (teams.length % 2 !== 0) {
      issues.push('Swiss tournament works best with even number of teams (bye rounds will be created for odd numbers)');
    }
    
    // Recommend minimum rounds for meaningful results
    const recommendedMinRounds = Math.ceil(Math.log2(teams.length));
    if (rounds < recommendedMinRounds) {
      issues.push(`Recommended minimum rounds: ${recommendedMinRounds} for ${teams.length} teams`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export default SwissSystemScheduler;