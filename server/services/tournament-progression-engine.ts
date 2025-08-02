/**
 * Tournament Progression Engine
 * 
 * Handles dynamic tournament advancement, pool standings calculation,
 * tiebreaker resolution, and bracket progression logic
 */

export interface GameResult {
  gameId: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  fairPlayPoints?: { home: number; away: number };
}

export interface TeamStanding {
  teamId: number;
  teamName: string;
  poolId: string;
  poolName: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  fairPlayPoints: number;
  headToHeadRecord?: Record<number, HeadToHeadResult>;
  position: number;
  tiebroken: boolean;
}

export interface HeadToHeadResult {
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface AdvancementRule {
  type: 'pool_winner' | 'pool_runner_up' | 'wildcard' | 'top_n' | 'percentage';
  poolId?: string;
  count?: number;
  percentage?: number;
  criteria?: 'points' | 'goal_difference' | 'goals_scored';
}

export interface AdvancingTeam {
  teamId: number;
  teamName: string;
  poolId: string;
  position: number;
  seed: number;
  advancementReason: string;
}

export interface Pool {
  id: string;
  name: string;
  teamIds: number[];
  advancementRules: AdvancementRule[];
}

export class TournamentProgressionEngine {

  /**
   * Calculate pool standings with complete tiebreaker resolution
   */
  static calculatePoolStandings(
    pool: Pool,
    gameResults: GameResult[],
    allTeams: Array<{ id: number; name: string }>
  ): TeamStanding[] {
    
    console.log(`📊 Calculating standings for ${pool.name} with ${gameResults.length} completed games`);
    
    // Initialize standings for all teams in pool
    const standings: TeamStanding[] = pool.teamIds.map(teamId => {
      const team = allTeams.find(t => t.id === teamId);
      return {
        teamId,
        teamName: team?.name || `Team ${teamId}`,
        poolId: pool.id,
        poolName: pool.name,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        fairPlayPoints: 0,
        headToHeadRecord: {},
        position: 0,
        tiebroken: false
      };
    });

    // Process completed games to calculate basic stats
    const completedGames = gameResults.filter(game => game.status === 'completed');
    
    for (const game of completedGames) {
      const homeStanding = standings.find(s => s.teamId === game.homeTeamId);
      const awayStanding = standings.find(s => s.teamId === game.awayTeamId);
      
      if (!homeStanding || !awayStanding) continue;
      
      // Update basic stats
      homeStanding.gamesPlayed++;
      awayStanding.gamesPlayed++;
      
      homeStanding.goalsFor += game.homeScore;
      homeStanding.goalsAgainst += game.awayScore;
      awayStanding.goalsFor += game.awayScore;
      awayStanding.goalsAgainst += game.homeScore;
      
      // Calculate goal difference
      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;
      
      // Update fair play points if available
      if (game.fairPlayPoints) {
        homeStanding.fairPlayPoints += game.fairPlayPoints.home;
        awayStanding.fairPlayPoints += game.fairPlayPoints.away;
      }
      
      // Determine result and update W/D/L and points
      if (game.homeScore > game.awayScore) {
        // Home win
        homeStanding.wins++;
        homeStanding.points += 3;
        awayStanding.losses++;
      } else if (game.awayScore > game.homeScore) {
        // Away win
        awayStanding.wins++;
        awayStanding.points += 3;
        homeStanding.losses++;
      } else {
        // Draw
        homeStanding.draws++;
        homeStanding.points += 1;
        awayStanding.draws++;
        awayStanding.points += 1;
      }
      
      // Update head-to-head records
      this.updateHeadToHeadRecord(homeStanding, awayStanding, game);
    }
    
    // Apply tiebreaker rules
    const sortedStandings = this.applyTiebreakers(standings);
    
    // Assign final positions
    sortedStandings.forEach((standing, index) => {
      standing.position = index + 1;
    });
    
    console.log(`✅ Pool ${pool.name} standings calculated:`);
    sortedStandings.forEach(s => {
      console.log(`   ${s.position}. ${s.teamName}: ${s.points} pts (${s.wins}-${s.draws}-${s.losses}, GD: ${s.goalDifference})`);
    });
    
    return sortedStandings;
  }

