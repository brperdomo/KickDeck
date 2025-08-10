import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface CrossplayGamesFixProps {
  eventId: string;
  ageGroupId: number;
  flightId: number;
  flightName: string;
  onFixComplete?: () => void;
}

export function CrossplayGamesFix({ eventId, ageGroupId, flightId, flightName, onFixComplete }: CrossplayGamesFixProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFixing, setIsFixing] = useState(false);

  const fixCrossplayMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/tournaments/${eventId}/fix-crossplay-games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ageGroupId, flightId })
      });
      if (!response.ok) throw new Error('Failed to fix crossplay games');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Crossplay Games Fixed",
        description: `Fixed ${data.deletedGames} corrupted games and regenerated ${data.regeneratedGames} correct crossplay games`,
      });
      queryClient.invalidateQueries({ queryKey: ['tournament-control'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      onFixComplete?.();
      setIsFixing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fix Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsFixing(false);
    }
  });

  const handleFix = () => {
    setIsFixing(true);
    fixCrossplayMutation.mutate();
  };

  return (
    <Card className="bg-red-900/20 border-red-500">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Critical: Crossplay Game Generation Bug Detected
        </CardTitle>
        <CardDescription className="text-red-200">
          Flight: {flightName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-500 bg-red-900/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <strong>TOURNAMENT CATASTROPHE DETECTED:</strong> Teams in the same bracket are scheduled to play each other in crossplay format. 
            This violates crossplay rules where only teams from different brackets (Pool A vs Pool B) should play each other.
          </AlertDescription>
        </Alert>

        <div className="bg-slate-800 p-4 rounded border border-slate-600">
          <h4 className="text-white font-semibold mb-2">What this fix will do:</h4>
          <ul className="text-slate-300 text-sm space-y-1">
            <li>✅ Delete all corrupted games for this flight</li>
            <li>✅ Regenerate games using corrected crossplay logic</li>
            <li>✅ Ensure teams only play against teams from different brackets</li>
            <li>✅ Maintain proper crossplay matchup format (A1 vs B1, A2 vs B2, etc.)</li>
            <li>✅ Add comprehensive validation to prevent future occurrences</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleFix}
            disabled={isFixing || fixCrossplayMutation.isPending}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing Games...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Fix Crossplay Games Now
              </>
            )}
          </Button>
        </div>

        {fixCrossplayMutation.isSuccess && (
          <Alert className="border-green-500 bg-green-900/30">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200">
              ✅ Crossplay games have been successfully fixed. The tournament is now safe to proceed.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}