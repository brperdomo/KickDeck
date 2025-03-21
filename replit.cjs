/**
 * Replit deployment bridge file (CommonJS version)
 * This file serves as the entry point for Replit deployments
 */

const express = require('express');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection first
async function testDbConnection() {
  try {
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

// Start the server
async function startServer() {
  // Test database connection
  const dbConnected = await testDbConnection();
  
  // Configure routes
  
  // Static file serving with fallback
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
      
      const indexPath = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      res.send('Server is running, but frontend index.html file not found.');
    });
  } else {
    console.warn('Static directory not found:', staticDir);
    app.get('*', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Replit Deployment</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #3498db; }
              pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto; }
              .success { color: #2ecc71; }
              .warning { color: #f39c12; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>Replit Deployment (CommonJS)</h1>
            <p>The server is running, but the frontend build was not found.</p>
            
            <h2>Status:</h2>
            <ul>
              <li>Database connection: <span class="${dbConnected ? 'success' : 'error'}">${dbConnected ? 'Connected' : 'Failed'}</span></li>
              <li>Frontend build: <span class="error">Not found</span></li>
            </ul>
            
            <h2>Next Steps:</h2>
            <ol>
              <li>Run <code>npm run build</code> to build the frontend</li>
              <li>Verify the build output is in the <code>dist/public</code> directory</li>
              <li>Ensure <code>DATABASE_URL</code> environment variable is set correctly</li>
            </ol>
          </body>
        </html>
      `);
    });
  }
  
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Replit server (CommonJS) running on http://0.0.0.0:${PORT}`);
    console.log(`Database connection status: ${dbConnected ? 'Connected' : 'Failed'}`);
    console.log(`Static files: ${fs.existsSync(staticDir) ? 'Found' : 'Not found'}`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
});