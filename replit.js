/**
 * Replit deployment bridge file (ES Module version)
 * This file serves as the entry point for Replit deployments
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// ES Module dirname compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a PostgreSQL client
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// Function to test the database connection
async function testDbConnection() {
  try {
    await client.connect();
    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    return false;
  }
}

// Start a minimal express server for Replit deployment
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Test database connection
  const dbConnected = await testDbConnection();
  console.log(`Database connection: ${dbConnected ? 'SUCCESS' : 'FAILED'}`);
  
  // Basic middleware
  app.use(express.json());
  
  // Serve static files
  const staticDir = path.join(__dirname, 'dist/public');
  if (fs.existsSync(staticDir)) {
    console.log(`Serving static files from: ${staticDir}`);
    app.use(express.static(staticDir));
  } else {
    console.error(`Static directory not found: ${staticDir}`);
  }
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      dbConnected,
      mode: 'esm'
    });
  });
  
  // Catch-all route for the SPA
  app.get('*', (req, res) => {
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    res.send('Server is running in ESM mode, but no frontend files were found.');
  });
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Replit ESM server running on http://0.0.0.0:${PORT}`);
  });
}

// Initialize the server
startServer().catch(err => {
  console.error('Failed to start the server:', err);
});