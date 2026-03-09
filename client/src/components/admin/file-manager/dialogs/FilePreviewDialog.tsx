import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import * as api from '../api';
import type { File } from '../types';

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewDialog({ open, onClose, file }: FilePreviewDialogProps) {
  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {formatSize(file.size)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center overflow-auto max-h-[60vh] bg-black/20 rounded-lg p-2">
          {isImage && file.url && (
            <img src={file.url} alt={file.name} className="max-w-full max-h-[58vh] object-contain" />
          )}
          {isVideo && file.url && (
            <video src={file.url} controls className="max-w-full max-h-[58vh]" />
          )}
          {!isImage && !isVideo && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Preview not available for this file type
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => api.downloadFile(file.id)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
