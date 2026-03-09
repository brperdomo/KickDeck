import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ViewMode } from './types';

interface FileManagerState {
  currentFolderId: string | null;
  selectedItemIds: Set<string>;
  viewMode: ViewMode;
  navigateToFolder: (id: string | null) => void;
  toggleSelection: (id: string, multi?: boolean) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
}

const FileManagerContext = createContext<FileManagerState | undefined>(undefined);

export function useFileManager() {
  const ctx = useContext(FileManagerContext);
  if (!ctx) throw new Error('useFileManager must be used within FileManagerProvider');
  return ctx;
}

export function FileManagerProvider({ children }: { children: ReactNode }) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const navigateToFolder = useCallback((id: string | null) => {
    setCurrentFolderId(id);
    setSelectedItemIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: string, multi = false) => {
    setSelectedItemIds((prev) => {
      const next = multi ? new Set(prev) : new Set<string>();
      if (prev.has(id) && multi) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    setSelectedItemIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  return (
    <FileManagerContext.Provider
      value={{
        currentFolderId,
        selectedItemIds,
        viewMode,
        navigateToFolder,
        toggleSelection,
        setSelection,
        clearSelection,
        setViewMode,
      }}
    >
      {children}
    </FileManagerContext.Provider>
  );
}
