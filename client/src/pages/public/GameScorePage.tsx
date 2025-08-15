import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Trophy, Clock, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Game {
  id: number;
  homeTeam: { name: string; id: number };
  awayTeam: { name: string; id: number };
  homeScore: number | null;
  awayScore: number | null;
  startTime: string;
  field: { name: string };
  status: string;
  ageGroup: { ageGroup: string };
  isCompleted: boolean;
  isScoreLocked: boolean;
}

export default function GameScorePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch game data
  const { data: game, isLoading, error } = useQuery<Game>({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/public/games/${gameId}`);
      if (!response.ok) {
        throw new Error('Game not found');
      }
      return response.json();
    },
    enabled: !!gameId,
  });

  // Update score mutation
  const updateScoreMutation = useMutation({
    mutationFn: async ({ homeScore, awayScore }: { homeScore: number; awayScore: number }) => {
      const response = await fetch(`/api/public/games/${gameId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeScore,
          awayScore,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update score');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Score Updated",
        description: "The game score has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize form with existing scores
  useEffect(() => {
    if (game) {
      setHomeScore(game.homeScore?.toString() || '');
      setAwayScore(game.awayScore?.toString() || '');
    }
  }, [game]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);
    
    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast({
        title: "Invalid Score",
        description: "Please enter valid scores (0 or higher).",
        variant: "destructive",
      });
      return;
    }

    updateScoreMutation.mutate({
      homeScore: homeScoreNum,
      awayScore: awayScoreNum,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Game Not Found</h3>
              <p className="text-gray-600">The game you're looking for doesn't exist or may have been removed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameDate = new Date(game.startTime);
  const hasExistingScore = game.homeScore !== null && game.awayScore !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Game Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {game.homeTeam.name} vs {game.awayTeam.name}
            </CardTitle>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {gameDate.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {game.field.name}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {game.ageGroup.ageGroup}
            </div>
          </CardHeader>
        </Card>

        {/* Score Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {hasExistingScore ? 'Update Game Score' : 'Enter Game Score'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {game.isScoreLocked && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This game's score has been locked by tournament administrators. Contact event staff to make changes.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Label htmlFor="homeScore" className="text-lg font-semibold">
                    {game.homeTeam.name}
                  </Label>
                  <Input
                    id="homeScore"
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="text-center text-2xl font-bold mt-2"
                    placeholder="0"
                    disabled={game.isScoreLocked || updateScoreMutation.isPending}
                  />
                </div>

                <div className="text-center">
                  <Label htmlFor="awayScore" className="text-lg font-semibold">
                    {game.awayTeam.name}
                  </Label>
                  <Input
                    id="awayScore"
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="text-center text-2xl font-bold mt-2"
                    placeholder="0"
                    disabled={game.isScoreLocked || updateScoreMutation.isPending}
                  />
                </div>
              </div>

              <div className="text-center">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={game.isScoreLocked || updateScoreMutation.isPending}
                >
                  {updateScoreMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : hasExistingScore ? (
                    'Update Score'
                  ) : (
                    'Submit Score'
                  )}
                </Button>
              </div>
            </form>

            {hasExistingScore && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-center text-sm text-gray-600">
                  <p>Current Score:</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {game.homeTeam.name} {game.homeScore} - {game.awayScore} {game.awayTeam.name}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 mt-4">
          Anyone with this link can view and edit this game's score
        </div>
      </div>
    </div>
  );
}