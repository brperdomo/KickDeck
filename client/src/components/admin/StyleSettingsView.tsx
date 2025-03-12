import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function StyleSettingsView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewStyles, setPreviewStyles] = useState({
    primary: '#000000',
    secondary: '#32CD32',
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
  const [settings, setSettings] = useState({
    primaryColor: '#1E40AF',
    secondaryColor: '#1C64F2',
    accentColor: '#3B82F6',
    logoUrl: '',
    navBackgroundColor: '#ffffff',
    navTextColor: '#1E293B',
    buttonStyle: 'rounded',
    fontFamily: 'Inter, sans-serif'
  });

  // Apply CSS styles to document head
  useEffect(() => {
    // Check if our custom style element already exists
    let styleElement = document.getElementById('admin-dashboard-styles');

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'admin-dashboard-styles';
      document.head.appendChild(styleElement);
    }

    // Apply the current styles
    styleElement.textContent = `
      :root {
        --color-primary: ${previewStyles.primary};
        --color-secondary: ${previewStyles.secondary};
        --color-accent: ${previewStyles.accent};
        --color-background: ${previewStyles.background};
        --admin-nav-bg: ${previewStyles.adminNavBackground};
        --admin-nav-text: ${previewStyles.adminNavText};
        --admin-nav-active: ${previewStyles.adminNavActive};
        --admin-nav-hover: ${previewStyles.adminNavHover};
      }
    `;

    return () => {
      // Clean up when component unmounts
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [previewStyles]);

  // Fetch current organization settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/organization/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            ...settings,
            primaryColor: data.primaryColor || settings.primaryColor,
            secondaryColor: data.secondaryColor || settings.secondaryColor,
            accentColor: data.accentColor || settings.accentColor,
            logoUrl: data.logoUrl || settings.logoUrl,
            navBackgroundColor: data.navBackgroundColor || settings.navBackgroundColor,
            navTextColor: data.navTextColor || settings.navTextColor,
            buttonStyle: data.buttonStyle || settings.buttonStyle,
            fontFamily: data.fontFamily || settings.fontFamily
          });

          // Also update preview styles
          setPreviewStyles({
            ...previewStyles,
            primary: data.primaryColor || previewStyles.primary,
            secondary: data.secondaryColor || previewStyles.secondary,
            accent: data.accentColor || previewStyles.accent,
            adminNavBackground: data.navBackgroundColor || previewStyles.adminNavBackground,
            adminNavText: data.navTextColor || previewStyles.adminNavText,
            adminNavActive: data.primaryColor || previewStyles.adminNavActive,
          });
        }
      } catch (error) {
        console.error('Error fetching organization settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });

    // Update preview in real-time
    if (name === 'primaryColor') {
      setPreviewStyles({...previewStyles, primary: value, adminNavActive: value});
    } else if (name === 'secondaryColor') {
      setPreviewStyles({...previewStyles, secondary: value});
    } else if (name === 'accentColor') {
      setPreviewStyles({...previewStyles, accent: value});
    } else if (name === 'navBackgroundColor') {
      setPreviewStyles({...previewStyles, adminNavBackground: value});
    } else if (name === 'navTextColor') {
      setPreviewStyles({...previewStyles, adminNavText: value});
    }
  };

  const handleSaveStyles = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/organization/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Style settings saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save style settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving style settings:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveStyles();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading style settings</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Style Settings</h2>
        <Button onClick={handleSaveStyles} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Live Preview</h3>
                <p className="text-sm text-gray-500">This is how your color scheme will look</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex mt-1">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={handleInputChange}
                      className="w-12 p-1 h-10"
                    />
                    <Input
                      name="primaryColor"
                      value={settings.primaryColor}
                      onChange={handleInputChange}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex mt-1">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={handleInputChange}
                      className="w-12 p-1 h-10"
                    />
                    <Input
                      name="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={handleInputChange}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex mt-1">
                    <Input
                      id="accentColor"
                      name="accentColor"
                      type="color"
                      value={settings.accentColor}
                      onChange={handleInputChange}
                      className="w-12 p-1 h-10"
                    />
                    <Input
                      name="accentColor"
                      value={settings.accentColor}
                      onChange={handleInputChange}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="navBackgroundColor">Navigation Background</Label>
                  <div className="flex mt-1">
                    <Input
                      id="navBackgroundColor"
                      name="navBackgroundColor"
                      type="color"
                      value={settings.navBackgroundColor}
                      onChange={handleInputChange}
                      className="w-12 p-1 h-10"
                    />
                    <Input
                      name="navBackgroundColor"
                      value={settings.navBackgroundColor}
                      onChange={handleInputChange}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="navTextColor">Navigation Text</Label>
                  <div className="flex mt-1">
                    <Input
                      id="navTextColor"
                      name="navTextColor"
                      type="color"
                      value={settings.navTextColor}
                      onChange={handleInputChange}
                      className="w-12 p-1 h-10"
                    />
                    <Input
                      name="navTextColor"
                      value={settings.navTextColor}
                      onChange={handleInputChange}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    value={settings.logoUrl}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter logo URL"
                  />
                </div>
              </div>

              {/* Preview Panel */}
              <div className="border rounded-md p-4 bg-slate-50">
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">Color Preview</div>
                  <div className="flex flex-wrap gap-2">
                    <div 
                      className="h-12 w-12 rounded-md border shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: settings.primaryColor }}
                      title="Primary Color"
                    >
                      <span style={{ color: '#fff' }}>P</span>
                    </div>
                    <div 
                      className="h-12 w-12 rounded-md border shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: settings.secondaryColor }}
                      title="Secondary Color"
                    >
                      <span style={{ color: '#fff' }}>S</span>
                    </div>
                    <div 
                      className="h-12 w-12 rounded-md border shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: settings.accentColor }}
                      title="Accent Color"
                    >
                      <span style={{ color: '#fff' }}>A</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-lg font-semibold mb-2">Navigation Preview</div>
                  <div 
                    className="h-16 rounded-md border shadow-sm p-2 flex items-center mb-2"
                    style={{ backgroundColor: settings.navBackgroundColor }}
                  >
                    <div 
                      className="h-10 w-10 rounded-full mr-2 flex items-center justify-center"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <span style={{ color: '#fff' }}>Logo</span>
                    </div>
                    <div 
                      className="flex space-x-4"
                      style={{ color: settings.navTextColor }}
                    >
                      <span className="cursor-pointer">Dashboard</span>
                      <span className="cursor-pointer font-semibold" style={{ color: settings.primaryColor }}>Events</span>
                      <span className="cursor-pointer">Settings</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-lg font-semibold mb-2">Button Preview</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      Secondary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: settings.accentColor }}
                    >
                      Accent Button
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StyleSettingsView;