  /**
   * Apply FIFA-standard tiebreaker rules
   */
  private static applyTiebreakers(standings: TeamStanding[]): TeamStanding[] {
    
    // Sort by primary criteria first (points, then goal difference, then goals scored)
    let sortedTeams = [...standings].sort((a, b) => {
      // 1. Points
      if (a.points !== b.points) return b.points - a.points;
      
      // 2. Goal difference
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      
      // 3. Goals scored
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      
      // 4. Fewest goals allowed
      if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
      
      // 5. Fair play points (lower is better)
      if (a.fairPlayPoints !== b.fairPlayPoints) return a.fairPlayPoints - b.fairPlayPoints;
      
      return 0; // Teams are tied on all criteria
    });
    
    // Apply head-to-head tiebreakers for tied teams
    sortedTeams = this.resolveHeadToHeadTies(sortedTeams);
    
    return sortedTeams;
  }

  /**
   * Resolve ties using head-to-head results
   */
  private static resolveHeadToHeadTies(standings: TeamStanding[]): TeamStanding[] {
    const result = [...standings];
    
    // Find groups of teams tied on points
    const tiedGroups = this.findTiedGroups(result);
    
    for (const group of tiedGroups) {
      if (group.length > 1) {
        console.log(`🔄 Resolving head-to-head for tied teams: ${group.map(t => t.teamName).join(', ')}`);
        
        // Sort within the tied group using head-to-head
        const resolvedGroup = this.sortByHeadToHead(group);
        
        // Replace the tied group with the resolved order
        const startIndex = result.findIndex(t => t.teamId === group[0].teamId);
        result.splice(startIndex, group.length, ...resolvedGroup);
      }
    }
    
    return result;
  }

