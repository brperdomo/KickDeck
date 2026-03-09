import { useQuery } from '@tanstack/react-query';
import * as api from '../api';

export function useFolderContents(folderId: string | null) {
  return useQuery({
    queryKey: ['folderContents', folderId],
    queryFn: () => api.getFolder(folderId),
  });
}
