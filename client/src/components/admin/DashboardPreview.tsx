
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  domain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

export function DashboardPreview() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/organizations");
        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await response.json();
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id.toString());
          setSelectedOrg(data[0]);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      const org = organizations.find(o => o.id.toString() === selectedOrgId);
      setSelectedOrg(org || null);
      
      // In a real implementation, you might generate a preview URL based on the domain
      // For now, we'll just create a mock URL
      if (org?.domain) {
        setPreviewUrl(`https://${org.domain}.matchpro.ai`);
      } else {
        setPreviewUrl(`https://app.matchpro.ai`);
      }
    }
  }, [selectedOrgId, organizations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No organizations found. Create an organization to see a preview.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="organization">Select Organization</Label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>
                  {org.name} {org.domain ? `(${org.domain}.matchpro.ai)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedOrg && (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <div className="h-14 flex items-center px-4" style={{ backgroundColor: selectedOrg.primaryColor, color: "#fff" }}>
                {selectedOrg.logoUrl && (
                  <img 
                    src={selectedOrg.logoUrl} 
                    alt={`${selectedOrg.name} logo`} 
                    className="h-8 mr-3"
                  />
                )}
                <span className="font-bold">{selectedOrg.name} Dashboard</span>
              </div>
              <div className="p-4 bg-card">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-background">
                    <h3 className="font-medium mb-2">Events</h3>
                    <div className="h-24 rounded bg-muted/50 flex items-center justify-center">
                      Events list placeholder
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 bg-background">
                    <h3 className="font-medium mb-2">Analytics</h3>
                    <div className="h-24 rounded bg-muted/50 flex items-center justify-center">
                      Analytics chart placeholder
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button style={{ backgroundColor: selectedOrg.secondaryColor, color: "#fff" }}>
                    Action Button
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/10">
              <h3 className="font-medium mb-2">Domain Preview</h3>
              <div className="flex items-center space-x-2">
                <div className="font-mono text-sm">{previewUrl}</div>
                <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, '_blank')}>
                  Open Preview
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Note: This is a preview URL. The actual site may not be live yet.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
