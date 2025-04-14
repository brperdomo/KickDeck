import React, { useEffect, useState } from 'react';
import { useFileManager } from './FileManagerContext';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { File, Folder, DragItem } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, FolderOpen, Check, ArrowDown, MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Wrapper components for file and folder items
const FileItemWrapper = ({ file }: { file: File }) => {
  return <FileItem file={file} />;
};

const FolderItemWrapper = ({ folder }: { folder: Folder }) => {
  return <FolderItem folder={folder} />;
};

const DroppableArea = ({ children }: { children: React.ReactNode }) => {
  const { currentFolder, moveItems, selectedItems, isDraggingOver, setIsDraggingOver } = useFileManager();
  const [didJustDrop, setDidJustDrop] = useState(false);
  
  // Configure drop functionality for the main content area
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['file', 'folder'],
    drop: (item: DragItem, monitor) => {
      // Only handle the drop if it wasn't dropped on a folder
      if (!monitor.didDrop()) {
        // Use the selected items for multi-drag operations
        if (selectedItems.length > 0) {
          const itemIds = selectedItems.map(item => item.id);
          moveItems(itemIds, currentFolder?.id || null);
          
          // Show success feedback
          setDidJustDrop(true);
          setTimeout(() => setDidJustDrop(false), 1500);
        } else {
          // Fallback to single item if somehow no selection
          moveItems([item.id], currentFolder?.id || null);
          
          // Show success feedback
          setDidJustDrop(true);
          setTimeout(() => setDidJustDrop(false), 1500);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  });
  
  // Update the dragging state for the whole app
  useEffect(() => {
    if (setIsDraggingOver) {
      setIsDraggingOver(isOver && canDrop);
    }
  }, [isOver, canDrop, setIsDraggingOver]);
  
  const showDropOverlay = isOver && canDrop;
  const folderName = currentFolder?.name || 'root';
  
  return (
    <div 
      ref={drop} 
      className={cn(
        "h-full min-h-[300px] w-full transition-all duration-200 relative rounded-md",
        showDropOverlay && "bg-primary/5 ring-2 ring-primary ring-inset",
        "overflow-hidden" // Ensure the animation stays within bounds
      )}
    >
      {/* Drop indicator overlay that appears when items are being dragged over the area */}
      <AnimatePresence>
        {showDropOverlay && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] flex items-center justify-center rounded-md z-10 pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-card p-5 rounded-lg shadow-lg text-center max-w-md"
            >
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold mb-1">Drop to Move</h3>
              <p className="text-muted-foreground text-sm">
                Release to move {selectedItems.length > 1 ? `${selectedItems.length} items` : 'item'} to {folderName === 'root' ? 'root folder' : `"${folderName}"`}
              </p>
              <div className="flex items-center justify-center mt-3 text-xs text-primary gap-1">
                <MoveHorizontal className="h-3 w-3" />
                <span>Moving {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Success animation after dropping */}
        {didJustDrop && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 bg-green-500/90 text-white rounded-md py-2 px-3 shadow-lg flex items-center gap-2 z-20"
          >
            <Check className="h-5 w-5" />
            <span>Items moved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {children}
    </div>
  );
};

// Enhanced empty state component with animation and better visual cues
const EmptyState = () => {
  const { currentFolder } = useFileManager();
  const folderName = currentFolder?.name || 'root folder';
  
  return (
    <motion.div 
      initial={{ opacity: 0.5, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-72 text-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-md"
    >
      <Upload className="h-14 w-14 text-muted-foreground/50 mb-3" />
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-medium mt-2"
      >
        This folder is empty
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground mt-2 max-w-xs"
      >
        Drag and drop files here or use the Upload button in the toolbar to add content to <span className="font-medium">{folderName}</span>
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-xs text-muted-foreground flex items-center gap-1"
      >
        <ArrowDown className="h-3 w-3" />
        <span>Drop files anywhere in this area</span>
      </motion.div>
    </motion.div>
  );
};

const FileManagerContent: React.FC = () => {
  const { files, folders, isLoading, viewMode, isDraggingOver } = useFileManager();

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-3 space-y-2">
            <Skeleton className="h-16 w-16 rounded" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <DndProvider backend={HTML5Backend}>
        <DroppableArea>
          {folders.length === 0 && files.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 transition-all duration-200",
                isDraggingOver && "opacity-70"
              )}
            >
              {folders.map((folder) => (
                <FolderItemWrapper key={folder.id} folder={folder} />
              ))}
              
              {files.map((file) => (
                <FileItemWrapper key={file.id} file={file} />
              ))}
            </motion.div>
          )}
        </DroppableArea>
      </DndProvider>
    );
  }

  // List view
  return (
    <DndProvider backend={HTML5Backend}>
      <DroppableArea>
        {folders.length === 0 && files.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "space-y-1 transition-all duration-200",
              isDraggingOver && "opacity-70"
            )}
          >
            <div className="grid grid-cols-12 gap-4 p-2 text-sm font-medium text-muted-foreground border-b sticky top-0 bg-background z-10">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
            </div>
            
            {folders.map((folder) => (
              <div key={folder.id} className="grid grid-cols-12 items-center rounded-md hover:bg-muted/50 transition-colors">
                <div className="col-span-6">
                  <FolderItemWrapper folder={folder} />
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">—</div>
                <div className="col-span-2 text-sm text-muted-foreground">Folder</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(folder.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {files.map((file) => (
              <div key={file.id} className="grid grid-cols-12 items-center rounded-md hover:bg-muted/50 transition-colors">
                <div className="col-span-6">
                  <FileItemWrapper file={file} />
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {getFileTypeLabel(file.type)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </DroppableArea>
    </DndProvider>
  );
};

// Helper functions
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

const getFileTypeLabel = (mimeType: string = '') => {
  const types: Record<string, string> = {
    'image/': 'Image',
    'audio/': 'Audio',
    'video/': 'Video',
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'text/plain': 'Text',
    'text/html': 'HTML',
    'application/json': 'JSON',
  };
  
  for (const [type, label] of Object.entries(types)) {
    if (mimeType.startsWith(type)) {
      return label;
    }
  }
  
  return mimeType.split('/')[1] || 'Unknown';
};

export default FileManagerContent;