/**
 * Replit deployment entry point (ES Module version)
 * This file serves as the entry point for Replit deployments
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

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
    
    const client = new Client({
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
 * Setup diagnostic endpoints to help troubleshoot deployment issues
 */
function setupDiagnosticEndpoints(app, dbConnected) {
  // Basic health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'ES Module',
      node_version: process.version,
      database: {
        connected: dbConnected
      },
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // Deployment status endpoint
  app.get('/api/deployment/status', (req, res) => {
    // Check if frontend is built
    const publicPath = path.join(__dirname, 'dist/public');
    const indexPath = path.join(publicPath, 'index.html');
    
    const frontendBuilt = fs.existsSync(indexPath);
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      deployment: {
        entry_point: 'replit.js (ES Module)',
        frontend_built: frontendBuilt,
        static_path: publicPath,
        index_found: frontendBuilt
      },
      database: {
        connected: dbConnected,
        url_set: !!process.env.DATABASE_URL
      },
      server: {
        port: PORT,
        node_env: process.env.NODE_ENV || 'development'
      }
    });
  });
}

/**
 * Start the server with replit-specific configuration
 */
async function startServer() {
  console.log('Starting server with Replit configuration (ES Module)...');
  
  // Test database connection
  const dbConnected = await testDbConnection();
  
  // Add middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Setup diagnostic endpoints
  setupDiagnosticEndpoints(app, dbConnected);
  
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
    console.log(`Server running on port ${PORT} (ES Module mode)`);
    console.log(`Database connection: ${dbConnected ? 'Successful' : 'Failed'}`);
    console.log(`Replit environment deployed successfully`);
  });
}

startServer().catch(error => {
  console.error('Critical server error:', error);
});