
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import EventForm from "@/components/forms/EventForm";

type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';
const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

export default function EditEventPage() {
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params.id;

  const eventQuery = useQuery({
    queryKey: [`/api/events/${eventId}/edit`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/edit`);
      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }
      const data = await response.json();
      console.log('Fetched event data:', data);
      return data;
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }
      
      return response.json();
    },
    onSuccess: () => {
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

  const handleSubmit = async (data: any) => {
    try {
      await updateEventMutation.mutateAsync(data);
      navigate("/admin");
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Loading event details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (eventQuery.error) {
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

  const eventData = {
    ...eventQuery.data,
    complexFieldSizes: eventQuery.data.complexFieldSizes || {},
    ageGroups: eventQuery.data.ageGroups?.map(group => ({
      ...group,
      selected: true, // Mark existing age groups as selected
      feeId: group.feeId // Ensure feeId is included from the server response
    })) || [],
    scoringRules: eventQuery.data.scoringRules || [],
    selectedComplexIds: eventQuery.data.selectedComplexIds || [],
    branding: eventQuery.data.branding || {
      logoUrl: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff"
    }
  };

  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < TAB_ORDER.length) {
      setActiveTab(TAB_ORDER[newIndex]);
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

            <EventForm 
              mode="edit"
              defaultValues={eventData}
              onSubmit={handleSubmit}
              isSubmitting={updateEventMutation.isPending}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              completedTabs={completedTabs}
              onCompletedTabsChange={setCompletedTabs}
              navigateTab={navigateTab}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
