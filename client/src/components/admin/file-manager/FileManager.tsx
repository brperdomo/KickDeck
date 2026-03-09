import { useRef, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { FileManagerProvider, useFileManager } from './FileManagerContext';
import { useUploadFile } from './hooks/useFileActions';
import { FolderTreeSidebar } from './sidebar/FolderTreeSidebar';
import { ContentArea } from './content/ContentArea';
import { useToast } from '@/hooks/use-toast';

function FileManagerInner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentFolderId } = useFileManager();
  const uploadFile = useUploadFile();
  const { toast } = useToast();

  const handleFilesSelected = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      toast({ title: `Uploading ${fileArray.length} file${fileArray.length > 1 ? 's' : ''}...` });
      for (const file of fileArray) {
        try {
          await uploadFile.mutateAsync({
            file,
            folderId: currentFolderId,
          });
        } catch {
          // Error toast handled by the mutation's onError
        }
      }
    },
    [currentFolderId, uploadFile, toast]
  );

  return (
    <div className="h-[calc(100vh-180px)] rounded-lg border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
          <FolderTreeSidebar onUploadClick={() => fileInputRef.current?.click()} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={78}>
          <ContentArea />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Hidden file input for sidebar upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFilesSelected(e.target.files);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function FileManager() {
  return (
    <AdminPageWrapper
      title="File Manager"
      subtitle="Organize and manage your files with drag-and-drop"
      backUrl="/admin"
      backLabel="Back to Dashboard"
    >
      <DndProvider backend={HTML5Backend}>
        <FileManagerProvider>
          <FileManagerInner />
        </FileManagerProvider>
      </DndProvider>
    </AdminPageWrapper>
  );
}
