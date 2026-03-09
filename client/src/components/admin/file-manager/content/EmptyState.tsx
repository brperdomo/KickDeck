import { FolderOpen, Upload } from 'lucide-react';

export function EmptyState({ hasSearch }: { hasSearch?: boolean }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">No matching files</p>
        <p className="text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Upload className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">This folder is empty</p>
      <p className="text-xs mt-1">Drag files here or use the upload button</p>
    </div>
  );
}
