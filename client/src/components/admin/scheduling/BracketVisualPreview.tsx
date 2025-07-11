import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trophy, Users, ArrowRight, ArrowDown, Target, 
  Edit, CheckCircle, Eye, Settings
} from "lucide-react";

interface BracketVisualPreviewProps {
  eventId: string;
  workflowData: any;
  onConfirm?: (bracketLayout: any) => void;
  onEdit?: () => void;
}

interface BracketNode {
  id: string;
  type: 'team' | 'game' | 'advance';
  teamName?: string;
  gameId?: string;
  round: number;
  position: number;
  children?: BracketNode[];
  winner?: string;
}

interface BracketLayout {
  id: string;
  name: string;
  ageGroup: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'group_stage';
  teams: string[];
  rounds: number;
  structure: BracketNode[];
  estimatedGames: number;
}

export function BracketVisualPreview({ eventId, workflowData, onConfirm, onEdit }: BracketVisualPreviewProps) {
  const [bracketLayouts, setBracketLayouts] = useState<BracketLayout[]>([]);
  const [selectedBracket, setSelectedBracket] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'structure' | 'games'>('structure');

  // Fetch bracket configuration data
  const { data: bracketData, isLoading } = useQuery({
    queryKey: ['bracket-preview', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/brackets`);
      if (!response.ok) throw new Error('Failed to fetch brackets');
      return response.json();
    }
  });

  // Generate bracket layouts from workflow data
  useEffect(() => {
    if (workflowData.bracket && workflowData.flight) {
      const layouts = generateBracketLayouts(workflowData);
      setBracketLayouts(layouts);
      if (layouts.length > 0) {
        setSelectedBracket(layouts[0].id);
      }
    }
  }, [workflowData]);

  const generateBracketLayouts = (data: any): BracketLayout[] => {
    const layouts: BracketLayout[] = [];
    
    // Generate layouts for each bracket configuration
    data.bracket.brackets?.forEach((bracket: any) => {
      const teams = data.flight.teams?.filter((team: any) => 
        team.ageGroup === bracket.ageGroup
      ).map((team: any) => team.name) || [];
      
      const layout: BracketLayout = {
        id: bracket.id,
        name: bracket.name,
        ageGroup: bracket.ageGroup,
        format: bracket.format || 'single_elimination',
        teams,
        rounds: calculateRounds(teams.length, bracket.format),
        structure: generateBracketStructure(teams, bracket.format),
        estimatedGames: calculateEstimatedGames(teams.length, bracket.format)
      };
      
      layouts.push(layout);
    });
    
    return layouts;
  };

  const calculateRounds = (teamCount: number, format: string): number => {
    switch (format) {
      case 'single_elimination':
        return Math.ceil(Math.log2(teamCount));
      case 'double_elimination':
        return Math.ceil(Math.log2(teamCount)) + 1;
      case 'round_robin':
        return teamCount - 1;
      case 'group_stage':
        return 3; // Typical group stage rounds
      default:
        return Math.ceil(Math.log2(teamCount));
    }
  };

  const calculateEstimatedGames = (teamCount: number, format: string): number => {
    switch (format) {
      case 'single_elimination':
        return teamCount - 1;
      case 'double_elimination':
        return (teamCount - 1) * 2 - 1;
      case 'round_robin':
        return (teamCount * (teamCount - 1)) / 2;
      case 'group_stage':
        const groupSize = 4;
        const groups = Math.ceil(teamCount / groupSize);
        const groupGames = groups * ((groupSize * (groupSize - 1)) / 2);
        const playoffTeams = groups * 2; // Top 2 from each group
        const playoffGames = playoffTeams - 1;
        return groupGames + playoffGames;
      default:
        return teamCount - 1;
    }
  };

  const generateBracketStructure = (teams: string[], format: string): BracketNode[] => {
    switch (format) {
      case 'single_elimination':
        return generateSingleEliminationStructure(teams);
      case 'double_elimination':
        return generateDoubleEliminationStructure(teams);
      case 'round_robin':
        return generateRoundRobinStructure(teams);
      case 'group_stage':
        return generateGroupStageStructure(teams);
      default:
        return generateSingleEliminationStructure(teams);
    }
  };

  const generateSingleEliminationStructure = (teams: string[]): BracketNode[] => {
    const structure: BracketNode[] = [];
    const rounds = Math.ceil(Math.log2(teams.length));
    
    // First round - pair up teams
    for (let i = 0; i < teams.length; i += 2) {
      const game: BracketNode = {
        id: `game_r1_${i/2}`,
        type: 'game',
        round: 1,
        position: i / 2,
        children: [
          {
            id: `team_${i}`,
            type: 'team',
            teamName: teams[i],
            round: 1,
            position: i
          },
          teams[i + 1] ? {
            id: `team_${i + 1}`,
            type: 'team',
            teamName: teams[i + 1],
            round: 1,
            position: i + 1
          } : {
            id: `bye_${i + 1}`,
            type: 'advance',
            round: 1,
            position: i + 1
          }
        ]
      };
      structure.push(game);
    }
    
    // Generate subsequent rounds
    let previousRoundGames = Math.ceil(teams.length / 2);
    for (let round = 2; round <= rounds; round++) {
      const currentRoundGames = Math.ceil(previousRoundGames / 2);
      for (let i = 0; i < currentRoundGames; i++) {
        structure.push({
          id: `game_r${round}_${i}`,
          type: 'game',
          round,
          position: i
        });
      }
      previousRoundGames = currentRoundGames;
    }
    
    return structure;
  };

  const generateDoubleEliminationStructure = (teams: string[]): BracketNode[] => {
    // Simplified double elimination structure
    const winnersBracket = generateSingleEliminationStructure(teams);
    const losersBracket: BracketNode[] = [];
    
    // Add losers bracket games (simplified)
    const losersRounds = winnersBracket.length;
    for (let i = 0; i < losersRounds; i++) {
      losersBracket.push({
        id: `losers_game_${i}`,
        type: 'game',
        round: i + 1,
        position: i
      });
    }
    
    return [...winnersBracket, ...losersBracket];
  };

  const generateRoundRobinStructure = (teams: string[]): BracketNode[] => {
    const structure: BracketNode[] = [];
    let gameId = 0;
    
    // Generate all possible matchups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        structure.push({
          id: `rr_game_${gameId}`,
          type: 'game',
          round: 1,
          position: gameId,
          children: [
            {
              id: `team_${i}`,
              type: 'team',
              teamName: teams[i],
              round: 1,
              position: i
            },
            {
              id: `team_${j}`,
              type: 'team',
              teamName: teams[j],
              round: 1,
              position: j
            }
          ]
        });
        gameId++;
      }
    }
    
    return structure;
  };

  const generateGroupStageStructure = (teams: string[]): BracketNode[] => {
    const structure: BracketNode[] = [];
    const groupSize = 4;
    const groups = Math.ceil(teams.length / groupSize);
    
    // Generate group stage games
    for (let group = 0; group < groups; group++) {
      const groupTeams = teams.slice(group * groupSize, (group + 1) * groupSize);
      const groupGames = generateRoundRobinStructure(groupTeams);
      
      groupGames.forEach((game, index) => {
        structure.push({
          ...game,
          id: `group_${group}_game_${index}`
        });
      });
    }
    
    // Add playoff structure
    const playoffTeams = groups * 2; // Top 2 from each group
    const playoffStructure = generateSingleEliminationStructure(
      Array(playoffTeams).fill(0).map((_, i) => `Qualifier ${i + 1}`)
    );
    
    return [...structure, ...playoffStructure];
  };

  const renderBracketStructure = (layout: BracketLayout) => {
    if (layout.format === 'round_robin') {
      return renderRoundRobinView(layout);
    }
    
    return renderEliminationView(layout);
  };

  const renderEliminationView = (layout: BracketLayout) => {
    const rounds = new Map<number, BracketNode[]>();
    
    // Group nodes by round
    layout.structure.forEach(node => {
      if (!rounds.has(node.round)) {
        rounds.set(node.round, []);
      }
      rounds.get(node.round)!.push(node);
    });
    
    return (
      <div className="flex gap-8 overflow-x-auto p-4">
        {Array.from(rounds.entries()).map(([round, nodes]) => (
          <div key={round} className="flex flex-col gap-4 min-w-[200px]">
            <div className="text-center font-medium text-sm">
              {round === Math.max(...Array.from(rounds.keys())) ? 'Final' : `Round ${round}`}
            </div>
            {nodes.map(node => (
              <div key={node.id} className="relative">
                {node.type === 'game' && (
                  <Card className="w-full">
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground mb-2">
                        Game {node.position + 1}
                      </div>
                      {node.children ? (
                        <div className="space-y-2">
                          {node.children.map(child => (
                            <div key={child.id} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                child.type === 'team' ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">
                                {child.teamName || 'TBD'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Winner of previous games
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Connection lines */}
                {round < Math.max(...Array.from(rounds.keys())) && (
                  <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderRoundRobinView = (layout: BracketLayout) => {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layout.structure.map(node => (
            <Card key={node.id}>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Game {node.position + 1}
                </div>
                {node.children && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {node.children[0]?.teamName}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-sm font-medium">
                      {node.children[1]?.teamName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const selectedLayout = bracketLayouts.find(layout => layout.id === selectedBracket);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Trophy className="h-6 w-6 animate-pulse mr-2" />
            Loading bracket preview...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Bracket Visual Preview
          </CardTitle>
          <p className="text-muted-foreground">
            Review and confirm bracket layouts before proceeding to team seeding and game generation.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {bracketLayouts.map(layout => (
                <Button
                  key={layout.id}
                  variant={selectedBracket === layout.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBracket(layout.id)}
                >
                  {layout.name}
                  <Badge variant="secondary" className="ml-2">
                    {layout.teams.length} teams
                  </Badge>
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(previewMode === 'structure' ? 'games' : 'structure')}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode === 'structure' ? 'View Games' : 'View Structure'}
              </Button>
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Brackets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Details */}
      {selectedLayout && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedLayout.name} - {selectedLayout.ageGroup}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Format: {selectedLayout.format.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {selectedLayout.teams.length} Teams
              </Badge>
              <Badge variant="outline">
                {selectedLayout.rounds} Rounds
              </Badge>
              <Badge variant="outline">
                ~{selectedLayout.estimatedGames} Games
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Format-specific information */}
            <Alert className="mb-4">
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                {selectedLayout.format === 'single_elimination' && 
                  "Single elimination format: Teams are eliminated after one loss. Fast tournament progression."
                }
                {selectedLayout.format === 'double_elimination' && 
                  "Double elimination format: Teams must lose twice to be eliminated. Ensures fair second chances."
                }
                {selectedLayout.format === 'round_robin' && 
                  "Round robin format: Every team plays every other team once. Guarantees multiple games per team."
                }
                {selectedLayout.format === 'group_stage' && 
                  "Group stage format: Teams play within groups, then top teams advance to elimination playoffs."
                }
              </AlertDescription>
            </Alert>

            {/* Visual bracket structure */}
            <div className="border rounded-lg bg-gray-50 overflow-hidden">
              {renderBracketStructure(selectedLayout)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams List */}
      {selectedLayout && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participating Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {selectedLayout.teams.map((team, index) => (
                <Badge key={index} variant="outline" className="justify-start">
                  {team}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Bracket Layout Confirmation</h3>
              <p className="text-sm text-muted-foreground">
                Confirm bracket structure to proceed with team seeding and schedule generation.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Make Changes
              </Button>
              <Button onClick={() => onConfirm?.(bracketLayouts)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Brackets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}