import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

export const colors = {
  slate: 'hsl(222.2 47.4% 11.2%)',
  red: 'hsl(0 72.2% 50.6%)',
  orange: 'hsl(24.6 95% 53.1%)',
  green: 'hsl(142.1 76.2% 36.3%)',
  blue: 'hsl(221.2 83.2% 53.3%)',
  violet: 'hsl(262.1 83.3% 57.8%)',
} as const;

type ColorName = keyof typeof colors;

export interface Theme {
  variant: 'professional' | 'tint' | 'vibrant';
  primary: string;
  appearance: 'light' | 'dark' | 'system';
  radius: number;
  colors?: {
    [key: string]: string;
  };
}

export interface StyleConfig {
  layout: {
    background: string;
    foreground: string;
    border: string;
  };
  primary: {
    primary: string;
    secondary: string;
    accent: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export function useTheme() {
  const [currentColor, setCurrentColor] = useState<ColorName>('slate');
  const [styleConfig, setStyleConfig] = useState<StyleConfig | null>(null);

  // Load initial style config
  useEffect(() => {
    const loadStyleConfig = async () => {
      try {
        const response = await fetch('/api/admin/styling');
        if (response.ok) {
          const data = await response.json();
          setStyleConfig(data.config);

          // Apply saved colors to document
          if (data.config) {
            Object.entries(data.config).forEach(([section, colors]: [string, any]) => {
              Object.entries(colors).forEach(([key, value]: [string, string]) => {
                const cssVar = `--${key}`;
                document.documentElement.style.setProperty(cssVar, value);
                if (key === 'background') {
                  document.body.style.backgroundColor = value;
                }
              });
            });
          }
        }
      } catch (error) {
        console.error('Failed to load style config:', error);
      }
    };
    loadStyleConfig();
  }, []);

  const themeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(theme),
      });

      if (!response.ok) {
        throw new Error('Failed to update theme');
      }

      return response.json();
    },
  });

  const styleConfigMutation = useMutation({
    mutationFn: async (config: StyleConfig) => {
      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to update style configuration');
      }

      // Update local state and apply styles
      setStyleConfig(config);
      Object.entries(config).forEach(([section, colors]: [string, any]) => {
        Object.entries(colors).forEach(([key, value]: [string, string]) => {
          const cssVar = `--${key}`;
          document.documentElement.style.setProperty(cssVar, value);
          if (key === 'background') {
            document.body.style.backgroundColor = value;
          }
        });
      });

      return response.json();
    },
  });

  const setColor = useCallback(async (colorName: ColorName | string) => {
    const colorValue = colorName in colors 
      ? colors[colorName as ColorName]
      : colorName;

    setCurrentColor(colorName as ColorName);
    await themeMutation.mutateAsync({
      variant: 'professional',
      primary: colorValue,
      appearance: 'light',
      radius: 0.5,
    });
  }, [themeMutation]);

  const updateStyleConfig = useCallback(async (config: StyleConfig) => {
    await styleConfigMutation.mutateAsync(config);
  }, [styleConfigMutation]);

  return {
    currentColor,
    setColor,
    styleConfig,
    updateStyleConfig,
    isLoading: themeMutation.isPending || styleConfigMutation.isPending,
    error: themeMutation.error || styleConfigMutation.error,
  };
}