import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, Calculator, Save, CheckCircle, AlertTriangle, 
  Info, Timer, MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimeBlockAssignmentProps {
  eventId: string;
  workflowData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface TimeBlock {
  ageGroupId: string;
  ageGroupName: string;
  gameFormat: {
    firstHalfMinutes: number;
    halftimeMinutes: number;
    secondHalfMinutes: number;
    bufferMinutes: number;
    totalMinutes: number;
  };
  gamesPerField: number;
  estimatedFieldsNeeded: number;
  totalGameTime: number;
}

interface GameFormatPreset {
  name: string;
  description: string;
  firstHalf: number;
  halftime: number;
  secondHalf: number;
  buffer: number;
}

export function TimeBlockAssignment({ eventId, workflowData, onComplete, onError }: TimeBlockAssignmentProps) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [hoursPerDay, setHoursPerDay] = useState(8); // Default 8-hour tournament day
  const { toast } = useToast();

  const brackets = workflowData?.bracket?.brackets || [];
  const seedings = workflowData?.seed?.bracketSeedings || [];

  // Predefined game format presets based on age groups
  const gameFormatPresets: GameFormatPreset[] = [
    { name: 'U8/U10', description: 'Short format for younger players', firstHalf: 20, halftime: 5, secondHalf: 20, buffer: 10 },
    { name: 'U12', description: 'Standard youth format', firstHalf: 25, halftime: 5, secondHalf: 25, buffer: 10 },
    { name: 'U14', description: 'Intermediate format', firstHalf: 30, halftime: 5, secondHalf: 30, buffer: 10 },
    { name: 'U16/U19', description: 'Full youth format', firstHalf: 35, halftime: 10, secondHalf: 35, buffer: 10 },
    { name: 'Adult', description: 'Full adult format', firstHalf: 45, halftime: 15, secondHalf: 45, buffer: 15 },
    { name: 'Custom', description: 'Define your own format', firstHalf: 25, halftime: 5, secondHalf: 25, buffer: 10 }
  ];

  useEffect(() => {
    if (brackets.length > 0) {
      initializeTimeBlocks();
    }
  }, [brackets]);

  const initializeTimeBlocks = () => {
    const blocks: TimeBlock[] = [];
    
    // Group brackets by age group
    const ageGroups = new Map<string, any[]>();
    
    brackets.forEach((bracket: any) => {
      const ageGroupName = extractAgeGroup(bracket.flightName);
      if (!ageGroups.has(ageGroupName)) {
        ageGroups.set(ageGroupName, []);
      }
      ageGroups.get(ageGroupName)!.push(bracket);
    });

    // Create time blocks for each age group
    Array.from(ageGroups.entries()).forEach(([ageGroupName, groupBrackets]) => {
      const totalGames = groupBrackets.reduce((sum, bracket) => sum + bracket.totalGames, 0);
      const suggestedFormat = getSuggestedFormat(ageGroupName);
      
      const gameFormat = {
        firstHalfMinutes: suggestedFormat.firstHalf,
        halftimeMinutes: suggestedFormat.halftime,
        secondHalfMinutes: suggestedFormat.secondHalf,
        bufferMinutes: suggestedFormat.buffer,
        totalMinutes: suggestedFormat.firstHalf + suggestedFormat.halftime + suggestedFormat.secondHalf + suggestedFormat.buffer
      };

      blocks.push({
        ageGroupId: ageGroupName,
        ageGroupName,
        gameFormat,
        gamesPerField: calculateGamesPerField(gameFormat.totalMinutes, hoursPerDay),
        estimatedFieldsNeeded: Math.ceil(totalGames / calculateGamesPerField(gameFormat.totalMinutes, hoursPerDay)),
        totalGameTime: totalGames * gameFormat.totalMinutes
      });
    });

    setTimeBlocks(blocks);
    if (blocks.length > 0) {
      setSelectedAgeGroup(blocks[0].ageGroupId);
    }
  };

  const extractAgeGroup = (flightName: string): string => {
    // Extract age group from flight name (e.g., "2014 Boys Flight 1" -> "2014 Boys")
    const match = flightName.match(/(\d{4}|\w+\d+)\s+(Boys|Girls)/i);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    // Fallback to first two words
    return flightName.split(' ').slice(0, 2).join(' ');
  };

  const getSuggestedFormat = (ageGroup: string): GameFormatPreset => {
    const year = extractBirthYear(ageGroup);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 10) return gameFormatPresets[0]; // U8/U10
    if (age <= 12) return gameFormatPresets[1]; // U12
    if (age <= 14) return gameFormatPresets[2]; // U14
    if (age <= 19) return gameFormatPresets[3]; // U16/U19
    return gameFormatPresets[4]; // Adult
  };

  const extractBirthYear = (ageGroup: string): number => {
    const match = ageGroup.match(/(\d{4})/);
    return match ? parseInt(match[1]) : new Date().getFullYear() - 16; // Default to U16
  };

  const calculateGamesPerField = (gameMinutes: number, hoursAvailable: number): number => {
    const minutesAvailable = hoursAvailable * 60;
    return Math.floor(minutesAvailable / gameMinutes);
  };

  const updateGameFormat = (ageGroupId: string, field: keyof TimeBlock['gameFormat'], value: number) => {
    setTimeBlocks(prev => prev.map(block => {
      if (block.ageGroupId === ageGroupId) {
        const updatedFormat = { ...block.gameFormat, [field]: value };
        updatedFormat.totalMinutes = 
          updatedFormat.firstHalfMinutes + 
          updatedFormat.halftimeMinutes + 
          updatedFormat.secondHalfMinutes + 
          updatedFormat.bufferMinutes;

        const newGamesPerField = calculateGamesPerField(updatedFormat.totalMinutes, hoursPerDay);
        const totalGames = getTotalGamesForAgeGroup(ageGroupId);

        return {
          ...block,
          gameFormat: updatedFormat,
          gamesPerField: newGamesPerField,
          estimatedFieldsNeeded: Math.ceil(totalGames / newGamesPerField),
          totalGameTime: totalGames * updatedFormat.totalMinutes
        };
      }
      return block;
    }));
  };

  const getTotalGamesForAgeGroup = (ageGroupId: string): number => {
    return brackets
      .filter((bracket: any) => extractAgeGroup(bracket.flightName) === ageGroupId)
      .reduce((sum: number, bracket: any) => sum + bracket.totalGames, 0);
  };

  const applyPreset = (ageGroupId: string, preset: GameFormatPreset) => {
    setTimeBlocks(prev => prev.map(block => {
      if (block.ageGroupId === ageGroupId) {
        const updatedFormat = {
          firstHalfMinutes: preset.firstHalf,
          halftimeMinutes: preset.halftime,
          secondHalfMinutes: preset.secondHalf,
          bufferMinutes: preset.buffer,
          totalMinutes: preset.firstHalf + preset.halftime + preset.secondHalf + preset.buffer
        };

        const newGamesPerField = calculateGamesPerField(updatedFormat.totalMinutes, hoursPerDay);
        const totalGames = getTotalGamesForAgeGroup(ageGroupId);

        return {
          ...block,
          gameFormat: updatedFormat,
          gamesPerField: newGamesPerField,
          estimatedFieldsNeeded: Math.ceil(totalGames / newGamesPerField),
          totalGameTime: totalGames * updatedFormat.totalMinutes
        };
      }
      return block;
    }));

    toast({
      title: "Format Applied",
      description: `${preset.name} format applied to ${ageGroupId}`
    });
  };

  const validateTimeBlocks = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    timeBlocks.forEach(block => {
      if (block.gameFormat.totalMinutes <= 0) {
        errors.push(`${block.ageGroupName} has invalid game duration`);
      }
      if (block.gameFormat.totalMinutes > 120) {
        errors.push(`${block.ageGroupName} game duration seems excessive (${block.gameFormat.totalMinutes} minutes)`);
      }
      if (block.estimatedFieldsNeeded > 20) {
        errors.push(`${block.ageGroupName} requires too many fields (${block.estimatedFieldsNeeded})`);
      }
    });

    if (timeBlocks.length === 0) {
      errors.push('No time blocks have been configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleComplete = () => {
    const validation = validateTimeBlocks();
    
    if (!validation.isValid) {
      onError(`Time block validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    const timeBlockData = {
      timeBlocks: timeBlocks.map(block => ({
        ageGroupId: block.ageGroupId,
        ageGroupName: block.ageGroupName,
        gameFormat: block.gameFormat,
        gamesPerField: block.gamesPerField,
        estimatedFieldsNeeded: block.estimatedFieldsNeeded
      })),
      tournamentSettings: {
        hoursPerDay,
        totalEstimatedFields: Math.max(...timeBlocks.map(b => b.estimatedFieldsNeeded)),
        totalGameTime: timeBlocks.reduce((sum, block) => sum + block.totalGameTime, 0)
      },
      summary: {
        totalAgeGroups: timeBlocks.length,
        averageGameLength: timeBlocks.reduce((sum, block) => sum + block.gameFormat.totalMinutes, 0) / timeBlocks.length,
        maxFieldsNeeded: Math.max(...timeBlocks.map(b => b.estimatedFieldsNeeded))
      }
    };

    onComplete(timeBlockData);
  };

  const selectedBlock = timeBlocks.find(block => block.ageGroupId === selectedAgeGroup);
  const totalFields = Math.max(...timeBlocks.map(b => b.estimatedFieldsNeeded));
  const totalGameHours = timeBlocks.reduce((sum, block) => sum + block.totalGameTime, 0) / 60;

  if (brackets.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No brackets found. Please complete the Bracket Creation step first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tournament Day Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hoursPerDay">Tournament Hours per Day</Label>
              <Input
                id="hoursPerDay"
                type="number"
                min="4"
                max="16"
                value={hoursPerDay}
                onChange={(e) => {
                  const newHours = parseInt(e.target.value);
                  setHoursPerDay(newHours);
                  // Recalculate all blocks
                  setTimeBlocks(prev => prev.map(block => {
                    const newGamesPerField = calculateGamesPerField(block.gameFormat.totalMinutes, newHours);
                    const totalGames = getTotalGamesForAgeGroup(block.ageGroupId);
                    return {
                      ...block,
                      gamesPerField: newGamesPerField,
                      estimatedFieldsNeeded: Math.ceil(totalGames / newGamesPerField)
                    };
                  }));
                }}
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{totalFields}</div>
              <div className="text-sm text-blue-800">Est. Fields Needed</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(totalGameHours)}</div>
              <div className="text-sm text-green-800">Total Game Hours</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age Group Selection & Format Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Game Format Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ageGroup">Select Age Group</Label>
              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose age group to configure" />
                </SelectTrigger>
                <SelectContent>
                  {timeBlocks.map(block => (
                    <SelectItem key={block.ageGroupId} value={block.ageGroupId}>
                      {block.ageGroupName} ({getTotalGamesForAgeGroup(block.ageGroupId)} games)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Format Presets</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {gameFormatPresets.map(preset => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => selectedAgeGroup && applyPreset(selectedAgeGroup, preset)}
                    disabled={!selectedAgeGroup}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Age Group Configuration */}
      {selectedBlock && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedBlock.ageGroupName} Game Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Game Timing Configuration */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="firstHalf">1st Half (minutes)</Label>
                  <Input
                    id="firstHalf"
                    type="number"
                    min="10"
                    max="45"
                    value={selectedBlock.gameFormat.firstHalfMinutes}
                    onChange={(e) => updateGameFormat(selectedAgeGroup, 'firstHalfMinutes', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="halftime">Halftime (minutes)</Label>
                  <Input
                    id="halftime"
                    type="number"
                    min="0"
                    max="15"
                    value={selectedBlock.gameFormat.halftimeMinutes}
                    onChange={(e) => updateGameFormat(selectedAgeGroup, 'halftimeMinutes', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="secondHalf">2nd Half (minutes)</Label>
                  <Input
                    id="secondHalf"
                    type="number"
                    min="10"
                    max="45"
                    value={selectedBlock.gameFormat.secondHalfMinutes}
                    onChange={(e) => updateGameFormat(selectedAgeGroup, 'secondHalfMinutes', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="buffer">Buffer (minutes)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    min="5"
                    max="30"
                    value={selectedBlock.gameFormat.bufferMinutes}
                    onChange={(e) => updateGameFormat(selectedAgeGroup, 'bufferMinutes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Calculated Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedBlock.gameFormat.totalMinutes}</div>
                  <div className="text-sm text-purple-800">Total Game Block</div>
                  <div className="text-xs text-purple-600">minutes per game</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">{selectedBlock.gamesPerField}</div>
                  <div className="text-sm text-amber-800">Games per Field</div>
                  <div className="text-xs text-amber-600">per {hoursPerDay}-hour day</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedBlock.estimatedFieldsNeeded}</div>
                  <div className="text-sm text-red-800">Fields Needed</div>
                  <div className="text-xs text-red-600">for this age group</div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Game Block Breakdown:</strong> {selectedBlock.gameFormat.firstHalfMinutes}min + {selectedBlock.gameFormat.halftimeMinutes}min + {selectedBlock.gameFormat.secondHalfMinutes}min + {selectedBlock.gameFormat.bufferMinutes}min buffer = {selectedBlock.gameFormat.totalMinutes} minutes total
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Block Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Time Block Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Age Group</TableHead>
                <TableHead>Game Format</TableHead>
                <TableHead>Total Minutes</TableHead>
                <TableHead>Games/Field/Day</TableHead>
                <TableHead>Total Games</TableHead>
                <TableHead>Fields Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeBlocks.map(block => (
                <TableRow key={block.ageGroupId}>
                  <TableCell className="font-medium">{block.ageGroupName}</TableCell>
                  <TableCell>
                    {block.gameFormat.firstHalfMinutes + block.gameFormat.secondHalfMinutes} min + {block.gameFormat.halftimeMinutes} HT + {block.gameFormat.bufferMinutes} buffer
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{block.gameFormat.totalMinutes} min</Badge>
                  </TableCell>
                  <TableCell>{block.gamesPerField}</TableCell>
                  <TableCell>{getTotalGamesForAgeGroup(block.ageGroupId)}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500 text-white">{block.estimatedFieldsNeeded}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Validation & Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Time Block Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeBlockValidation 
            timeBlocks={timeBlocks}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TimeBlockValidation({ timeBlocks, onComplete }: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  timeBlocks.forEach((block: TimeBlock) => {
    if (block.gameFormat.totalMinutes <= 0) {
      errors.push(`${block.ageGroupName} has invalid game duration`);
    }
    if (block.gameFormat.totalMinutes > 120) {
      warnings.push(`${block.ageGroupName} game duration is very long (${block.gameFormat.totalMinutes} minutes)`);
    }
    if (block.estimatedFieldsNeeded > 15) {
      warnings.push(`${block.ageGroupName} requires many fields (${block.estimatedFieldsNeeded})`);
    }
  });

  const isValid = errors.length === 0;

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration errors:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Warnings:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All time blocks are properly configured and ready for game creation.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {timeBlocks.length} age groups configured • {Math.max(...timeBlocks.map((b: TimeBlock) => b.estimatedFieldsNeeded))} fields estimated
        </div>
        <Button 
          onClick={onComplete}
          disabled={!isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Time Block Setup
        </Button>
      </div>
    </div>
  );
}