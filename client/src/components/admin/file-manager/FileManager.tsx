import React, { useState, useCallback } from 'react';
import { FileManagerProvider } from './FileManagerContext';
import { useFileManager } from './FileManagerContext';
import Breadcrumbs from './Breadcrumbs';
import Toolbar from './Toolbar';
import FileManagerContent from './FileManagerContent';
import FileUploader from './FileUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';

// Internal component that has access to context
const FileManagerWithDnd: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const { uploadFiles, currentFolder } = useFileManager();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      uploadFiles(acceptedFiles as unknown as FileList, currentFolder?.id || null);
      // Switch to browse tab to see the uploaded files
      setActiveTab('browse');
    }
  }, [uploadFiles, currentFolder, setActiveTab]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true 
  });
  
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-md",
        isDragActive && "outline-dashed outline-2 outline-primary bg-primary/5"
      )}
    >
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-primary/10 backdrop-blur-sm rounded-md">
          <div className="bg-card p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
            <p className="text-muted-foreground">Release to upload files to current folder</p>
          </div>
        </div>
      )}
      
      <Card className={cn("shadow-sm w-full", isDragActive && "opacity-50")}>
        <CardHeader className="pb-2">
          <CardTitle>File Manager</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="browse">Browse Files</TabsTrigger>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="space-y-4">
              <Breadcrumbs />
              <Separator />
              <Toolbar />
              <FileManagerContent />
            </TabsContent>
            
            <TabsContent value="upload">
              <div className="space-y-4">
                <Breadcrumbs />
                <Separator />
                <FileUploader />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper component that provides the context
const FileManager: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <FileManagerProvider>
        <FileManagerWithDnd />
      </FileManagerProvider>
    </DndProvider>
  );
};

export default FileManager;