import { z } from "zod";

export interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  thumbnailUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileFilter {
  search: string;
  type: string[];
  folder: string | null;
}

export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  file: z.instanceof(File, { message: "File is required" }),
  folderId: z.string().optional().nullable(),
});

export type FileFormValues = z.infer<typeof fileSchema>;

export interface FileManagerProps {
  className?: string;
  onFileSelect?: (file: FileItem) => void;
  allowMultiple?: boolean;
}

export const ALLOWED_FILE_TYPES = {
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
  documents: ['.txt', '.csv', '.json'],
  videos: ['.mp4', '.webm'],
};

export type FileType = keyof typeof ALLOWED_FILE_TYPES;