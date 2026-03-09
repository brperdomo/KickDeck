import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutGrid, List, Search, RefreshCw, Trash2, ChevronRight, Home, MoreVertical } from 'lucide-react';
import { useFileManager } from '../FileManagerContext';
import { useBreadcrumbs } from '../hooks/useFolders';
import { useDeleteFile, useDeleteFolder } from '../hooks/useFileActions';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export function ContentToolbar({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (q: string) => void }) {
  const { currentFolderId, navigateToFolder, viewMode, setViewMode, selectedItemIds, clearSelection } = useFileManager();
  const { data: breadcrumbs = [] } = useBreadcrumbs(currentFolderId);
  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();
  const queryClient = useQueryClient();

  const hasSelection = selectedItemIds.size > 0;

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedItemIds);
    for (const id of ids) {
      try {
        await api.deleteFile(id);
      } catch {
        try {
          await api.deleteFolder(id);
        } catch {
          // skip
        }
      }
    }
    clearSelection();
    queryClient.invalidateQueries({ queryKey: ['folderContents'] });
    queryClient.invalidateQueries({ queryKey: ['folderTree'] });
  };

  return (
    <div className="space-y-2">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id ?? 'root'} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            <button
              onClick={() => navigateToFolder(crumb.id)}
              className={`hover:text-foreground transition-colors ${
                i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''
              }`}
            >
              {crumb.id === null ? (
                <span className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  Home
                </span>
              ) : (
                crumb.name
              )}
            </button>
          </span>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="h-8 pl-7 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* Bulk actions */}
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <MoreVertical className="h-3.5 w-3.5 mr-1" />
                  {selectedItemIds.size} selected
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['folderContents'] });
              queryClient.invalidateQueries({ queryKey: ['folderTree'] });
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
