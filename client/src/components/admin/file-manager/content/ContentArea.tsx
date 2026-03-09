import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileManager } from '../FileManagerContext';
import { useFolderContents } from '../hooks/useFiles';
import { useUploadFile } from '../hooks/useFileActions';
import { ContentToolbar } from './ContentToolbar';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { EmptyState } from './EmptyState';
import { Progress } from '@/components/ui/progress';

export function ContentArea() {
  const { currentFolderId, viewMode } = useFileManager();
  const { data, isLoading } = useFolderContents(currentFolderId);
  const uploadFile = useUploadFile();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number }[]>([]);

  const folders = data?.subfolders ?? [];
  const files = data?.files ?? [];

  // Filter by search
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  const onDrop = useCallback(
    async (acceptedFiles: globalThis.File[]) => {
      for (const file of acceptedFiles) {
        const entry = { name: file.name, progress: 0 };
        setUploadProgress((prev) => [...prev, entry]);

        await uploadFile.mutateAsync({
          file,
          folderId: currentFolderId,
          onProgress: (p) => {
            setUploadProgress((prev) =>
              prev.map((e) => (e.name === file.name ? { ...e, progress: p } : e))
            );
          },
        });

        // Remove after short delay
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((e) => e.name !== file.name));
        }, 1000);
      }
    },
    [currentFolderId, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col h-full',
        isDragActive && 'outline-dashed outline-2 outline-primary rounded-lg'
      )}
    >
      <input {...getInputProps()} />

      {/* Drop overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-lg">
          <div className="bg-card p-6 rounded-lg shadow-lg text-center border border-border">
            <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-3 border-b border-border/50">
        <ContentToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <EmptyState hasSearch={!!searchQuery} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredFolders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
            {filteredFiles.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* List header */}
            <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border/50">
              <span className="w-4" />
              <span className="flex-1">Name</span>
              <span className="w-16 text-right">Size</span>
              <span className="w-20 text-right">Date</span>
            </div>
            {filteredFolders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
            {filteredFiles.map((file) => (
              <FileCard key={file.id} file={file} listView />
            ))}
          </div>
        )}
      </div>

      {/* Upload progress bar */}
      {uploadProgress.length > 0 && (
        <div className="border-t border-border/50 p-2 space-y-1">
          {uploadProgress.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span className="truncate flex-1 text-muted-foreground">{entry.name}</span>
              <Progress value={entry.progress} className="w-24 h-1.5" />
              <span className="w-8 text-right text-muted-foreground">{entry.progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
