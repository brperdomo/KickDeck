import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import {
  FileText, Image, Video, Music, Archive, Code, File as FileIcon,
  Download, Pencil, Trash2, Star, StarOff, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileManager } from '../FileManagerContext';
import { useRenameFile, useDeleteFile, useToggleFavorite } from '../hooks/useFileActions';
import { RenameDialog } from '../dialogs/RenameDialog';
import { DeleteDialog } from '../dialogs/DeleteDialog';
import { FilePreviewDialog } from '../dialogs/FilePreviewDialog';
import * as api from '../api';
import type { File, DragItem } from '../types';

const typeIcons: Record<string, { icon: typeof FileIcon; color: string }> = {
  image: { icon: Image, color: 'text-blue-400' },
  document: { icon: FileText, color: 'text-orange-400' },
  video: { icon: Video, color: 'text-purple-400' },
  audio: { icon: Music, color: 'text-pink-400' },
  archive: { icon: Archive, color: 'text-yellow-500' },
  code: { icon: Code, color: 'text-green-400' },
  other: { icon: FileIcon, color: 'text-muted-foreground' },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileCardProps {
  file: File;
  listView?: boolean;
}

export function FileCard({ file, listView }: FileCardProps) {
  const { selectedItemIds, toggleSelection } = useFileManager();
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const toggleFavorite = useToggleFavorite();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isSelected = selectedItemIds.has(file.id);
  const { icon: TypeIcon, color: iconColor } = typeIcons[file.type] || typeIcons.other;
  const isImage = file.type === 'image';

  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'FILE',
    item: { type: 'file', id: file.id, name: file.name, size: file.size },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  if (listView) {
    return (
      <>
        <div
          ref={dragRef as any}
          onClick={(e) => toggleSelection(file.id, e.ctrlKey || e.metaKey)}
          onDoubleClick={() => isImage && setPreviewOpen(true)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-xs',
            'hover:bg-accent/50',
            isSelected && 'bg-primary/10',
            isDragging && 'opacity-40'
          )}
        >
          <TypeIcon className={cn('h-4 w-4 shrink-0', iconColor)} />
          <span className="flex-1 truncate font-medium">{file.name}</span>
          {file.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
          <span className="text-muted-foreground w-16 text-right shrink-0">{formatSize(file.size)}</span>
          <span className="text-muted-foreground w-20 text-right shrink-0">
            {new Date(file.createdAt).toLocaleDateString()}
          </span>
        </div>

        <RenameDialog open={renameOpen} onClose={() => setRenameOpen(false)} currentName={file.name} onRename={(name) => renameFile.mutate({ fileId: file.id, name })} />
        <DeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} itemName={file.name} itemType="file" onConfirm={() => deleteFile.mutate(file.id)} />
        <FilePreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} file={file} />
      </>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={dragRef as any}
            onClick={(e) => toggleSelection(file.id, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => isImage && setPreviewOpen(true)}
            className={cn(
              'group relative flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all',
              'bg-card/50 border-border/50 hover:bg-accent/50 hover:border-border',
              isSelected && 'bg-primary/10 border-primary/50 ring-1 ring-primary/30',
              isDragging && 'opacity-40'
            )}
          >
            {/* Thumbnail or icon */}
            {isImage && file.url ? (
              <div className="h-16 w-full flex items-center justify-center overflow-hidden rounded">
                <img src={file.url} alt={file.name} className="max-h-16 max-w-full object-contain" />
              </div>
            ) : (
              <TypeIcon className={cn('h-10 w-10', iconColor)} />
            )}

            {/* Favorite star */}
            {file.isFavorite && (
              <Star className="absolute top-2 right-2 h-3 w-3 text-yellow-400 fill-yellow-400" />
            )}

            <span className="text-xs font-medium text-center truncate w-full">{file.name}</span>
            <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isImage && (
            <ContextMenuItem onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Preview
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => api.downloadFile(file.id)}>
            <Download className="h-3.5 w-3.5 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuItem onClick={() => toggleFavorite.mutate({ fileId: file.id, isFavorite: !file.isFavorite })}>
            {file.isFavorite ? <StarOff className="h-3.5 w-3.5 mr-2" /> : <Star className="h-3.5 w-3.5 mr-2" />}
            {file.isFavorite ? 'Unfavorite' : 'Favorite'}
          </ContextMenuItem>
          <ContextMenuSeparator />
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

      <RenameDialog open={renameOpen} onClose={() => setRenameOpen(false)} currentName={file.name} onRename={(name) => renameFile.mutate({ fileId: file.id, name })} />
      <DeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} itemName={file.name} itemType="file" onConfirm={() => deleteFile.mutate(file.id)} />
      <FilePreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} file={file} />
    </>
  );
}
