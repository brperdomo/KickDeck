
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define interfaces for the component props and event data
interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  applicationDeadline?: string;
  details?: string;
  ageGroups?: Array<{
    id: string;
    gender: string;
    ageGroup: string;
  }>;
}

export default function EventDetailsPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const [, navigate] = useLocation();
  const eventId = params.id;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEvent(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const renderAgeGroups = (ageGroups) => {
    if (!ageGroups || ageGroups.length === 0) {
      return <p>No age groups specified</p>;
    }

    // Group by gender
    const groupedByGender = ageGroups.reduce((acc, group) => {
      const gender = group.gender || 'Unknown';
      if (!acc[gender]) {
        acc[gender] = [];
      }
      acc[gender].push(group);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        {Object.entries(groupedByGender).map(([gender, groups]) => (
          <div key={gender} className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">{gender}:</h4>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <span key={group.id} className="bg-white px-3 py-1 rounded-full text-sm text-blue-600">
                  {group.ageGroup}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600">Event Not Found</h2>
            <p className="mt-2 text-gray-600">This event may have been removed or is no longer available.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/events")}
            >
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Card className="shadow-md overflow-hidden border-0">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-2xl">{event.name}</CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-700">Event Dates</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-700">Location</h3>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}
                
                {event.applicationDeadline && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-700">Registration Deadline</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(event.applicationDeadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {event.ageGroups && event.ageGroups.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="w-full">
                      <h3 className="font-medium text-gray-700">Age Groups</h3>
                      {renderAgeGroups(event.ageGroups)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {event.details && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">Event Details</h3>
                <div 
                  className="prose max-w-none text-gray-600" 
                  dangerouslySetInnerHTML={{ __html: event.details }} 
                />
              </div>
            )}
            
            <div className="flex justify-center pt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(`/events/${event.id}/apply`)}
              >
                Register for Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
