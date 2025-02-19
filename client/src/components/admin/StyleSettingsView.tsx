import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme, StyleConfig } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const defaultColors: StyleConfig = {
  layout: {
    background: "#1A1A1A",
    foreground: "#FFFFFF",
    border: "#333333"
  },
  primary: {
    primary: "#1E88E5",
    secondary: "#43A047",
    accent: "#FFC107"
  },
  status: {
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    info: "#2196F3"
  }
};

export function StyleSettingsView() {
  const { styleConfig, updateStyleConfig, isLoading } = useTheme();
  const [colors, setColors] = useState<StyleConfig>(defaultColors);
  const { toast } = useToast();

  useEffect(() => {
    if (styleConfig) {
      setColors(styleConfig);
    }
  }, [styleConfig]);

  const handleColorChange = (section: keyof StyleConfig, colorKey: string, value: string) => {
    // Ensure the color value is a valid 7-character hex code
    const hexColor = value.length === 7 && value.startsWith('#') ? value : defaultColors[section][colorKey];

    setColors(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [colorKey]: hexColor
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Validate all color values before saving
      const validatedColors = Object.entries(colors).reduce((acc, [section, sectionColors]) => {
        acc[section] = Object.entries(sectionColors).reduce((secAcc, [key, value]) => {
          // Ensure each color is a valid 7-character hex code
          secAcc[key] = value.length === 7 && value.startsWith('#') 
            ? value 
            : defaultColors[section][key];
          return secAcc;
        }, {});
        return acc;
      }, {} as StyleConfig);

      await updateStyleConfig(validatedColors);

      toast({
        title: "Success",
        description: "Theme colors updated successfully"
      });
    } catch (error) {
      console.error('Style update error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update theme colors"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Theme Colors</h2>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {Object.entries(colors).map(([sectionKey, section]) => (
        <Card key={sectionKey}>
          <CardHeader>
            <CardTitle>{sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(section).map(([colorKey, value]) => (
                <div key={colorKey} className="space-y-2">
                  <Label htmlFor={colorKey}>
                    {colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id={colorKey}
                      value={value}
                      onChange={(e) => handleColorChange(sectionKey as keyof StyleConfig, colorKey, e.target.value)}
                      className="w-12 h-12 p-1"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleColorChange(sectionKey as keyof StyleConfig, colorKey, e.target.value)}
                      className="font-mono uppercase"
                      maxLength={7}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}