import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import { useToast } from '@/hooks/use-toast';

function useInvalidateFileManager() {
  const queryClient = useQueryClient();
  return (folderId?: string | null) => {
    queryClient.invalidateQueries({ queryKey: ['folderContents'] });
    queryClient.invalidateQueries({ queryKey: ['folderTree'] });
    queryClient.invalidateQueries({ queryKey: ['breadcrumbs'] });
  };
}

export function useCreateFolder() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      api.createFolder(name, parentId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Folder created' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create folder', variant: 'destructive' });
    },
  });
}

export function useUploadFile() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: ({
      file,
      folderId,
      onProgress,
    }: {
      file: globalThis.File;
      folderId: string | null;
      onProgress?: (progress: number) => void;
    }) => api.uploadFile(file as any, folderId, onProgress),
    onSuccess: () => {
      invalidate();
    },
    onError: (_, variables) => {
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${variables.file.name}`,
        variant: 'destructive',
      });
    },
  });
}

export function useRenameFile() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: ({ fileId, name }: { fileId: string; name: string }) =>
      api.updateFile(fileId, { name } as any),
    onSuccess: () => {
      invalidate();
      toast({ title: 'File renamed' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to rename file', variant: 'destructive' });
    },
  });
}

export function useRenameFolder() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      api.updateFolder(folderId, { name }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Folder renamed' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to rename folder', variant: 'destructive' });
    },
  });
}

export function useDeleteFile() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: (fileId: string) => api.deleteFile(fileId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'File deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' });
    },
  });
}

export function useDeleteFolder() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: (folderId: string) => api.deleteFolder(folderId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Folder deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete folder', variant: 'destructive' });
    },
  });
}

export function useMoveItems() {
  const { toast } = useToast();
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: async ({
      fileIds,
      folderIds,
      targetFolderId,
    }: {
      fileIds: string[];
      folderIds: string[];
      targetFolderId: string | null;
    }) => {
      if (fileIds.length > 0) {
        await api.moveFiles(fileIds, targetFolderId);
      }
      for (const fId of folderIds) {
        if (fId !== targetFolderId) {
          await api.updateFolder(fId, { parentId: targetFolderId } as any);
        }
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Items moved' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to move items', variant: 'destructive' });
    },
  });
}

export function useToggleFavorite() {
  const invalidate = useInvalidateFileManager();

  return useMutation({
    mutationFn: ({ fileId, isFavorite }: { fileId: string; isFavorite: boolean }) =>
      api.toggleFileFavorite(fileId, isFavorite),
    onSuccess: () => {
      invalidate();
    },
  });
}
