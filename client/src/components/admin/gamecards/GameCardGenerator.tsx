import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GameCard from '@/components/admin/gamecards/GameCard';

interface Team {
  id: number;
  name: string;
  clubName?: string;
  coachName?: string;
  managerName?: string;
  logoUrl?: string;
  players?: Player[];
  ageGroupName?: string;
  bracketName?: string;
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  jerseyNumber?: number;
}

interface Game {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam?: Team;
  awayTeam?: Team;
  scheduledDate: string;
  scheduledTime: string;
  fieldId: number;
  fieldName: string;
  round: string;
  matchNumber: number;
  gameNumber?: string;
}

interface GameCardGeneratorProps {
  eventId: string;
}

const GameCardGenerator = ({ eventId }: GameCardGeneratorProps) => {
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [generationType, setGenerationType] = useState<'teams' | 'games'>('teams');
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  // Fetch teams with full details
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: async (): Promise<Team[]> => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/detailed`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    }
  });

  // Fetch games with team details
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', eventId],
    queryFn: async (): Promise<Game[]> => {
      const response = await fetch(`/api/admin/events/${eventId}/games/detailed`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  const handleTeamSelection = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams(prev => [...prev, teamId]);
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    }
  };

  const handleGameSelection = (gameId: number, checked: boolean) => {
    if (checked) {
      setSelectedGames(prev => [...prev, gameId]);
    } else {
      setSelectedGames(prev => prev.filter(id => id !== gameId));
    }
  };

  const handleSelectAll = () => {
    if (generationType === 'teams') {
      setSelectedTeams(teams?.map(t => t.id) || []);
    } else {
      setSelectedGames(games?.map(g => g.id) || []);
    }
  };

  const handleClearAll = () => {
    setSelectedTeams([]);
    setSelectedGames([]);
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Select your printer settings and print the gamecards."
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const selectedItems = generationType === 'teams' ? selectedTeams : selectedGames;
      const response = await fetch(`/api/admin/events/${eventId}/gamecards/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          selectedIds: selectedItems
        })
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamecards-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded",
        description: "Gamecards have been downloaded as PDF."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (teamsLoading || gamesLoading) {
    return <div className="flex items-center justify-center p-8">Loading tournament data...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Game Card Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generation Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Generation Type</label>
            <Select value={generationType} onValueChange={(value: 'teams' | 'games') => setGenerationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teams">Team Rosters</SelectItem>
                <SelectItem value="games">Game Schedules</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection Controls */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Hide Preview' : 'Preview'}
            </Button>
          </div>

          {/* Team Selection */}
          {generationType === 'teams' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Teams ({selectedTeams.length} selected)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                {teams?.map(team => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={selectedTeams.includes(team.id)}
                      onCheckedChange={(checked) => handleTeamSelection(team.id, !!checked)}
                    />
                    <label 
                      htmlFor={`team-${team.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {team.name}
                      {team.ageGroupName && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {team.ageGroupName}
                        </Badge>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Selection */}
          {generationType === 'games' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Games ({selectedGames.length} selected)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                {games?.map(game => (
                  <div key={game.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`game-${game.id}`}
                      checked={selectedGames.includes(game.id)}
                      onCheckedChange={(checked) => handleGameSelection(game.id, !!checked)}
                    />
                    <label 
                      htmlFor={`game-${game.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {game.homeTeam?.name} vs {game.awayTeam?.name}
                      <div className="text-xs text-muted-foreground">
                        {game.scheduledDate} at {game.scheduledTime} - Field {game.fieldName}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Cards
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewMode && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preview</h3>
          
          {generationType === 'teams' && (
            <div className="grid gap-6">
              {teams?.filter(team => selectedTeams.includes(team.id)).map(team => (
                <GameCard key={team.id} team={team} type="roster" />
              ))}
            </div>
          )}

          {generationType === 'games' && (
            <div className="grid gap-6">
              {games?.filter(game => selectedGames.includes(game.id)).map(game => (
                <GameCard key={game.id} game={game} type="schedule" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameCardGenerator;