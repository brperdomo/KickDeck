import { Router } from 'express';
import { db } from '@db';
import { files, folders } from '@db/schema';
import { eq, isNull, and, like, desc, asc, or } from 'drizzle-orm';
import { validateAuth, isAdmin } from '../middleware/auth';
import * as fileService from '../services/fileService';
import * as folderService from '../services/folderService';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const extension = path.extname(file.originalname);
    const filename = `${uuidv4()}${extension}`;
    cb(null, filename);
  },
});

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, but can be customized later
    cb(null, true);
  },
});

// Get all files with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      folderId,
      search,
      type,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;
    
    const files = await fileService.getFiles({
      folderId: folderId ? String(folderId) : undefined,
      search: search ? String(search) : undefined,
      type: type ? String(type) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 50,
    });
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a specific file by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await fileService.getFile(id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file);
  } catch (error) {
    console.error(`Error fetching file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Download a file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await fileService.getFilePath(id);
    
    if (!result) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const { filePath, file } = result;
    
    // Set the appropriate content type header
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    // Stream the file to the response
    res.sendFile(filePath);
  } catch (error) {
    console.error(`Error downloading file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Upload a file
router.post('/upload', validateAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { 
      folderId,
      description,
      tags,
      relatedEntityId,
      relatedEntityType
    } = req.body;
    
    // If folder ID is provided, verify it exists
    if (folderId && folderId !== 'null') {
      const folder = await folderService.getFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }
    
    // Get file details
    const { filename, originalname, size, mimetype } = req.file;
    const extension = path.extname(originalname).slice(1).toLowerCase(); // Remove leading dot
    
    // Get file type from extension
    const fileType = fileService.getFileTypeFromExtension(extension);
    
    // Create file URL
    const fileUrl = `/uploads/${filename}`;
    
    // Get user ID if available
    const userId = req.user ? req.user.id : null;
    
    // Save file record to database
    const newFile = await fileService.createFile({
      name: originalname,
      url: fileUrl,
      size,
      type: fileType,
      extension,
      folderId: folderId === 'null' ? null : folderId,
      description: description || null,
      tags: tags || null,
      uploadedById: userId,
      uploadedByName: req.user ? req.user.username || `${req.user.firstName} ${req.user.lastName}` : null,
      uploadedByEmail: req.user ? req.user.email : null,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
    });
    
    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up uploaded file if database insertion fails
    if (req.file) {
      const filePath = req.file.path;
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file after failed upload:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update file metadata
router.patch('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, folderId, description, tags } = req.body;
    
    // Validate folder ID if provided
    if (folderId && folderId !== 'null') {
      const folder = await folderService.getFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }
    
    // Update file
    const updatedFile = await fileService.updateFile(id, {
      name,
      folderId,
      description,
      tags,
    });
    
    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(updatedFile);
  } catch (error) {
    console.error(`Error updating file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete a file
router.delete('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Attempt to delete the file
    const deleted = await fileService.deleteFile(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error(`Error deleting file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get files by folder
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Validate folder exists (except for root)
    if (folderId !== 'null' && folderId !== 'root') {
      const folder = await folderService.getFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }
    
    // Get files
    const folderFiles = await fileService.getFilesByFolder(
      folderId === 'null' || folderId === 'root' ? null : folderId
    );
    
    res.json(folderFiles);
  } catch (error) {
    console.error(`Error fetching files for folder ${req.params.folderId}:`, error);
    res.status(500).json({ error: 'Failed to fetch folder files' });
  }
});

export default router;