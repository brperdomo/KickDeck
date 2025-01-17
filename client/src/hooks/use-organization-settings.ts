import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectOrganizationSettings } from '@db/schema';

type OrganizationSettingsContextType = {
  settings: SelectOrganizationSettings | null;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<SelectOrganizationSettings>) => Promise<void>;
  isUpdating: boolean;
  error: Error | null;
};

const OrganizationSettingsContext = createContext<OrganizationSettingsContextType>({
  settings: null,
  isLoading: false,
  updateSettings: async () => {},
  isUpdating: false,
  error: null,
});

export function useOrganizationSettings() {
  const context = useContext(OrganizationSettingsContext);
  if (!context) {
    throw new Error('useOrganizationSettings must be used within an OrganizationSettingsProvider');
  }
  return context;
}

export function OrganizationSettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error: queryError } = useQuery<SelectOrganizationSettings>({
    queryKey: ['/api/admin/organization-settings'],
    staleTime: 30000,
    gcTime: 3600000,
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<SelectOrganizationSettings>) => {
      const response = await fetch('/api/admin/organization-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organization-settings'] });
    },
  });

  return (
    <OrganizationSettingsContext.Provider 
      value={{
        settings: settings || null,
        isLoading,
        updateSettings: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        error: updateMutation.error || queryError || null,
      }}
    >
      {children}
    </OrganizationSettingsContext.Provider>
  );
}