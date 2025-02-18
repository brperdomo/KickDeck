import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Plus, Minus, Edit, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ComplexSelector } from "@/components/events/ComplexSelector";
import { Checkbox } from "@/components/ui/checkbox";
import type { EventTab, AgeGroup, Complex, Field, FieldSize } from "@/components/forms/event-form-types";
import { TAB_ORDER } from "@/components/forms/event-form-types";

const ProgressIndicator = ({ tabs, completedTabs }: { tabs: EventTab[], completedTabs: EventTab[] }) => {
  return (
    <div className="flex justify-center mb-6">
      {tabs.map((tab, index) => (
        <div key={tab} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center
              ${completedTabs.includes(tab) ? 'bg-[#43A047] text-white' : 'bg-gray-300'}
            `}
          >
            {index + 1}
          </div>
          {index < tabs.length - 1 && (
            <div className={`w-4 h-px bg-gray-300 ${completedTabs.includes(tab) ? 'bg-[#43A047]' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const [selectedComplexes, setSelectedComplexes] = useState<Complex[]>([]);
  const [viewingComplexId, setViewingComplexId] = useState<number | null>(null);
  const [eventFieldSizes, setEventFieldSizes] = useState<Record<number, FieldSize>>({});
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>([]);

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch event');
      }
      const data = await response.json();

      // Initialize state with existing data
      if (data.complexes) {
        setSelectedComplexes(data.complexes);
        setSelectedComplexIds(data.complexes.map((c: Complex) => c.id));
      }
      if (data.fieldSizes) {
        setEventFieldSizes(data.fieldSizes);
      }

      return data;
    },
  });

  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes',
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json() as Promise<Complex[]>;
    }
  });

  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/fields', viewingComplexId],
    enabled: !!viewingComplexId,
    queryFn: async () => {
      if (!viewingComplexId) return [];
      const response = await fetch(`/api/admin/complexes/${viewingComplexId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json() as Promise<Field[]>;
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          complexes: selectedComplexes,
          fieldSizes: eventFieldSizes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    }
  });

  const navigateTab = (direction: 'next' | 'prev') => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (direction === 'next' && currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1]);
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

  const renderComplexTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateTab('prev')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h3 className="text-lg font-semibold">Select Complexes for Event</h3>
        </div>
        <Button variant="outline" onClick={() => navigateTab('next')}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ComplexSelector
            selectedComplexes={selectedComplexes.map(complex => complex.id)}
            onComplexSelect={(ids) => {
              const selectedComplexData = complexesQuery.data?.filter(complex =>
                ids.includes(complex.id)
              ) || [];
              setSelectedComplexes(selectedComplexData);
              setSelectedComplexIds(ids);
            }}
          />
        </CardContent>
      </Card>

      {selectedComplexes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {selectedComplexes.map((complex) => (
            <Card key={complex.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold">{complex.name}</h4>
                  <p className="text-sm text-gray-500">{complex.address}</p>
                  <p className="text-sm text-gray-500">{complex.city}, {complex.state}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingComplexId(complex.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge variant={complex.isOpen ? "outline" : "destructive"}>
                  {complex.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

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
            <ProgressIndicator tabs={TAB_ORDER} completedTabs={completedTabs} />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventTab)}>
              <TabsList className="grid w-full grid-cols-6 mb-6">
                {TAB_ORDER.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="capitalize">
                    {tab.replace('-', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="information">
                {/* Information tab content */}
              </TabsContent>

              <TabsContent value="age-groups">
                {/* Age groups tab content */}
              </TabsContent>

              <TabsContent value="scoring">
                {/* Scoring tab content */}
              </TabsContent>

              <TabsContent value="complexes">
                {renderComplexTab()}
              </TabsContent>

              <TabsContent value="settings">
                {/* Settings tab content */}
              </TabsContent>

              <TabsContent value="administrators">
                {/* Administrators tab content */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}