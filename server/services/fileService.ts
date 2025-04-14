import { db } from '@db';
import { files, folders, users } from '@db/schema';
import { eq, isNull, and, like, desc, asc, or, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Get all files with optional filtering
 * @param options Filter options
 * @returns Array of files
 */
export async function getFiles(options: {
  folderId?: string | null;
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) {
  const {
    folderId,
    search,
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = options;
  
  // Build query with filters
  let query = db.select().from(files);
  
  // Apply folder filter
  if (folderId === null || folderId === 'null' || folderId === 'root') {
    query = query.where(isNull(files.folderId));
  } else if (folderId) {
    query = query.where(eq(files.folderId, folderId));
  }
  
  // Apply search filter
  if (search) {
    query = query.where(
      like(files.name, `%${search}%`)
    );
  }
  
  // Apply type filter
  if (type) {
    query = query.where(eq(files.type, type));
  }
  
  // Apply sorting
  if (sortBy && sortOrder) {
    const orderFunc = sortOrder === 'asc' ? asc : desc;
    
    // Handle different sort fields
    if (sortBy === 'name') {
      query = query.orderBy(orderFunc(files.name));
    } else if (sortBy === 'size') {
      query = query.orderBy(orderFunc(files.size));
    } else if (sortBy === 'type') {
      query = query.orderBy(orderFunc(files.type));
    } else if (sortBy === 'updatedAt') {
      query = query.orderBy(orderFunc(files.updatedAt));
    } else {
      // Default to createdAt
      query = query.orderBy(orderFunc(files.createdAt));
    }
  } else {
    // Default sort by createdAt desc
    query = query.orderBy(desc(files.createdAt));
  }
  
  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);
  
  const result = await query;
  
  // Enhance file data with folder name if exists
  const enhancedFiles = await Promise.all(result.map(async (file) => {
    let folderName = null;
    
    if (file.folderId) {
      const [folder] = await db
        .select()
        .from(folders)
        .where(eq(folders.id, file.folderId));
      
      if (folder) {
        folderName = folder.name;
      }
    }
    
    // Get uploader name if exists
    let uploaderName = null;
    let uploaderEmail = null;
    
    if (file.uploadedById) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, file.uploadedById));
      
      if (user) {
        uploaderName = user.username || `${user.firstName} ${user.lastName}`;
        uploaderEmail = user.email;
      }
    }
    
    return {
      ...file,
      folderName,
      uploaderName,
      uploaderEmail,
    };
  }));
  
  return enhancedFiles;
}

/**
 * Get a specific file by ID
 * @param fileId The file ID
 * @returns The file with folder name or null if not found
 */
export async function getFile(fileId: string) {
  if (!fileId) return null;
  
  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId));
  
  if (!file) return null;
  
  // Enhance file data with folder name if exists
  let folderName = null;
  
  if (file.folderId) {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, file.folderId));
    
    if (folder) {
      folderName = folder.name;
    }
  }
  
  // Get uploader name if exists
  let uploaderName = null;
  let uploaderEmail = null;
  
  if (file.uploadedById) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, file.uploadedById));
    
    if (user) {
      uploaderName = user.username || `${user.firstName} ${user.lastName}`;
      uploaderEmail = user.email;
    }
  }
  
  return {
    ...file,
    folderName,
    uploaderName,
    uploaderEmail,
  };
}

/**
 * Create a new file record in the database
 * @param fileData The file data to create
 * @returns The created file
 */
export async function createFile(fileData: {
  name: string;
  url: string;
  size: number;
  type: string;
  extension: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string | null;
  uploadedById?: number | null;
  uploadedByName?: string | null;
  uploadedByEmail?: string | null;
  uploadedByAvatar?: string | null;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
}) {
  // Generate a unique ID for the file
  const fileId = uuidv4();
  
  // Format tags if they're provided
  let formattedTags = fileData.tags;
  if (fileData.tags && typeof fileData.tags === 'string') {
    // Remove extra spaces and split by commas if it's a CSV string
    formattedTags = fileData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .join(',');
  }
  
  // Create file record
  const [newFile] = await db.insert(files)
    .values({
      id: fileId,
      name: fileData.name,
      url: fileData.url,
      size: fileData.size,
      type: fileData.type,
      extension: fileData.extension,
      folderId: fileData.folderId || null,
      description: fileData.description || null,
      tags: formattedTags,
      uploadedById: fileData.uploadedById || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      thumbnailUrl: null,
      relatedEntityId: fileData.relatedEntityId || null,
      relatedEntityType: fileData.relatedEntityType || null,
    })
    .returning();
  
  // Enhance with folder name if exists
  let folderName = null;
  
  if (newFile.folderId) {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, newFile.folderId));
    
    if (folder) {
      folderName = folder.name;
    }
  }
  
  return {
    ...newFile,
    folderName,
    uploaderName: fileData.uploadedByName,
    uploaderEmail: fileData.uploadedByEmail,
  };
}

