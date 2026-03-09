import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { ChevronRight, Folder as FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileManager } from '../FileManagerContext';
import { useMoveItems } from '../hooks/useFileActions';
import type { Folder, DragItem } from '../types';

interface FolderTreeItemProps {
  folder: Folder;
  depth: number;
}

export function FolderTreeItem({ folder, depth }: FolderTreeItemProps) {
  const { currentFolderId, navigateToFolder, selectedItemIds, clearSelection } = useFileManager();
  const moveItems = useMoveItems();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isActive = currentFolderId === folder.id;

  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ['FILE', 'FOLDER'],
    canDrop: (item) => item.id !== folder.id,
    drop: (item) => {
      // Collect all selected items plus the dragged item
      const allIds = new Set(selectedItemIds);
      allIds.add(item.id);

      const fileIds: string[] = [];
      const folderIds: string[] = [];

      allIds.forEach((id) => {
        if (item.type === 'file' && id === item.id) {
          fileIds.push(id);
        } else if (item.type === 'folder' && id === item.id) {
          folderIds.push(id);
        } else {
          // For selected items we don't know the type — push to files
          // The backend will handle it or we can enhance later
          fileIds.push(id);
        }
      });

      moveItems.mutate({ fileIds, folderIds, targetFolderId: folder.id });
      clearSelection();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div>
      <div
        ref={dropRef as any}
        onClick={() => navigateToFolder(folder.id)}
        className={cn(
          'w-full flex items-center gap-1 py-1.5 rounded-md text-xs cursor-pointer transition-colors',
          isActive
            ? 'bg-primary/15 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          isOver && canDrop && 'bg-primary/20 ring-1 ring-primary/50'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '8px' }}
      >
        {/* Expand/collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            'shrink-0 p-0.5 rounded hover:bg-accent/50 transition-transform',
            !hasChildren && 'invisible'
          )}
        >
          <ChevronRight
            className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
          />
        </button>

        <FolderIcon className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
        <span className="truncate">{folder.name}</span>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem key={child.id} folder={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
