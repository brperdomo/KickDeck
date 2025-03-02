import { useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleVisualization } from "@/components/ScheduleVisualization";
import { DatePicker } from "@/components/ui/date-picker";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Game {
  id: string;
  startTime: string;
  endTime: string;
  fieldName: string;
  ageGroup: string;
  teamA: string;
  teamB: string;
}

interface AgeGroup {
  id: string;
  ageGroup: string;
  gender: string;
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("view");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await fetch("/api/admin/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
  });

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", selectedEventId, selectedDate],
    queryFn: async () => {
      if (!selectedEventId) return { games: [], ageGroups: [] };
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/admin/events/${selectedEventId}/schedule?date=${dateStr}`);
      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }
      return response.json();
    },
    enabled: !!selectedEventId,
  });

  const isLoading = eventsLoading || scheduleLoading;
  const games = scheduleData?.games || [];
  const ageGroups = scheduleData?.ageGroups || [];

  // Filter games by age group if one is selected
  const filteredGames = selectedAgeGroup 
    ? games.filter((game: Game) => game.ageGroup === selectedAgeGroup)
    : games;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Schedule Management</h2>
      </div>

      <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="view">View Schedule</TabsTrigger>
          <TabsTrigger value="generate">Generate Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">Select Event</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="">Select an event</option>
                    {events?.map((event: any) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">Select Date</label>
                  <DatePicker 
                    date={selectedDate} 
                    onSelect={setSelectedDate} 
                    className="w-full" 
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedEventId ? (
                filteredGames.length > 0 ? (
                  <ScheduleVisualization 
                    games={filteredGames}
                    ageGroups={ageGroups}
                    selectedAgeGroup={selectedAgeGroup}
                    onAgeGroupChange={setSelectedAgeGroup}
                    isLoading={isLoading}
                    date={selectedDate}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No games scheduled for this date.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Select an event to view its schedule.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">Select Event</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="">Select an event</option>
                    {events?.map((event: any) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-medium">Schedule Generation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Games Per Day</label>
                    <input type="number" className="w-full p-2 border rounded" min="1" max="20" defaultValue="8" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Minutes Per Game</label>
                    <input type="number" className="w-full p-2 border rounded" min="30" max="120" step="5" defaultValue="60" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Break Between Games (min)</label>
                    <input type="number" className="w-full p-2 border rounded" min="5" max="30" step="5" defaultValue="15" />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button disabled={!selectedEventId}>
                    Generate Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}