import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectOrganizationSettings } from '@db/schema';

interface OrganizationSettingsResponse {
  id: number;
  name: string;
  primary_color: string;
  secondary_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrganizationSettings() {
  const queryClient = useQueryClient();

  const { data: rawSettings, isLoading } = useQuery<OrganizationSettingsResponse>({
    queryKey: ['/api/admin/organization-settings'],
    staleTime: 30000,
    gcTime: 3600000,
  });

  // Transform snake_case to camelCase for frontend use
  const settings = rawSettings ? {
    id: rawSettings.id,
    name: rawSettings.name,
    primaryColor: rawSettings.primary_color,
    secondaryColor: rawSettings.secondary_color,
    logoUrl: rawSettings.logo_url,
    createdAt: rawSettings.created_at,
    updatedAt: rawSettings.updated_at,
  } : undefined;

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/organization-settings', {
        method: 'POST',
        body: formData,
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

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error,
  };
}