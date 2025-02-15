import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileItem, FileManagerProps, ALLOWED_FILE_TYPES, Folder, FileFilter, FileType } from "./file-manager-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Copy,
  Trash2,
  Loader2,
  Upload,
  Eye,
  FolderPlus,
  Search,
  Filter,
  Video,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FileManager({ className, onFileSelect, allowMultiple = false }: FileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch files and folders
  const filesQuery = useQuery({
    queryKey: ['files', currentFolder],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/files${currentFolder ? `?folderId=${currentFolder}` : ''}`);
        if (!response.ok) {
          console.error('Failed to fetch files:', await response.text());
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        return data as FileItem[];
      } catch (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000,
    cacheTime: 60000
  });

  const foldersQuery = useQuery({
    queryKey: ['folders', currentFolder],
    queryFn: async () => {
      const response = await fetch(`/api/folders${currentFolder ? `?parentId=${currentFolder}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json() as Promise<Folder[]>;
    },
  });

  // File operations mutations
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) {
        formData.append('folderId', currentFolder);
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        description: "File uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolder }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setNewFolderDialogOpen(false);
      setNewFolderName("");
      toast({
        description: "Folder created successfully",
      });
    },
  });

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      const response = await fetch('/api/files/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds }),
      });
      if (!response.ok) throw new Error('Failed to delete files');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setSelectedFiles(new Set());
      toast({
        description: "Files deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        description: error.message || "Failed to delete files",
        variant: "destructive",
      });
    }
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async ({ fileIds, targetFolderId }: { fileIds: string[], targetFolderId: string | null }) => {
      const response = await fetch('/api/files/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, targetFolderId }),
      });
      if (!response.ok) throw new Error('Failed to move files');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setSelectedFiles(new Set());
      toast({
        description: "Files moved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        description: error.message || "Failed to move files",
        variant: "destructive",
      });
    }
  });

  // Filter files
  const filteredFiles = filesQuery.data?.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter.length === 0 ||
      fileTypeFilter.some(type =>
        ALLOWED_FILE_TYPES[type].some(ext => file.name.toLowerCase().endsWith(ext))
      );
    return matchesSearch && matchesType;
  }) || [];

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      try {
        for (const file of acceptedFiles) {
          await uploadMutation.mutateAsync(file);
        }
      } finally {
        setIsUploading(false);
      }
    },
    accept: {
      'image/*': ALLOWED_FILE_TYPES.images,
      'text/*': ALLOWED_FILE_TYPES.documents,
      'video/*': ALLOWED_FILE_TYPES.videos,
    },
  });

  // Handle selection
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else if (allowMultiple) {
      newSelection.add(fileId);
    } else {
      newSelection.clear();
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedFiles));
    }
  };

  const handleBulkMove = (targetFolderId: string | null) => {
    if (selectedFiles.size === 0) return;
    bulkMoveMutation.mutate({
      fileIds: Array.from(selectedFiles),
      targetFolderId,
    });
  };

  const handleRename = () => {
    if (!selectedFile || !newFileName.trim()) return;
    renameMutation.mutate({ fileId: selectedFile.id, newName: newFileName.trim() });
  };

  const renameMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      const response = await fetch(`/api/files/${fileId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });
      if (!response.ok) throw new Error('Failed to rename file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setRenameDialogOpen(false);
      toast({ description: "File renamed successfully" });
    },
    onError: (error:Error) => {
      toast({
        description: error.message || "Failed to rename file",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        description: "File deleted successfully",
      });
    },
    onError: (error:Error) => {
      toast({
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => toast({ description: "URL copied to clipboard" }))
      .catch(err => toast({ description: `Failed to copy: ${err.message}`, variant: "destructive" }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>File Manager</CardTitle>
              <CardDescription>
                Organize and manage your files and folders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setNewFolderDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              {selectedFiles.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation breadcrumb */}
          {currentFolder && (
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setCurrentFolder(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Root
            </Button>
          )}

          {/* Search and filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Select
              value={fileTypeFilter.join(',')}
              onValueChange={(value) => setFileTypeFilter(value.split(',').filter(Boolean) as FileType[])}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Uploading...</p>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p>Drag and drop files here, or click to select files</p>
              </div>
            )}
          </div>

          {/* Files and folders list */}
          {filesQuery.isLoading || foldersQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filesQuery.error || foldersQuery.error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load content. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">
                    <Checkbox
                      checked={selectedFiles.size > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
                        } else {
                          setSelectedFiles(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Folders */}
                {foldersQuery.data?.map((folder) => (
                  <TableRow key={folder.id}>
                    <TableCell></TableCell>
                    <TableCell
                      className="cursor-pointer hover:text-primary"
                      onClick={() => setCurrentFolder(folder.id)}
                    >
                      📁 {folder.name}
                    </TableCell>
                    <TableCell>Folder</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{new Date(folder.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Files */}
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                    </TableCell>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (file.type.startsWith('video/')) {
                              setVideoPreviewUrl(file.url);
                            } else {
                              window.open(file.url, '_blank');
                            }
                            if (onFileSelect) {
                              onFileSelect(file);
                            }
                          }}
                        >
                          {file.type.startsWith('video/') ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(file.url)
                              .then(() => toast({ description: "URL copied to clipboard" }))
                              .catch(err => toast({ description: `Failed to copy: ${err.message}`, variant: "destructive" }));
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFile(file);
                                setNewFileName(file.name);
                                setRenameDialogOpen(true);
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this file?')) {
                                  deleteMutation.mutate(file.id);
                                }
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="Enter new file name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createFolderMutation.mutate(newFolderName)}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog
        open={!!videoPreviewUrl}
        onOpenChange={() => setVideoPreviewUrl(null)}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          {videoPreviewUrl && (
            <video
              controls
              className="w-full"
              src={videoPreviewUrl}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}