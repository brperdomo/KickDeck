import { useQuery } from '@tanstack/react-query';
import * as api from '../api';

export function useFolderTree() {
  return useQuery({
    queryKey: ['folderTree'],
    queryFn: api.getFolderTree,
  });
}

export function useBreadcrumbs(folderId: string | null) {
  return useQuery({
    queryKey: ['breadcrumbs', folderId],
    queryFn: () => api.getBreadcrumbs(folderId),
  });
}