  /**
   * Find groups of teams tied on points
   */
  private static findTiedGroups(standings: TeamStanding[]): TeamStanding[][] {
    const groups: TeamStanding[][] = [];
    let currentGroup: TeamStanding[] = [standings[0]];
    
    for (let i = 1; i < standings.length; i++) {
      if (standings[i].points === standings[i-1].points) {
        currentGroup.push(standings[i]);
      } else {
        if (currentGroup.length > 1) {
          groups.push(currentGroup);
        }
        currentGroup = [standings[i]];
      }
    }
    
    if (currentGroup.length > 1) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  /**
   * Sort tied teams by head-to-head results
   */
  private static sortByHeadToHead(tiedTeams: TeamStanding[]): TeamStanding[] {
    return tiedTeams.sort((a, b) => {
      const h2hA = a.headToHeadRecord?.[b.teamId];
      const h2hB = b.headToHeadRecord?.[a.teamId];
      
      if (!h2hA || !h2hB) return 0;
      
      // Calculate head-to-head points
      const h2hPointsA = (h2hA.wins * 3) + h2hA.draws;
      const h2hPointsB = (h2hB.wins * 3) + h2hB.draws;
      
      if (h2hPointsA !== h2hPointsB) return h2hPointsB - h2hPointsA;
      
      // Head-to-head goal difference
      if (h2hA.goalDifference !== h2hB.goalDifference) {
        return h2hB.goalDifference - h2hA.goalDifference;
      }
      
      // Head-to-head goals scored
      return h2hB.goalsFor - h2hA.goalsFor;
    });
  }

  /**
   * Update head-to-head record between two teams
   */
  private static updateHeadToHeadRecord(
    team1: TeamStanding,
    team2: TeamStanding,
    game: GameResult
  ): void {
    
    // Initialize head-to-head records if they don't exist
    if (!team1.headToHeadRecord![team2.teamId]) {
      team1.headToHeadRecord![team2.teamId] = {
        gamesPlayed: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0
      };
    }
    
    if (!team2.headToHeadRecord![team1.teamId]) {
      team2.headToHeadRecord![team1.teamId] = {
        gamesPlayed: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0
      };
    }
    
    const h2h1 = team1.headToHeadRecord![team2.teamId];
    const h2h2 = team2.headToHeadRecord![team1.teamId];
    
    // Update games played
    h2h1.gamesPlayed++;
    h2h2.gamesPlayed++;
    
    // Determine which team is home and away
    const team1IsHome = game.homeTeamId === team1.teamId;
    const team1Score = team1IsHome ? game.homeScore : game.awayScore;
    const team2Score = team1IsHome ? game.awayScore : game.homeScore;
    
    // Update goals
    h2h1.goalsFor += team1Score;
    h2h1.goalsAgainst += team2Score;
    h2h2.goalsFor += team2Score;
    h2h2.goalsAgainst += team1Score;
    
    // Update goal difference
    h2h1.goalDifference = h2h1.goalsFor - h2h1.goalsAgainst;
    h2h2.goalDifference = h2h2.goalsFor - h2h2.goalsAgainst;
    
    // Update W/D/L
    if (team1Score > team2Score) {
      h2h1.wins++;
      h2h2.losses++;
    } else if (team2Score > team1Score) {
      h2h2.wins++;
      h2h1.losses++;
    } else {
      h2h1.draws++;
      h2h2.draws++;
    }
  }

  /**
   * Determine advancing teams based on advancement rules
   */
  static determineAdvancement(
    poolStandings: TeamStanding[],
    advancementRules: AdvancementRule[]
  ): AdvancingTeam[] {
    
    const advancingTeams: AdvancingTeam[] = [];
    
    for (const rule of advancementRules) {
      console.log(`🎯 Applying advancement rule: ${rule.type} for pool ${poolStandings[0]?.poolName}`);
      
      const teamsForRule = this.applyAdvancementRule(poolStandings, rule);
      advancingTeams.push(...teamsForRule);
    }
    
    console.log(`✅ ${advancingTeams.length} teams advancing from pool ${poolStandings[0]?.poolName}`);
    advancingTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName} (${team.advancementReason})`);
    });
    
    return advancingTeams;
  }

  /**
   * Apply a specific advancement rule
   */
  private static applyAdvancementRule(
    standings: TeamStanding[],
    rule: AdvancementRule
  ): AdvancingTeam[] {
    
    switch (rule.type) {
      case 'pool_winner':
        return standings.slice(0, 1).map((standing, index) => ({
          teamId: standing.teamId,
          teamName: standing.teamName,
          poolId: standing.poolId,
          position: standing.position,
          seed: index + 1,
          advancementReason: 'Pool Winner'
        }));
        
      case 'pool_runner_up':
        return standings.slice(1, 2).map((standing, index) => ({
          teamId: standing.teamId,
          teamName: standing.teamName,
          poolId: standing.poolId,
          position: standing.position,
          seed: index + 2,
          advancementReason: 'Pool Runner-up'
        }));
        
      case 'top_n':
        const count = rule.count || 2;
        return standings.slice(0, count).map((standing, index) => ({
          teamId: standing.teamId,
          teamName: standing.teamName,
          poolId: standing.poolId,
          position: standing.position,
          seed: index + 1,
          advancementReason: `Top ${count} from Pool`
        }));
        
      case 'percentage':
        const percentage = rule.percentage || 50;
        const teamsToAdvance = Math.ceil(standings.length * (percentage / 100));
        return standings.slice(0, teamsToAdvance).map((standing, index) => ({
          teamId: standing.teamId,
          teamName: standing.teamName,
          poolId: standing.poolId,
          position: standing.position,
          seed: index + 1,
          advancementReason: `Top ${percentage}% from Pool`
        }));
        
      default:
        console.log(`⚠️ Unknown advancement rule type: ${rule.type}`);
        return [];
    }
  }

  /**
   * Select wildcard teams across multiple pools
   */
  static selectWildcardTeams(
    allPoolStandings: TeamStanding[][],
    wildcardCount: number,
    criteria: 'points' | 'goal_difference' | 'goals_scored' = 'points'
  ): AdvancingTeam[] {
    
    console.log(`🃏 Selecting ${wildcardCount} wildcard teams using ${criteria} criteria`);
    
    // Get all non-advancing teams (typically 2nd place and below)
    const wildcardCandidates: TeamStanding[] = [];
    
    allPoolStandings.forEach(poolStandings => {
      // Add 2nd place and lower teams as wildcard candidates
      wildcardCandidates.push(...poolStandings.slice(1));
    });
    
    // Sort candidates by the specified criteria
    const sortedCandidates = wildcardCandidates.sort((a, b) => {
      switch (criteria) {
        case 'points':
          if (a.points !== b.points) return b.points - a.points;
          if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
          
        case 'goal_difference':
          if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
          if (a.points !== b.points) return b.points - a.points;
          return b.goalsFor - a.goalsFor;
          
        case 'goals_scored':
          if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
          if (a.points !== b.points) return b.points - a.points;
          return b.goalDifference - a.goalDifference;
          
        default:
          return 0;
      }
    });
    
    // Select the top wildcard teams
    const wildcardTeams = sortedCandidates.slice(0, wildcardCount).map((standing, index) => ({
      teamId: standing.teamId,
      teamName: standing.teamName,
      poolId: standing.poolId,
      position: standing.position,
      seed: 100 + index, // Give wildcards higher seed numbers
      advancementReason: `Wildcard (${criteria})`
    }));
    
    console.log(`🃏 Selected wildcard teams:`);
    wildcardTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.teamName} from ${team.poolId}`);
    });
    
    return wildcardTeams;
  }

  /**
   * Generate next stage games based on advancing teams
   */
  static generateNextStageGames(
    advancingTeams: AdvancingTeam[],
    nextStageFormat: 'knockout' | 'final' | 'semi_final',
    startingGameNumber: number = 1
  ): any[] {
    
    console.log(`🎮 Generating ${nextStageFormat} games for ${advancingTeams.length} advancing teams`);
    
    const games: any[] = [];
    let gameCounter = startingGameNumber;
    
    switch (nextStageFormat) {
      case 'knockout':
        // Create knockout bracket with proper seeding
        const seededTeams = [...advancingTeams].sort((a, b) => a.seed - b.seed);
        
        for (let i = 0; i < seededTeams.length; i += 2) {
          if (i + 1 < seededTeams.length) {
            games.push({
              id: `knockout_${gameCounter}`,
              homeTeamId: seededTeams[i].teamId,
              homeTeamName: seededTeams[i].teamName,
              awayTeamId: seededTeams[i + 1].teamId,
              awayTeamName: seededTeams[i + 1].teamName,
              round: 'Knockout',
              gameType: 'knockout',
              gameNumber: gameCounter++,
              duration: 90,
              notes: `${seededTeams[i].advancementReason} vs ${seededTeams[i + 1].advancementReason}`
            });
          }
        }
        break;
        
      case 'final':
        if (advancingTeams.length >= 2) {
          games.push({
            id: `final_${gameCounter}`,
            homeTeamId: advancingTeams[0].teamId,
            homeTeamName: advancingTeams[0].teamName,
            awayTeamId: advancingTeams[1].teamId,
            awayTeamName: advancingTeams[1].teamName,
            round: 'Final',
            gameType: 'final',
            gameNumber: gameCounter++,
            duration: 90,
            notes: 'Championship Final'
          });
        }
        break;
        
      case 'semi_final':
        if (advancingTeams.length >= 4) {
          // Create two semi-final games
          games.push({
            id: `semi1_${gameCounter}`,
            homeTeamId: advancingTeams[0].teamId,
            homeTeamName: advancingTeams[0].teamName,
            awayTeamId: advancingTeams[3].teamId,
            awayTeamName: advancingTeams[3].teamName,
            round: 'Semi-Final',
            gameType: 'knockout',
            gameNumber: gameCounter++,
            duration: 90,
            notes: 'Semi-Final 1'
          });
          
          games.push({
            id: `semi2_${gameCounter}`,
            homeTeamId: advancingTeams[1].teamId,
            homeTeamName: advancingTeams[1].teamName,
            awayTeamId: advancingTeams[2].teamId,
            awayTeamName: advancingTeams[2].teamName,
            round: 'Semi-Final',
            gameType: 'knockout',
            gameNumber: gameCounter++,
            duration: 90,
            notes: 'Semi-Final 2'
          });
        }
        break;
    }
    
    console.log(`✅ Generated ${games.length} ${nextStageFormat} games`);
    return games;
  }
}