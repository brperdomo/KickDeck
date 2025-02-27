import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type EventTab, TAB_ORDER } from "@/components/forms/event-form-types";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

interface EventFormData {
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
  applicationDeadline: string;
  details?: string;
  agreement?: string;
  refundPolicy?: string;
  selectedAgeGroupIds: number[];
  seasonalScopeId: number;
}

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<number[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState<number | null>(null);

  // Query event data
  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/edit`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch event');
      }
      const data = await response.json();

      // Initialize selected age groups and scope
      if (data.ageGroups?.length > 0) {
        setSelectedAgeGroupIds(data.ageGroups.map((group: any) => group.id));
        setSelectedScopeId(data.seasonalScopeId);
      }

      return data;
    }
  });

  // Query seasonal scopes
  const seasonalScopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          selectedAgeGroupIds,
          seasonalScopeId: selectedScopeId
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update event: ${errorData || response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  if (eventQuery.isLoading || seasonalScopesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (eventQuery.error || seasonalScopesQuery.error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive space-y-4">
                <p>Failed to load event details</p>
                <Button onClick={() => navigate("/admin")}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: EventFormData) => {
    try {
      await updateEventMutation.mutateAsync({
        ...formData,
        selectedAgeGroupIds,
        seasonalScopeId: selectedScopeId!
      });
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Edit Event</h1>
            </div>

            <ProgressIndicator
              steps={TAB_ORDER}
              currentStep={activeTab}
              completedSteps={completedTabs}
            />

            <div className="space-y-6">
              <div>
                <Label>Select Seasonal Scope</Label>
                <Select
                  value={selectedScopeId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedScopeId(parseInt(value));
                    setSelectedAgeGroupIds([]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a seasonal scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonalScopesQuery.data?.map((scope: any) => (
                      <SelectItem key={scope.id} value={scope.id.toString()}>
                        {scope.name} ({scope.startYear}-{scope.endYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedScopeId && (
                <div className="border rounded-lg p-4 mt-4">
                  <div className="mb-4">
                    <Checkbox
                      id="select-all"
                      checked={
                        selectedAgeGroupIds.length ===
                        seasonalScopesQuery.data?.find((s: any) => s.id === selectedScopeId)?.ageGroups.length
                      }
                      onCheckedChange={(checked) => {
                        const scope = seasonalScopesQuery.data?.find((s: any) => s.id === selectedScopeId);
                        if (!scope) return;
                        setSelectedAgeGroupIds(checked ? scope.ageGroups.map((g: any) => g.id) : []);
                      }}
                    />
                    <Label htmlFor="select-all" className="ml-2">Select All Age Groups</Label>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Age Group</TableHead>
                        <TableHead>Birth Year</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Division Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seasonalScopesQuery.data
                        ?.find((s: any) => s.id === selectedScopeId)
                        ?.ageGroups.map((group: any) => (
                          <TableRow key={group.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAgeGroupIds.includes(group.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedAgeGroupIds(prev =>
                                    checked
                                      ? [...prev, group.id]
                                      : prev.filter(id => id !== group.id)
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>{group.ageGroup}</TableCell>
                            <TableCell>{group.birthYear}</TableCell>
                            <TableCell>{group.gender}</TableCell>
                            <TableCell>{group.divisionCode}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSubmit(eventQuery.data)}
                  disabled={updateEventMutation.isPending}
                >
                  {updateEventMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}