import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, Clock, MapPin, Users, RefreshCw, Save, 
  AlertTriangle, CheckCircle, Eye, Settings, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveSchedulerViewProps {
  eventId: string;
  workflowData: any;
  onComplete?: (finalSchedule: any) => void;
}

interface GameSlot {
  id: string;
  gameId?: string;
  fieldId: string;
  fieldName: string;
  startTime: string;
  endTime: string;
  teamA?: string;
  teamB?: string;
  ageGroup?: string;
  bracketName?: string;
  status: 'available' | 'scheduled' | 'conflict';
}

interface ConflictInfo {
  type: 'team_conflict' | 'field_conflict' | 'time_conflict';
  message: string;
  severity: 'warning' | 'error';
  gameIds: string[];
}

export function LiveSchedulerView({ eventId, workflowData, onComplete }: LiveSchedulerViewProps) {
  const [gameSlots, setGameSlots] = useState<GameSlot[]>([]);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [dragEnabled, setDragEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current schedule data
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['live-schedule', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule`);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      return response.json();
    }
  });

  // Fetch fields data
  const { data: fieldsData } = useQuery({
    queryKey: ['event-fields', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    }
  });

  // Save schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: async (updatedSchedule: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule)
      });
      if (!response.ok) throw new Error('Failed to save schedule');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedule Saved",
        description: "Schedule changes have been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['live-schedule', eventId] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save schedule changes. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize game slots from schedule data
  useEffect(() => {
    if (scheduleData && fieldsData) {
      const slots = generateGameSlots(scheduleData, fieldsData);
      setGameSlots(slots);
      detectConflicts(slots);
    }
  }, [scheduleData, fieldsData]);

  const generateGameSlots = (schedule: any, fields: any[]): GameSlot[] => {
    const slots: GameSlot[] = [];
    
    // Generate time slots for each field
    fields.forEach(field => {
      // Create hourly slots based on operating hours
      const startHour = 8; // 8 AM
      const endHour = 20; // 8 PM
      
      for (let hour = startHour; hour < endHour; hour++) {
        const slotId = `${field.id}-${hour}`;
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Check if this slot has a scheduled game
        const scheduledGame = schedule.games?.find((game: any) => 
          game.fieldId === field.id && 
          new Date(game.startTime).getHours() === hour
        );
        
        slots.push({
          id: slotId,
          gameId: scheduledGame?.id,
          fieldId: field.id,
          fieldName: field.name,
          startTime,
          endTime,
          teamA: scheduledGame?.teamA,
          teamB: scheduledGame?.teamB,
          ageGroup: scheduledGame?.ageGroup,
          bracketName: scheduledGame?.bracketName,
          status: scheduledGame ? 'scheduled' : 'available'
        });
      }
    });
    
    return slots;
  };

  const detectConflicts = (slots: GameSlot[]) => {
    const detectedConflicts: ConflictInfo[] = [];
    const scheduledSlots = slots.filter(slot => slot.status === 'scheduled');
    
    // Check for team conflicts (same team playing multiple games at same time)
    const teamTimeMap = new Map<string, Set<string>>();
    
    scheduledSlots.forEach(slot => {
      if (slot.teamA && slot.teamB) {
        [slot.teamA, slot.teamB].forEach(team => {
          if (!teamTimeMap.has(team)) {
            teamTimeMap.set(team, new Set());
          }
          
          const timeKey = slot.startTime;
          if (teamTimeMap.get(team)!.has(timeKey)) {
            detectedConflicts.push({
              type: 'team_conflict',
              message: `Team ${team} has multiple games scheduled at ${slot.startTime}`,
              severity: 'error',
              gameIds: [slot.gameId!]
            });
          } else {
            teamTimeMap.get(team)!.add(timeKey);
          }
        });
      }
    });
    
    // Check for insufficient rest time between games for same team
    scheduledSlots.forEach(slot => {
      if (slot.teamA && slot.teamB) {
        [slot.teamA, slot.teamB].forEach(team => {
          const teamGames = scheduledSlots.filter(s => 
            s.teamA === team || s.teamB === team
          ).sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          for (let i = 0; i < teamGames.length - 1; i++) {
            const currentGame = teamGames[i];
            const nextGame = teamGames[i + 1];
            
            const currentEnd = new Date(`2000-01-01 ${currentGame.endTime}`);
            const nextStart = new Date(`2000-01-01 ${nextGame.startTime}`);
            const restMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
            
            if (restMinutes < 60) { // Less than 1 hour rest
              detectedConflicts.push({
                type: 'time_conflict',
                message: `Team ${team} has insufficient rest time (${restMinutes}min) between games`,
                severity: 'warning',
                gameIds: [currentGame.gameId!, nextGame.gameId!]
              });
            }
          }
        });
      }
    });
    
    setConflicts(detectedConflicts);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Find the game being moved
    const sourceSlot = gameSlots.find(slot => slot.id === source.droppableId);
    const destinationSlot = gameSlots.find(slot => slot.id === destination.droppableId);
    
    if (!sourceSlot || !destinationSlot) return;
    
    // Update game slots
    const updatedSlots = gameSlots.map(slot => {
      if (slot.id === source.droppableId) {
        return { ...slot, gameId: undefined, teamA: undefined, teamB: undefined, status: 'available' as const };
      }
      if (slot.id === destination.droppableId) {
        return { 
          ...slot, 
          gameId: sourceSlot.gameId, 
          teamA: sourceSlot.teamA, 
          teamB: sourceSlot.teamB,
          ageGroup: sourceSlot.ageGroup,
          bracketName: sourceSlot.bracketName,
          status: 'scheduled' as const 
        };
      }
      return slot;
    });
    
    setGameSlots(updatedSlots);
    detectConflicts(updatedSlots);
    
    toast({
      title: "Game Moved",
      description: `Game moved from ${sourceSlot.fieldName} to ${destinationSlot.fieldName}`
    });
  };

  const saveSchedule = () => {
    const finalSchedule = {
      eventId,
      gameSlots: gameSlots.filter(slot => slot.status === 'scheduled'),
      conflicts,
      lastModified: new Date().toISOString()
    };
    
    saveScheduleMutation.mutate(finalSchedule);
  };

  const getConflictColor = (severity: 'warning' | 'error') => {
    return severity === 'error' ? 'text-red-600' : 'text-orange-600';
  };

  const getConflictIcon = (severity: 'warning' | 'error') => {
    return severity === 'error' ? AlertTriangle : Eye;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading live scheduler...
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
            <Zap className="h-6 w-6" />
            Live Schedule Manager
          </CardTitle>
          <p className="text-muted-foreground">
            Drag and drop games to adjust timing and field assignments. Conflicts are automatically detected.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {gameSlots.filter(slot => slot.status === 'scheduled').length} Games Scheduled
              </Badge>
              <Badge variant={conflicts.length > 0 ? "destructive" : "secondary"}>
                {conflicts.length} Conflicts
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDragEnabled(!dragEnabled)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {dragEnabled ? 'Lock' : 'Unlock'} Dragging
              </Button>
              <Button onClick={saveSchedule} disabled={saveScheduleMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Schedule Conflicts Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <Alert key={index} className="border-orange-200">
                  <div className="flex items-center gap-2">
                    <div className={getConflictColor(conflict.severity)}>
                      {React.createElement(getConflictIcon(conflict.severity), { className: "h-4 w-4" })}
                    </div>
                    <AlertDescription>{conflict.message}</AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd} isDropDisabled={!dragEnabled}>
            <div className="grid gap-4">
              {fieldsData?.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium">{field.name}</h3>
                    <Badge variant="outline">{field.fieldSize}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2">
                    {gameSlots
                      .filter(slot => slot.fieldId === field.id)
                      .map((slot, index) => (
                        <Droppable key={slot.id} droppableId={slot.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`p-2 border rounded min-h-[80px] transition-colors ${
                                snapshot.isDraggingOver 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : slot.status === 'scheduled'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="text-xs text-center mb-1">
                                {slot.startTime}
                              </div>
                              
                              {slot.status === 'scheduled' && slot.gameId && (
                                <Draggable 
                                  draggableId={slot.gameId} 
                                  index={index}
                                  isDragDisabled={!dragEnabled}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-2 bg-white border rounded shadow-sm cursor-move ${
                                        snapshot.isDragging ? 'shadow-lg' : ''
                                      }`}
                                    >
                                      <div className="text-xs font-medium truncate">
                                        {slot.teamA} vs {slot.teamB}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {slot.ageGroup}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )}
                              
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Complete Action */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Schedule Management Complete</h3>
              <p className="text-sm text-muted-foreground">
                Save changes and proceed to finalize the tournament schedule.
              </p>
            </div>
            <Button 
              onClick={() => onComplete?.(gameSlots)}
              disabled={conflicts.some(c => c.severity === 'error')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}