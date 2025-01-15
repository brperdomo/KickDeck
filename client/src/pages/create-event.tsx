import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>('information');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Create Event</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EventTab)}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-6 gap-4">
              <TabsTrigger value="information">Event Information</TabsTrigger>
              <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
              <TabsTrigger value="scoring">Scoring Settings</TabsTrigger>
              <TabsTrigger value="complexes">Complexes & Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="administrators">Administrators</TabsTrigger>
            </TabsList>

            <TabsContent value="information">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Information</h3>
                {/* Event information form will be implemented here */}
              </div>
            </TabsContent>

            <TabsContent value="age-groups">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Age Groups</h3>
                {/* Age groups configuration will be implemented here */}
              </div>
            </TabsContent>

            <TabsContent value="scoring">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Scoring Settings</h3>
                {/* Scoring settings form will be implemented here */}
              </div>
            </TabsContent>

            <TabsContent value="complexes">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Complexes and Fields</h3>
                {/* Complexes and fields management will be implemented here */}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Settings</h3>
                {/* Event settings form will be implemented here */}
              </div>
            </TabsContent>

            <TabsContent value="administrators">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Administrators</h3>
                {/* Administrators management will be implemented here */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
