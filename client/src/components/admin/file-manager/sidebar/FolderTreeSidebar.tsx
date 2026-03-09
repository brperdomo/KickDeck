import { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Upload, Home, Loader2 } from 'lucide-react';
import { useFileManager } from '../FileManagerContext';
import { useFolderTree } from '../hooks/useFolders';
import { useCreateFolder } from '../hooks/useFileActions';
import { FolderTreeItem } from './FolderTreeItem';

export function FolderTreeSidebar({ onUploadClick }: { onUploadClick: () => void }) {
  const { currentFolderId, navigateToFolder } = useFileManager();
  const { data: tree = [], isLoading } = useFolderTree();
  const createFolder = useCreateFolder();

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder.mutate(
      { name: newFolderName.trim(), parentId: currentFolderId },
      {
        onSuccess: () => {
          setNewFolderName('');
          setIsCreating(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-background/30 border-r border-border/50">
      {/* Header */}
      <div className="p-3 border-b border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-xs"
            onClick={() => {
              setIsCreating(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
            New Folder
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onUploadClick}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload
          </Button>
        </div>

        {isCreating && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateFolder();
            }}
            className="flex gap-1"
          >
            <Input
              ref={inputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="h-7 text-xs"
              onBlur={() => {
                if (!newFolderName.trim()) setIsCreating(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
            />
            <Button type="submit" size="sm" className="h-7 text-xs px-2" disabled={!newFolderName.trim()}>
              Add
            </Button>
          </form>
        )}
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Home / Root */}
          <button
            onClick={() => navigateToFolder(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
              currentFolderId === null
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">All Files</span>
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            tree.map((folder) => (
              <FolderTreeItem key={folder.id} folder={folder} depth={0} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
