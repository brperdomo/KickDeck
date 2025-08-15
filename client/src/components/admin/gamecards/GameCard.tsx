import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import GameQRCode from '@/components/GameQRCode';

interface Team {
  id: number;
  name: string;
  clubName?: string;
  coach?: string;
  managerName?: string;
  players?: Player[];
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
}

interface Game {
  id: number;
  scheduledDate?: string;
  scheduledTime?: string;
  fieldName?: string;
  round?: string;
  homeTeam?: Team;
  awayTeam?: Team;
}

interface GameCardProps {
  type: 'team' | 'game';
  team?: Team;
  game?: Game;
}

export default function GameCard({ type, team, game }: GameCardProps) {
  if (type === 'team' && team) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-center">
            {team.clubName || team.name}
          </CardTitle>
          <div className="text-sm text-muted-foreground text-center">
            Team Roster Card
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Team:</span> {team.name}
            </div>
            {team.coach && (
              <div className="text-sm">
                <span className="font-medium">Coach:</span> {team.coach}
              </div>
            )}
            {team.managerName && (
              <div className="text-sm">
                <span className="font-medium">Manager:</span> {team.managerName}
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="font-medium text-sm flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Players ({team.players?.length || 0})
            </div>
            {team.players && team.players.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {team.players.map((player) => (
                  <div key={player.id} className="text-xs flex justify-between">
                    <span>#{player.jerseyNumber || '--'} {player.firstName} {player.lastName}</span>
                    <span className="text-muted-foreground">{player.position || ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No players added</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'game' && game) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-center">
            Game G{game.id}
          </CardTitle>
          <div className="text-sm text-muted-foreground text-center">
            {game.round && <Badge variant="secondary">{game.round}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {game.scheduledDate || 'Date TBD'}
            </div>
            <div className="text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {game.scheduledTime || 'Time TBD'}
            </div>
            <div className="text-sm flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {game.fieldName || 'Field TBD'}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="text-center">
              <div className="font-medium text-sm mb-2">Teams</div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">HOME:</span> {game.homeTeam?.name || 'TBD'}
                </div>
                <div className="text-xs text-center text-muted-foreground">vs</div>
                <div className="text-sm">
                  <span className="font-medium">AWAY:</span> {game.awayTeam?.name || 'TBD'}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="text-xs text-muted-foreground">
                  Referee: _______________
                </div>
                <div className="text-xs text-muted-foreground">
                  Score: HOME [  ] - [  ] AWAY
                </div>
              </div>
              <div className="ml-3">
                <GameQRCode gameId={game.id} size={80} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}