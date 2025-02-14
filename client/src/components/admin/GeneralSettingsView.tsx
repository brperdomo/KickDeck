import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";
import { BrandingPreviewProvider } from "@/hooks/use-branding-preview";

export function GeneralSettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General Settings</h2>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Scope</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <BrandingPreviewProvider>
            <div className="grid md:grid-cols-2 gap-6">
              <OrganizationSettingsForm />
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="h-full w-full flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                          Preview will be shown here
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </BrandingPreviewProvider>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal">
          <SeasonalScopeSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}