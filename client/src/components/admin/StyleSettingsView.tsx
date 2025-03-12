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

  // Apply CSS styles to document head
  useEffect(() => {
    // Check if our custom style element already exists
    let styleElement = document.getElementById('admin-dashboard-styles');

    // Create it if it doesn't exist
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'admin-dashboard-styles';
      document.head.appendChild(styleElement);
    }
    
    // Update CSS variables for admin navigation
    styleElement.innerHTML = `
      :root {
        --admin-nav-bg: ${previewStyles.adminNavBackground || '#FFFFFF'};
        --admin-nav-text: ${previewStyles.adminNavText || '#000000'};
        --admin-nav-active: ${previewStyles.adminNavActive || '#E6F7FF'};
        --admin-nav-hover: ${previewStyles.adminNavHover || '#f3f4f6'};
      }
      
      .admin-sidebar-item {
        transition: background-color 0.2s ease;
      }
      
      .admin-sidebar-item:hover {
        background-color: var(--admin-nav-hover) !important;
      }
      
      .admin-sidebar-item.active {
        background-color: var(--admin-nav-active) !important;
      }
    `;

    // Update the CSS variables
    styleElement.textContent = `
      :root {
        --admin-nav-bg: ${previewStyles.adminNavBackground || '#FFFFFF'};
        --admin-nav-text: ${previewStyles.adminNavText || '#000000'};
        --admin-nav-active: ${previewStyles.adminNavActive || previewStyles.primary || '#000000'};
        --admin-nav-hover: ${previewStyles.adminNavHover || '#f3f4f6'};
        --table-header-bg: ${previewStyles.tableHeaderBg || "#f9fafb"};
        --table-row-hover-bg: ${previewStyles.tableRowHoverBg || "#f3f4f6"};
        --card-bg: ${previewStyles.cardBg || "#FFFFFF"};
        --card-header-bg: ${previewStyles.cardHeaderBg || "#f9fafb"};
        --input-bg: ${previewStyles.inputBg || "#FFFFFF"};
        --input-border: ${previewStyles.inputBorder || "#d1d5db"};

      }
    `;
  }, [previewStyles]);

  useEffect(() => {
    const fetchStylingSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/styling');
        if (response.ok) {
          const data = await response.json();
          setPreviewStyles(data);
        } else {
          console.error('Failed to fetch styling settings');
        }
      } catch (error) {
        console.error('Error fetching styling settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStylingSettings();
  }, []);

  const handleStyleChange = (key, value) => {
    setPreviewStyles(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveStyles = async () => {
    setIsSaving(true);
    try {
      // Make sure we include all style settings
      const completeStyles = {
        ...previewStyles,
        // Ensure the admin dashboard specific colors are included
        adminNavBackground: previewStyles.adminNavBackground || '#FFFFFF',
        adminNavText: previewStyles.adminNavText || '#000000',
        adminNavActive: previewStyles.adminNavActive || previewStyles.primary || '#000000',
        adminNavHover: previewStyles.adminNavHover || '#f3f4f6',
        tableHeaderBg: previewStyles.tableHeaderBg || "#f9fafb",
        tableRowHoverBg: previewStyles.tableRowHoverBg || "#f3f4f6",
        cardBg: previewStyles.cardBg || "#FFFFFF",
        cardHeaderBg: previewStyles.cardHeaderBg || "#f9fafb",
        inputBg: previewStyles.inputBg || "#FFFFFF",
        inputBorder: previewStyles.inputBorder || "#d1d5db",
      };

      console.log('Saving complete style settings:', completeStyles);

      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeStyles),
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
      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <h3 className="text-lg font-medium mb-4">Color Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="primaryColor"
                  type="color"
                  value={previewStyles.primary || "#000000"}
                  onChange={(e) => handleStyleChange('primary', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.primary || "#000000"}
                onChange={(e) => handleStyleChange('primary', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for primary buttons and important UI elements</p>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={previewStyles.secondary || "#000000"}
                  onChange={(e) => handleStyleChange('secondary', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.secondary || "#000000"}
                onChange={(e) => handleStyleChange('secondary', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for secondary buttons and accents</p>
          </div>

          <div>
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="accentColor"
                  type="color"
                  value={previewStyles.accent || "#000000"}
                  onChange={(e) => handleStyleChange('accent', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.accent || "#000000"}
                onChange={(e) => handleStyleChange('accent', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for highlighted items and hover states</p>
          </div>

          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={previewStyles.background || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('background', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.background || "#FFFFFF"}
                onChange={(e) => handleStyleChange('background', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Used for page backgrounds</p>
          </div>
        </div>
      </div>

      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <h3 className="text-lg font-medium mb-4">Admin Dashboard Colors</h3>
        <p className="text-sm text-gray-500 mb-4">These colors control the appearance of the admin dashboard navigation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="adminNavBgColor">Navigation Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavBgColor"
                  type="color"
                  value={previewStyles.adminNavBackground || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminNavBackground', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavBackground || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminNavBackground', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color of the admin sidebar</p>
          </div>

          <div>
            <Label htmlFor="adminSectionBg">Admin Section Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminSectionBg"
                  type="color"
                  value={previewStyles.adminSectionBg || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('adminSectionBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminSectionBg || "#FFFFFF"}
                onChange={(e) => handleStyleChange('adminSectionBg', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color of admin sections and cards</p>
          </div>

          <div>
            <Label htmlFor="adminNavTextColor">Navigation Text</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavTextColor"
                  type="color"
                  value={previewStyles.adminNavText || "#000000"}
                  onChange={(e) => handleStyleChange('adminNavText', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavText || "#000000"}
                onChange={(e) => handleStyleChange('adminNavText', e.target.value)}
                className="font-mono"
                placeholder="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Text color for sidebar navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavActiveColor">Navigation Active</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavActiveColor"
                  type="color"
                  value={previewStyles.adminNavActive || "#E6F7FF"}
                  onChange={(e) => handleStyleChange('adminNavActive', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavActive || "#E6F7FF"}
                onChange={(e) => handleStyleChange('adminNavActive', e.target.value)}
                className="font-mono"
                placeholder="#E6F7FF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color of the active/selected navigation item</p>
          </div>
          
          <div>
            <Label htmlFor="adminNavHoverColor">Navigation Hover</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavHoverColor"
                  type="color"
                  value={previewStyles.adminNavHover || "#f3f4f6"}
                  onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavHover || "#f3f4f6"}
                onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                className="font-mono"
                placeholder="#f3f4f6"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color when hovering over navigation items</p>
          </div>

          <div>
            <Label htmlFor="adminNavHoverColor">Navigation Hover</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="adminNavHoverColor"
                  type="color"
                  value={previewStyles.adminNavHover || "#F5F5F5"}
                  onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.adminNavHover || "#F5F5F5"}
                onChange={(e) => handleStyleChange('adminNavHover', e.target.value)}
                className="font-mono"
                placeholder="#F5F5F5"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color when hovering over navigation items</p>
          </div>
        </div>
      </div>

      <div 
        className="p-4 rounded-md shadow mb-6" 
        style={{ backgroundColor: previewStyles.adminSectionBg || "#FFFFFF" }}
      >
        <h3 className="text-lg font-medium mb-4">Table & Card Styling</h3>
        <p className="text-sm text-gray-500 mb-4">Customize the appearance of tables, cards and form elements.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="tableHeaderBg">Table Header Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="tableHeaderBg"
                  type="color"
                  value={previewStyles.tableHeaderBg || "#f9fafb"}
                  onChange={(e) => handleStyleChange('tableHeaderBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.tableHeaderBg || "#f9fafb"}
                onChange={(e) => handleStyleChange('tableHeaderBg', e.target.value)}
                className="font-mono"
                placeholder="#f9fafb"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for table headers</p>
          </div>

          <div>
            <Label htmlFor="tableRowHoverBg">Table Row Hover</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="tableRowHoverBg"
                  type="color"
                  value={previewStyles.tableRowHoverBg || "#f3f4f6"}
                  onChange={(e) => handleStyleChange('tableRowHoverBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.tableRowHoverBg || "#f3f4f6"}
                onChange={(e) => handleStyleChange('tableRowHoverBg', e.target.value)}
                className="font-mono"
                placeholder="#f3f4f6"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color when hovering over table rows</p>
          </div>

          <div>
            <Label htmlFor="cardBg">Card Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="cardBg"
                  type="color"
                  value={previewStyles.cardBg || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('cardBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.cardBg || "#FFFFFF"}
                onChange={(e) => handleStyleChange('cardBg', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for cards</p>
          </div>

          <div>
            <Label htmlFor="cardHeaderBg">Card Header Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="cardHeaderBg"
                  type="color"
                  value={previewStyles.cardHeaderBg || "#f9fafb"}
                  onChange={(e) => handleStyleChange('cardHeaderBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.cardHeaderBg || "#f9fafb"}
                onChange={(e) => handleStyleChange('cardHeaderBg', e.target.value)}
                className="font-mono"
                placeholder="#f9fafb"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for card headers</p>
          </div>

          <div>
            <Label htmlFor="inputBg">Input Background</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="inputBg"
                  type="color"
                  value={previewStyles.inputBg || "#FFFFFF"}
                  onChange={(e) => handleStyleChange('inputBg', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.inputBg || "#FFFFFF"}
                onChange={(e) => handleStyleChange('inputBg', e.target.value)}
                className="font-mono"
                placeholder="#FFFFFF"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Background color for form inputs</p>
          </div>

          <div>
            <Label htmlFor="inputBorder">Input Border</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-12 h-12 rounded-md border overflow-hidden">
                <Input
                  id="inputBorder"
                  type="color"
                  value={previewStyles.inputBorder || "#d1d5db"}
                  onChange={(e) => handleStyleChange('inputBorder', e.target.value)}
                  className="w-16 h-16 transform scale-150 -translate-x-2 -translate-y-2 cursor-pointer"
                />
              </div>
              <Input
                value={previewStyles.inputBorder || "#d1d5db"}
                onChange={(e) => handleStyleChange('inputBorder', e.target.value)}
                className="font-mono"
                placeholder="#d1d5db"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Border color for form inputs</p>
          </div>
        </div>
      </div>

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

            <div
              className="rounded-md p-6 mt-4 border"
              style={{ backgroundColor: previewStyles.background }}
            >
              <div className="space-y-4">
                <h4 className="text-lg font-semibold" style={{ color: previewStyles.primary }}>Preview Heading</h4>
                <p>This is sample text that shows how your content will appear.</p>
                <div className="flex space-x-2">
                  <button
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: previewStyles.primary,
                      color: '#FFFFFF',
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: previewStyles.secondary,
                      color: '#FFFFFF',
                    }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded-md border"
                    style={{
                      borderColor: previewStyles.accent,
                      color: previewStyles.accent,
                    }}
                  >
                    Accent Button
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div
                    className="p-4 rounded-md border"
                    style={{
                      borderColor: previewStyles.primary + '40',
                      backgroundColor: previewStyles.primary + '10',
                    }}
                  >
                    <h5 style={{ color: previewStyles.primary }}>Card with Primary</h5>
                    <p className="text-sm mt-1">Sample card with primary color.</p>
                  </div>
                  <div
                    className="p-4 rounded-md border"
                    style={{
                      borderColor: previewStyles.secondary + '40',
                      backgroundColor: previewStyles.secondary + '10',
                    }}
                  >
                    <h5 style={{ color: previewStyles.secondary }}>Card with Secondary</h5>
                    <p className="text-sm mt-1">Sample card with secondary color.</p>
                  </div>
                </div>

                <div
                  className="p-4 rounded-md border mt-4"
                  style={{
                    borderColor: previewStyles.accent + '40',
                    backgroundColor: previewStyles.accent + '10',
                  }}
                >
                  <h5 style={{ color: previewStyles.accent }}>Accent Section</h5>
                  <p className="text-sm mt-1">This section uses the accent color for highlighting.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import DashboardPreview from './DashboardPreview';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function StyleSettingsView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    // Fetch current organization settings
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
        }
      } catch (error) {
        console.error('Error fetching organization settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/organization/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Organization style settings updated successfully",
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update style settings: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Style Settings</h3>
                
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
                    <Label htmlFor="navBackgroundColor">Navigation Background Color</Label>
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
                    <Label htmlFor="navTextColor">Navigation Text Color</Label>
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
                      placeholder="/uploads/your-logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="buttonStyle">Button Style</Label>
                    <Select
                      value={settings.buttonStyle}
                      onValueChange={(value) => handleSelectChange('buttonStyle', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select button style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="squared">Squared</SelectItem>
                        <SelectItem value="pill">Pill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(value) => handleSelectChange('fontFamily', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                        <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                        <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/2">
          <DashboardPreview 
            primaryColor={settings.primaryColor}
            secondaryColor={settings.secondaryColor}
            accentColor={settings.accentColor}
            logoUrl={settings.logoUrl}
            navBackgroundColor={settings.navBackgroundColor}
            navTextColor={settings.navTextColor}
            buttonStyle={settings.buttonStyle}
            fontFamily={settings.fontFamily}
          />
        </div>
      </div>
    </div>
  );
}

export default StyleSettingsView;
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tab, Tabs, TabList, TabPanel } from '@/components/ui/tabs';
import { useStyleConfig } from '@/hooks/useStyleConfig';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export function StyleSettingsView() {
  const { styleConfig, isLoading, mutate } = useStyleConfig();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    primary: '#000000',
    secondary: '#32CD32',
    accent: '#FF8C00',
    background: '#F5F5F6',
    foreground: '#000000',
    logoUrl: '',
    adminNavBackground: '#FFFFFF',
    adminNavText: '#000000',
    adminNavActive: '#000000',
    adminNavHover: '#f3f4f6',
  });
  const [activeTab, setActiveTab] = useState('brand');
  const { toast } = useToast();

  useEffect(() => {
    if (styleConfig && !isLoading) {
      setFormData({
        primary: styleConfig.primary || '#000000',
        secondary: styleConfig.secondary || '#32CD32',
        accent: styleConfig.accent || '#FF8C00',
        background: styleConfig.background || '#F5F5F6',
        foreground: styleConfig.foreground || '#000000',
        logoUrl: styleConfig.logoUrl || '',
        adminNavBackground: styleConfig.adminNavBackground || '#FFFFFF',
        adminNavText: styleConfig.adminNavText || '#000000',
        adminNavActive: styleConfig.adminNavActive || styleConfig.primary || '#000000',
        adminNavHover: styleConfig.adminNavHover || '#f3f4f6',
      });
    }
  }, [styleConfig, isLoading]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await axios.post('/api/admin/styling', formData);
      toast({
        title: 'Success',
        description: 'Style settings updated successfully',
        variant: 'success',
      });
      mutate();
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving style settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update style settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ColorPicker = ({ color, onChange, label }) => (
    <div className="mb-4">
      <Label className="mb-2 block">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-10 p-0 border-2"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">Pick a color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <HexColorPicker color={color} onChange={onChange} />
          </PopoverContent>
        </Popover>
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-10"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Style Settings</h2>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabList className="mb-4">
                <Tab value="brand">Brand Colors</Tab>
                <Tab value="dashboard">Dashboard Theme</Tab>
                <Tab value="assets">Assets</Tab>
              </TabList>
              
              <TabPanel value="brand">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ColorPicker
                    color={formData.primary}
                    onChange={(value) => handleChange('primary', value)}
                    label="Primary Color"
                  />
                  <ColorPicker
                    color={formData.secondary}
                    onChange={(value) => handleChange('secondary', value)}
                    label="Secondary Color"
                  />
                  <ColorPicker
                    color={formData.accent}
                    onChange={(value) => handleChange('accent', value)}
                    label="Accent Color"
                  />
                  <ColorPicker
                    color={formData.background}
                    onChange={(value) => handleChange('background', value)}
                    label="Background Color"
                  />
                </div>
              </TabPanel>
              
              <TabPanel value="dashboard">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ColorPicker
                    color={formData.adminNavBackground}
                    onChange={(value) => handleChange('adminNavBackground', value)}
                    label="Navigation Background"
                  />
                  <ColorPicker
                    color={formData.adminNavText}
                    onChange={(value) => handleChange('adminNavText', value)}
                    label="Navigation Text"
                  />
                  <ColorPicker
                    color={formData.adminNavActive}
                    onChange={(value) => handleChange('adminNavActive', value)}
                    label="Active Item"
                  />
                  <ColorPicker
                    color={formData.adminNavHover}
                    onChange={(value) => handleChange('adminNavHover', value)}
                    label="Hover State"
                  />
                </div>
              </TabPanel>
              
              <TabPanel value="assets">
                <div className="mb-4">
                  <Label className="mb-2 block">Logo URL</Label>
                  <Input
                    value={formData.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="/uploads/your-logo.png"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your logo using the File Manager and enter the URL path here
                  </p>
                </div>
                {formData.logoUrl && (
                  <div className="mt-4">
                    <Label className="mb-2 block">Logo Preview</Label>
                    <div className="border rounded p-4 max-w-[300px] bg-white">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo Preview" 
                        className="max-h-[100px] max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </TabPanel>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Preview</h3>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-md p-4 flex flex-col items-center justify-center" style={{ backgroundColor: formData.primary, color: '#fff' }}>
                <span>Primary</span>
                <span className="text-sm">{formData.primary}</span>
              </div>
              <div className="rounded-md p-4 flex flex-col items-center justify-center" style={{ backgroundColor: formData.secondary, color: '#fff' }}>
                <span>Secondary</span>
                <span className="text-sm">{formData.secondary}</span>
              </div>
              <div className="rounded-md p-4 flex flex-col items-center justify-center" style={{ backgroundColor: formData.accent, color: '#fff' }}>
                <span>Accent</span>
                <span className="text-sm">{formData.accent}</span>
              </div>
              <div className="rounded-md p-4 flex flex-col items-center justify-center border" style={{ backgroundColor: formData.background, color: formData.foreground }}>
                <span>Background</span>
                <span className="text-sm">{formData.background}</span>
              </div>
              <div className="rounded-md p-4 flex flex-col items-center justify-center" style={{ backgroundColor: formData.adminNavBackground, color: formData.adminNavText }}>
                <span>Nav Background</span>
                <span className="text-sm">{formData.adminNavBackground}</span>
              </div>
              <div className="rounded-md p-4 flex flex-col items-center justify-center" style={{ backgroundColor: formData.adminNavActive, color: '#fff' }}>
                <span>Active Item</span>
                <span className="text-sm">{formData.adminNavActive}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
