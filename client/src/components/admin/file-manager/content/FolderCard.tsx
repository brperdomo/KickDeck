import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Folder as FolderIcon, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileManager } from '../FileManagerContext';
import { useMoveItems } from '../hooks/useFileActions';
import { RenameDialog } from '../dialogs/RenameDialog';
import { DeleteDialog } from '../dialogs/DeleteDialog';
import { useRenameFolder, useDeleteFolder } from '../hooks/useFileActions';
import type { Folder, DragItem } from '../types';

interface FolderCardProps {
  folder: Folder;
}

export function FolderCard({ folder }: FolderCardProps) {
  const { navigateToFolder, selectedItemIds, toggleSelection, clearSelection } = useFileManager();
  const moveItems = useMoveItems();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSelected = selectedItemIds.has(folder.id);

  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'FOLDER',
    item: { type: 'folder', id: folder.id, name: folder.name },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ['FILE', 'FOLDER'],
    canDrop: (item) => item.id !== folder.id,
    drop: (item) => {
      const allIds = new Set(selectedItemIds);
      allIds.add(item.id);
      const fileIds: string[] = [];
      const folderIds: string[] = [];
      allIds.forEach((id) => {
        if (item.type === 'file' && id === item.id) fileIds.push(id);
        else if (item.type === 'folder' && id === item.id) folderIds.push(id);
        else fileIds.push(id);
      });
      moveItems.mutate({ fileIds, folderIds, targetFolderId: folder.id });
      clearSelection();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine refs
  const combinedRef = (el: HTMLDivElement | null) => {
    dragRef(el);
    dropRef(el);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={combinedRef}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                toggleSelection(folder.id, true);
              } else {
                navigateToFolder(folder.id);
              }
            }}
            className={cn(
              'group relative flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all',
              'bg-card/50 border-border/50 hover:bg-accent/50 hover:border-border',
              isSelected && 'bg-primary/10 border-primary/50 ring-1 ring-primary/30',
              isOver && canDrop && 'bg-primary/20 border-primary border-dashed scale-105',
              isDragging && 'opacity-40'
            )}
          >
            <FolderIcon className="h-10 w-10 text-yellow-400" />
            <span className="text-xs font-medium text-center truncate w-full">{folder.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => navigateToFolder(folder.id)}>
            <FolderIcon className="h-3.5 w-3.5 mr-2" />
            Open
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <RenameDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        currentName={folder.name}
        onRename={(name) => renameFolder.mutate({ folderId: folder.id, name })}
      />
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        itemName={folder.name}
        itemType="folder"
        onConfirm={() => deleteFolder.mutate(folder.id)}
      />
    </>
  );
}