/**
 * Update a file's metadata
 * @param fileId The file ID
 * @param fileData The data to update
 * @returns The updated file or null if not found
 */
export async function updateFile(fileId: string, fileData: {
  name?: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string | null;
}) {
  // Find the file
  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId));
  
  if (!file) {
    return null;
  }
  
  // Format tags if they're provided
  let formattedTags = fileData.tags;
  if (fileData.tags && typeof fileData.tags === 'string') {
    // Remove extra spaces and split by commas if it's a CSV string
    formattedTags = fileData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .join(',');
  }
  
  // Update file
  const [updatedFile] = await db
    .update(files)
    .set({
      name: fileData.name || file.name,
      folderId: fileData.folderId === 'null' ? null : (fileData.folderId ?? file.folderId),
      description: fileData.description ?? file.description,
      tags: formattedTags ?? file.tags,
      updatedAt: new Date(),
    })
    .where(eq(files.id, fileId))
    .returning();
  
  // Enhance with folder name if exists
  let folderName = null;
  
  if (updatedFile.folderId) {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, updatedFile.folderId));
    
    if (folder) {
      folderName = folder.name;
    }
  }
  
  return {
    ...updatedFile,
    folderName,
  };
}

/**
 * Delete a file
 * @param fileId The file ID
 * @returns True if deleted successfully, false if file not found
 */
export async function deleteFile(fileId: string) {
  // Find the file
  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId));
  
  if (!file) {
    return false;
  }
  
  // Delete file from disk
  if (file.url) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      // Extract file path from URL
      const relativeFilePath = file.url.replace('/uploads', '');
      const filePath = path.join(uploadsDir, relativeFilePath);
      
      // Check if file exists before attempting to delete
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file from disk: ${error}`);
      // Continue with database deletion even if file deletion fails
    }
  }
  
  // Delete file record
  await db
    .delete(files)
    .where(eq(files.id, fileId));
  
  return true;
}

/**
 * Get file path
 * @param fileId The file ID
 * @returns The filesystem path if found, null if file not found
 */
export async function getFilePath(fileId: string) {
  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId));
  
  if (!file || !file.url) {
    return null;
  }
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const relativeFilePath = file.url.replace('/uploads', '');
  const filePath = path.join(uploadsDir, relativeFilePath);
  
  return { filePath, file };
}

/**
 * Get files by folder ID
 * @param folderId The folder ID
 * @returns Array of files
 */
export async function getFilesByFolder(folderId: string | null) {
  // Build query with filters
  let query;
  
  if (folderId === null) {
    query = db
      .select()
      .from(files)
      .where(isNull(files.folderId))
      .orderBy(desc(files.createdAt));
  } else {
    query = db
      .select()
      .from(files)
      .where(eq(files.folderId, folderId))
      .orderBy(desc(files.createdAt));
  }
  
  return await query;
}

/**
 * Determine file type from extension
 * @param extension The file extension (without dot)
 * @returns The file type
 */
export function getFileTypeFromExtension(extension: string): string {
  extension = extension.toLowerCase();
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }
  
  // Documents
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'].includes(extension)) {
    return 'document';
  }
  
  // Videos
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return 'video';
  }
  
  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) {
    return 'audio';
  }
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'archive';
  }
  
  // Code
  if (['js', 'ts', 'html', 'css', 'php', 'py', 'java', 'jsx', 'tsx', 'json', 'xml'].includes(extension)) {
    return 'code';
  }
  
  // Default
  return 'other';
}