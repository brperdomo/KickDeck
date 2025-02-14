import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SelectOrganizationSettings } from '@db/schema';

export function useOrganizationSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SelectOrganizationSettings>({
    queryKey: ['/api/admin/organization-settings'],
    staleTime: 30000,
    gcTime: 3600000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData | Partial<SelectOrganizationSettings>) => {
      const response = await fetch('/api/admin/organization-settings', {
        method: 'POST',
        headers: data instanceof FormData ? {} : {
          'Content-Type': 'application/json',
        },
        body: data instanceof FormData ? data : JSON.stringify(data),
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