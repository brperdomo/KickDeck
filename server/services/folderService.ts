import { db } from '@db';
import { folders } from '@db/schema';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Check if a standard folder exists and create it if it doesn't
 * @param name The name of the folder to create
 * @param parentId The parent folder ID (null for root)
 * @returns The folder object
 */
async function ensureFolder(name: string, parentId: string | null = null): Promise<any> {
  // Check if folder already exists
  let query;
  if (parentId === null) {
    query = db.select().from(folders)
      .where(and(
        eq(folders.name, name),
        isNull(folders.parentId)
      ));
  } else {
    query = db.select().from(folders)
      .where(and(
        eq(folders.name, name),
        eq(folders.parentId, parentId)
      ));
  }
  
  const [existingFolder] = await query;
  
  if (existingFolder) {
    return existingFolder;
  }
  
  // Create the folder if it doesn't exist
  const [newFolder] = await db.insert(folders)
    .values({
      id: uuidv4(),
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
    
  return newFolder;
}

/**
 * Ensures all standard folders exist in the system
 */
export async function ensureStandardFolders(): Promise<void> {
  console.log('Initializing standard folders...');
  
  // Create top-level folders
  const teamsFolder = await ensureFolder('Teams');
  const playersFolder = await ensureFolder('Players');
  const logosFolder = await ensureFolder('Logos');
  const documentsFolder = await ensureFolder('Documents');
  const receiptsFolder = await ensureFolder('Receipts');
  const templatesFolder = await ensureFolder('Templates');
  const formsFolder = await ensureFolder('Forms');
  const imagesFolder = await ensureFolder('Images');
  const reportsFolder = await ensureFolder('Reports & Exports');
  
  // Create second-level folders
  await ensureFolder('Legal', documentsFolder.id);
  await ensureFolder('Waivers', documentsFolder.id);
  await ensureFolder('Email Templates', templatesFolder.id);
  
  console.log('Standard folders initialized successfully');
}

/**
 * Get folder tree structure
 * @returns Nested folder structure
 */
export async function getFolderTree(): Promise<any[]> {
  // Fetch all folders
  const allFolders = await db.select().from(folders);
  
  // Create a map for quick access
  const folderMap = new Map();
  allFolders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: []
    });
  });
  
  // Build the tree
  const rootFolders = [];
  
  allFolders.forEach(folder => {
    const folderWithChildren = folderMap.get(folder.id);
    
    if (folder.parentId === null) {
      // This is a root folder
      rootFolders.push(folderWithChildren);
    } else {
      // This is a child folder
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(folderWithChildren);
      }
    }
  });
  
  return rootFolders;
}

/**
 * Get folder by ID
 * @param folderId The folder ID
 * @returns The folder object or null if not found
 */
export async function getFolder(folderId: string): Promise<any | null> {
  if (!folderId) {
    return null;
  }
  
  const [folder] = await db
    .select()
    .from(folders)
    .where(eq(folders.id, folderId));
  
  return folder || null;
}

/**
 * Create a new folder
 * @param name The name of the folder
 * @param parentId The parent folder ID (null for root)
 * @returns The created folder
 */
export async function createFolder(name: string, parentId: string | null = null): Promise<any> {
  const [newFolder] = await db
    .insert(folders)
    .values({
      id: uuidv4(),
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return newFolder;
}

/**
 * Delete a folder by ID
 * @param folderId The folder ID to delete
 * @returns True if deleted, false if not found
 */
export async function deleteFolder(folderId: string): Promise<boolean> {
  const [folder] = await db
    .select()
    .from(folders)
    .where(eq(folders.id, folderId));
  
  if (!folder) {
    return false;
  }
  
  await db
    .delete(folders)
    .where(eq(folders.id, folderId));
  
  return true;
}

/**
 * Update a folder
 * @param folderId The folder ID
 * @param data The data to update
 * @returns The updated folder or null if not found
 */
export async function updateFolder(folderId: string, data: { name?: string, parentId?: string | null }): Promise<any | null> {
  const [folder] = await db
    .select()
    .from(folders)
    .where(eq(folders.id, folderId));
  
  if (!folder) {
    return null;
  }
  
  const [updatedFolder] = await db
    .update(folders)
    .set({
      name: data.name || folder.name,
      parentId: data.parentId !== undefined ? data.parentId : folder.parentId,
      updatedAt: new Date(),
    })
    .where(eq(folders.id, folderId))
    .returning();
  
  return updatedFolder;
}