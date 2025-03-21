/**
 * ABSOLUTE MINIMAL SERVER ENTRY POINT FOR REPLIT (ES Module version)
 * This file is intentionally kept as simple as possible
 * with no module system complexities or fancy imports.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Tests the database connection
 */
async function testDbConnection() {
  console.log('Testing database connection...');
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return false;
    }
    
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    await client.end();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * Start the server with minimal required functionality
 */
async function startServer() {
  console.log('Starting server with minimal configuration...');
  
  // Test database connection
  const dbConnected = await testDbConnection();
  
  // Add middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Basic health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected
      }
    });
  });
  
  // Serve static files from dist/public
  const staticDir = path.join(__dirname, 'dist/public');
  if (fs.existsSync(staticDir)) {
    console.log(`Serving static files from: ${staticDir}`);
    app.use(express.static(staticDir));
    
    // Single page app fallback
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      const indexFile = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      
      res.status(404).send('Not found');
    });
  } else {
    console.warn('Static directory not found:', staticDir);
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return;
      res.status(500).send('Frontend not built. Please run `npm run build` first.');
    });
  }
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connection: ${dbConnected ? 'Successful' : 'Failed'}`);
  });
}

startServer().catch(error => {
  console.error('Critical server error:', error);
});