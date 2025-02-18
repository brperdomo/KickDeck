import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error fetching event:', errorData);
        throw new Error(errorData?.message || 'Failed to fetch event');
      }
      return response.json();
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      navigate("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive"
      });
    }
  };

  if (eventQuery.isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">Edit Event</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <EventForm
              initialData={eventQuery.data}
              onSubmit={handleSubmit}
              isEdit={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}