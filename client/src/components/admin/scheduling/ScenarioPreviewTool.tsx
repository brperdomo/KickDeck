import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sliders, Clock, MapPin, Users, Calendar, Target,
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle
} from "lucide-react";

interface ScenarioPreviewToolProps {
  eventId: string;
  baselineData: any;
  onScenarioSelect?: (scenario: any) => void;
}

interface ScenarioParams {
  bufferTime: number;
  gameDuration: number;
  fieldCount: number;
  operatingHours: number;
  restPeriod: number;
}

interface ScenarioResult {
  feasible: boolean;
  totalGames: number;
  requiredTimeSlots: number;
  availableTimeSlots: number;
  utilizationRate: number;
  compressionRatio: number;
  estimatedDays: number;
  warnings: string[];
}

export function ScenarioPreviewTool({ eventId, baselineData, onScenarioSelect }: ScenarioPreviewToolProps) {
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    bufferTime: 15,
    gameDuration: 90,
    fieldCount: 4,
    operatingHours: 12,
    restPeriod: 60
  });

  const [scenarios, setScenarios] = useState<{[key: string]: ScenarioResult}>({});
  const [currentScenario, setCurrentScenario] = useState<ScenarioResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize with baseline parameters
  useEffect(() => {
    if (baselineData) {
      setScenarioParams({
        bufferTime: baselineData.gameMetadata?.bufferTime || 15,
        gameDuration: baselineData.gameMetadata?.gameDuration || 90,
        fieldCount: baselineData.fields?.length || 4,
        operatingHours: 12,
        restPeriod: baselineData.gameMetadata?.restPeriod || 60
      });
    }
  }, [baselineData]);

  // Recalculate scenarios when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateScenario(scenarioParams);
    }, 300); // Debounce calculations

    return () => clearTimeout(timeoutId);
  }, [scenarioParams]);

  const calculateScenario = async (params: ScenarioParams) => {
    setIsCalculating(true);
    
    try {
      // Enhanced real-time scenario calculation with What-If analysis
      const scenarioKey = JSON.stringify(params);
      
      // Calculate feasibility metrics for current scenario
      const result = calculateScenarioMetrics(params);
      
      // Store scenario result for comparison
      setScenarios(prev => ({
        ...prev,
        [scenarioKey]: result
      }));
      
      setCurrentScenario(result);
      
    } catch (error) {
      console.error('Scenario calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateScenarioMetrics = (params: ScenarioParams): ScenarioResult => {
    // Enhanced scenario calculation with comprehensive metrics
    const totalTeams = baselineData?.teams?.length || 0;
    const estimatedGamesPerTeam = 4;
    const totalGames = Math.ceil(totalTeams * estimatedGamesPerTeam / 2);
    
    // Calculate time slot availability
    const gameTimeTotal = params.gameDuration + params.bufferTime; // minutes
    const gamesPerFieldPerHour = 60 / gameTimeTotal;
    const gamesPerFieldPerDay = gamesPerFieldPerHour * params.operatingHours;
    const totalDailyCapacity = gamesPerFieldPerDay * params.fieldCount;
    
    // Feasibility assessment
    const requiredTimeSlots = totalGames;
    const availableTimeSlots = totalDailyCapacity;
    const utilizationRate = (requiredTimeSlots / availableTimeSlots) * 100;
    const compressionRatio = Math.max(requiredTimeSlots / availableTimeSlots, 1);
    const estimatedDays = Math.ceil(requiredTimeSlots / totalDailyCapacity);
    
    // Generate warnings and insights
    const warnings = [];
    if (utilizationRate > 90) {
      warnings.push('High field utilization - risk of scheduling conflicts');
    }
    if (params.restPeriod < 30) {
      warnings.push('Short rest period may cause team fatigue');
    }
    if (params.fieldCount < 2) {
      warnings.push('Single field creates scheduling bottleneck');
    }
    if (estimatedDays > 3) {
      warnings.push('Tournament may extend beyond typical weekend format');
    }
    
    return {
      feasible: utilizationRate <= 100,
      totalGames,
      requiredTimeSlots,
      availableTimeSlots: Math.floor(availableTimeSlots),
      utilizationRate: Math.min(utilizationRate, 100),
      compressionRatio,
      estimatedDays,
      warnings
    };
  };

  const simulateScenarioImpact = async (params: ScenarioParams): Promise<ScenarioResult> => {
    // This would normally call the backend for complex simulation
    return calculateScenarioMetrics(params);
  };



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Scenario Preview & What-If Analysis
          </CardTitle>
          <p className="text-muted-foreground">
            Test different scheduling parameters to see their impact on tournament feasibility.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Parameter Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Game Duration (min)</Label>
                <Input
                  type="number"
                  value={scenarioParams.gameDuration}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    gameDuration: parseInt(e.target.value) || 90
                  }))}
                  min="30"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label>Buffer Time (min)</Label>
                <Input
                  type="number"
                  value={scenarioParams.bufferTime}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    bufferTime: parseInt(e.target.value) || 15
                  }))}
                  min="5"
                  max="30"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Count</Label>
                <Input
                  type="number"
                  value={scenarioParams.fieldCount}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    fieldCount: parseInt(e.target.value) || 2
                  }))}
                  min="1"
                  max="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <Input
                  type="number"
                  value={scenarioParams.operatingHours}
                  onChange={(e) => setScenarioParams(prev => ({
                    ...prev,
                    operatingHours: parseInt(e.target.value) || 12
                  }))}
                  min="6"
                  max="16"
                />
              </div>
            </div>

            {/* Scenario Results */}
            {currentScenario && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${currentScenario.feasible ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${currentScenario.feasible ? 'text-green-600' : 'text-red-600'}`}>
                      {currentScenario.feasible ? 'Feasible' : 'Not Feasible'}
                    </div>
                    <div className={`text-sm ${currentScenario.feasible ? 'text-green-600' : 'text-red-600'}`}>
                      Tournament Status
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentScenario.utilizationRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-600">Field Utilization</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {currentScenario.estimatedDays}
                    </div>
                    <div className="text-sm text-purple-600">Estimated Days</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {currentScenario.compressionRatio.toFixed(2)}x
                    </div>
                    <div className="text-sm text-orange-600">Compression Ratio</div>
                  </div>
                </div>

                {/* Warnings */}
                {currentScenario.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">Scenario Warnings:</div>
                        {currentScenario.warnings.map((warning, index) => (
                          <div key={index} className="text-sm">• {warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}