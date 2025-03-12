import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";

export function StyleSettingsView() {
  const { settings, updateSettings } = useOrganizationSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewStyles, setPreviewStyles] = useState({
    primary: settings?.primaryColor || '#000000',
    secondary: settings?.secondaryColor || '#32CD32',
    accent: '#FF8C00',
    background: '#F5F5F6',
    adminNavBackground: '#FFFFFF',
    adminNavText: '#000000',
    adminNavActive: '#000000',
    adminNavHover: '#f3f4f6',
    tableHeaderBg: "#f9fafb",
    tableRowHoverBg: "#f3f4f6",
    cardBg: "#FFFFFF",
    cardHeaderBg: "#f9fafb",
    inputBg: "#FFFFFF",
    inputBorder: "#d1d5db",
  });
  const { toast } = useToast();

  // Apply CSS styles to document head
  useEffect(() => {
    // Check if our custom style element already exists
    let styleElement = document.getElementById('admin-dashboard-styles');

    if (!styleElement) {
      // Create it if it doesn't exist
      styleElement = document.createElement('style');
      styleElement.id = 'admin-dashboard-styles';
      document.head.appendChild(styleElement);
    }

    // Update the style content
    styleElement.textContent = `
      :root {
        --color-primary: ${previewStyles.primary};
        --color-secondary: ${previewStyles.secondary};
        --color-accent: ${previewStyles.accent};
        --color-background: ${previewStyles.background};
      }
    `;

    return () => {
      // Clean up when component unmounts
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [previewStyles]);

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setPreviewStyles(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        primaryColor: previewStyles.primary,
        secondaryColor: previewStyles.secondary,
      });

      toast({
        title: "Success",
        description: "Style settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving style settings:", error);
      toast({
        title: "Error",
        description: "Failed to update style settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>UI Styling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary">Primary Color</Label>
            <div className="flex gap-2">
              <Input 
                id="primary" 
                name="primary"
                value={previewStyles.primary} 
                onChange={handleColorChange}
              />
              <input 
                type="color" 
                name="primary"
                value={previewStyles.primary} 
                onChange={handleColorChange}
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary">Secondary Color</Label>
            <div className="flex gap-2">
              <Input 
                id="secondary" 
                name="secondary"
                value={previewStyles.secondary} 
                onChange={handleColorChange}
              />
              <input 
                type="color" 
                name="secondary"
                value={previewStyles.secondary} 
                onChange={handleColorChange}
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Preview</h3>
          <div className="grid gap-4">
            <div className="p-4 rounded" style={{ backgroundColor: previewStyles.primary, color: 'white' }}>
              Primary Color
            </div>
            <div className="p-4 rounded" style={{ backgroundColor: previewStyles.secondary, color: 'white' }}>
              Secondary Color
            </div>
            <div className="p-4 border rounded">
              <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: previewStyles.primary }}>
                Primary Button
              </button>
              <button className="px-4 py-2 rounded text-white ml-2" style={{ backgroundColor: previewStyles.secondary }}>
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}