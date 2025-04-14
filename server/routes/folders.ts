import { Router } from 'express';
import { db } from '@db';
import { folders } from '@db/schema';
import { eq, isNull, and, like, desc, asc, sql } from 'drizzle-orm';
import { validateAuth, isAdmin } from '../middleware/auth';
import * as folderService from '../services/folderService';

const router = Router();

// Get all folders in a tree structure
router.get('/tree', async (req, res) => {
  try {
    const folderTree = await folderService.getFolderTree();
    res.json(folderTree);
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    res.status(500).json({ error: 'Failed to fetch folder tree' });
  }
});

// Get all folders (flat list)
router.get('/', async (req, res) => {
  try {
    // Optional parent filter
    const { parentId } = req.query;
    
    let query = db.select().from(folders);
    
    if (parentId === 'null' || parentId === 'root') {
      // Get root folders
      query = query.where(isNull(folders.parentId));
    } else if (parentId) {
      // Get child folders of a specific parent
      query = query.where(eq(folders.parentId, parentId as string));
    }
    
    const folderList = await query;
    res.json(folderList);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get a specific folder by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const folder = await folderService.getFolder(id);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    console.error(`Error fetching folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

// Create a new folder
router.post('/', validateAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Check name length
    if (name.length > 50) {
      return res.status(400).json({ error: 'Folder name cannot exceed 50 characters' });
    }
    
    // If parent ID is provided, verify it exists
    if (parentId && parentId !== 'null') {
      const parentFolder = await folderService.getFolder(parentId);
      
      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }
    
    // Create the folder
    const newFolder = await folderService.createFolder(
      name,
      parentId === 'null' ? null : parentId
    );
    
    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update a folder
router.patch('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    
    // Verify folder exists
    const folder = await folderService.getFolder(id);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Check for circular references
    if (parentId && parentId !== 'null' && parentId !== folder.parentId) {
      if (parentId === id) {
        return res.status(400).json({ error: 'A folder cannot be its own parent' });
      }
      
      // Verify parent exists
      const parentFolder = await folderService.getFolder(parentId);
      
      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
      
      // TODO: Add more comprehensive circular reference check for deep hierarchies
    }
    
    // Update the folder
    const updatedFolder = await folderService.updateFolder(id, {
      name: name || undefined,
      parentId: parentId === 'null' ? null : parentId,
    });
    
    res.json(updatedFolder);
  } catch (error) {
    console.error(`Error updating folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete a folder
router.delete('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if folder exists
    const folder = await folderService.getFolder(id);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Check if folder has child folders
    const childFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.parentId, id));
    
    if (childFolders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with subfolders. Delete subfolders first or move them.' 
      });
    }
    
    // Check if folder has files
    // This check might be in the file service later
    const files = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));
    
    if (files.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with files. Delete or move files first.' 
      });
    }
    
    // Delete the folder
    const deleted = await folderService.deleteFolder(id);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete folder' });
    }
    
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error(`Error deleting folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;