/**
 * Replit deployment entry point (ES Module version)
 * This file serves as the entry point for Replit deployments
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import pg from 'pg';
import { fileURLToPath } from 'url';

// ES Module dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add JSON parsing middleware
app.use(express.json());

// Test database connection
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

// Add a diagnostic endpoint
function setupDiagnosticEndpoints(app, dbConnected) {
  app.get('/deployment-status', (req, res) => {
    const staticDir = path.join(__dirname, 'dist/public');
    const indexFile = path.join(staticDir, 'index.html');
    
    const diagData = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
      },
      server: {
        port: PORT,
        databaseConnected: dbConnected
      },
      filesystem: {
        staticDirExists: fs.existsSync(staticDir),
        indexFileExists: fs.existsSync(indexFile),
      },
      environmentVariables: {
        databaseUrlSet: !!process.env.DATABASE_URL,
        port: process.env.PORT || '(using default 3000)'
      }
    };
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <html>
        <head>
          <title>Deployment Status - Soccer Management Platform</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #3498db; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto; }
            .status { padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: bold; }
            .success { background: #d4edda; color: #155724; }
            .warning { background: #fff3cd; color: #856404; }
            .error { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <h1>Soccer Management Platform - Deployment Status</h1>
          
          <h2>Overall Status</h2>
          <div class="status ${diagData.server.databaseConnected && diagData.filesystem.indexFileExists ? 'success' : 'error'}">
            ${diagData.server.databaseConnected && diagData.filesystem.indexFileExists ? 'OK' : 'ISSUES DETECTED'}
          </div>
          
          <h2>Diagnostics</h2>
          <ul>
            <li>Database connection: <span class="status ${diagData.server.databaseConnected ? 'success' : 'error'}">${diagData.server.databaseConnected ? 'Connected' : 'Failed'}</span></li>
            <li>Frontend files: <span class="status ${diagData.filesystem.indexFileExists ? 'success' : 'error'}">${diagData.filesystem.indexFileExists ? 'Found' : 'Not found'}</span></li>
          </ul>
          
          <h2>Detailed Information</h2>
          <pre>${JSON.stringify(diagData, null, 2)}</pre>
          
          <h2>Troubleshooting Steps</h2>
          <ol>
            ${!diagData.environmentVariables.databaseUrlSet ? '<li>Set the DATABASE_URL environment variable in Replit Secrets.</li>' : ''}
            ${!diagData.filesystem.indexFileExists ? '<li>Ensure the frontend is built before deployment. Run <code>./deploy-simplified.sh</code> and redeploy.</li>' : ''}
            ${!diagData.server.databaseConnected ? '<li>Check database connection string and ensure the database is running and accessible.</li>' : ''}
          </ol>
        </body>
      </html>
    `);
  });
}

// Main server setup function
async function startServer() {
  // Test database connection first
  const dbConnected = await testDbConnection();
  
  // Add diagnostic endpoints
  setupDiagnosticEndpoints(app, dbConnected);
  
  // Set up static file serving
  const staticDir = path.join(__dirname, 'dist/public');
  
  if (fs.existsSync(staticDir)) {
    console.log(`Serving static files from: ${staticDir}`);
    app.use(express.static(staticDir));
    
    // SPA fallback for client-side routing
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // Skip deployment-status route (already handled)
      if (req.path === '/deployment-status') {
        return;
      }
      
      // Send index.html for all other routes (client-side routing)
      const indexFile = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      
      res.redirect('/deployment-status');
    });
  } else {
    console.warn('Static directory not found:', staticDir);
    app.get('*', (req, res) => {
      // Skip deployment-status route (already handled)
      if (req.path === '/deployment-status') {
        return;
      }
      
      res.redirect('/deployment-status');
    });
  }
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connection: ${dbConnected ? 'Connected' : 'Failed'}`);
    console.log(`Static files: ${fs.existsSync(staticDir) ? 'Found' : 'Not found'}`);
    console.log(`View deployment status at: http://localhost:${PORT}/deployment-status`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
});