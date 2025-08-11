import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  clubName: string;
}

interface TBDGame {
  id: number;
  scheduledDate: string;
  scheduledTime: string;
  fieldName: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  round: number;
  matchNumber: number;
  status: string;
  groupId: number;
  availableTeams: Team[];
}

interface TBDTeamAssignmentProps {
  eventId: string;
  onTeamAssigned?: () => void;
}

export default function TBDTeamAssignment({ eventId, onTeamAssigned }: TBDTeamAssignmentProps) {
  const [tbdGames, setTbdGames] = useState<TBDGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningGame, setAssigningGame] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<{[gameId: number]: {homeTeamId?: number, awayTeamId?: number}}>({});

  useEffect(() => {
    fetchTBDGames();
  }, [eventId]);

  const fetchTBDGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/events/${eventId}/tbd-games`);
      const data = await response.json();
      
      if (data.success) {
        setTbdGames(data.tbdGames);
        console.log('[TBD Games] Loaded:', data.tbdGames);
      }
    } catch (error) {
      console.error('[TBD Games] Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelection = (gameId: number, position: 'home' | 'away', teamId: string) => {
    const parsedTeamId = parseInt(teamId);
    setAssignments(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [position === 'home' ? 'homeTeamId' : 'awayTeamId']: parsedTeamId
      }
    }));
  };

  const assignTeams = async (gameId: number) => {
    const assignment = assignments[gameId];
    if (!assignment?.homeTeamId || !assignment?.awayTeamId) {
      alert('Please select both home and away teams');
      return;
    }

    try {
      setAssigningGame(gameId);
      
      const response = await fetch(`/api/admin/events/${eventId}/games/${gameId}/assign-teams`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeTeamId: assignment.homeTeamId,
          awayTeamId: assignment.awayTeamId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('[TBD Assignment] Success:', result);
        await fetchTBDGames(); // Refresh the list
        onTeamAssigned?.();
        
        // Clear the assignment for this game
        setAssignments(prev => {
          const updated = {...prev};
          delete updated[gameId];
          return updated;
        });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('[TBD Assignment] Error:', error);
      alert('Failed to assign teams');
    } finally {
      setAssigningGame(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading TBD games...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tbdGames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            TBD Team Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No TBD games found. All games have teams assigned.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            TBD Team Assignment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign teams to championship and playoff games
          </p>
        </CardHeader>
      </Card>

      {tbdGames.map((game) => (
        <Card key={game.id} className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {game.round === 2 && game.matchNumber === 7 ? 'Championship' : `Round ${game.round}`}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(game.scheduledDate)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatTime(game.scheduledTime)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {game.fieldName}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Home Team</label>
                <Select
                  value={assignments[game.id]?.homeTeamId?.toString() || ''}
                  onValueChange={(value) => handleTeamSelection(game.id, 'home', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {game.availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        <div>
                          <div className="font-medium">{team.name}</div>
                          {team.clubName && (
                            <div className="text-xs text-muted-foreground">{team.clubName}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Away Team Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Away Team</label>
                <Select
                  value={assignments[game.id]?.awayTeamId?.toString() || ''}
                  onValueChange={(value) => handleTeamSelection(game.id, 'away', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {game.availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        <div>
                          <div className="font-medium">{team.name}</div>
                          {team.clubName && (
                            <div className="text-xs text-muted-foreground">{team.clubName}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => assignTeams(game.id)}
                disabled={
                  assigningGame === game.id ||
                  !assignments[game.id]?.homeTeamId ||
                  !assignments[game.id]?.awayTeamId ||
                  assignments[game.id]?.homeTeamId === assignments[game.id]?.awayTeamId
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assigningGame === game.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  'Assign Teams'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}