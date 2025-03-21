/**
 * ABSOLUTE MINIMAL SERVER ENTRY POINT FOR REPLIT (CommonJS version)
 * This file is intentionally kept as simple as possible to work around
 * module system compatibility issues on Replit.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection
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

// Main server setup function
async function startServer() {
  // Test database connection first
  const dbConnected = await testDbConnection();
  
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
      
      // Send index.html for all other routes (client-side routing)
      const indexFile = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      
      res.send('Application is running, but frontend files are not found.');
    });
  } else {
    console.warn('Static directory not found:', staticDir);
    app.get('*', (req, res) => {
      res.status(200).send(`
        <html>
          <head>
            <title>Soccer Management Platform</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #3498db; }
              pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto; }
              .success { color: #2ecc71; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>Soccer Management Platform</h1>
            <p>The server is running, but the frontend build was not found.</p>
            
            <h2>Server Status:</h2>
            <ul>
              <li>Database connection: <span class="${dbConnected ? 'success' : 'error'}">${dbConnected ? 'Connected' : 'Failed'}</span></li>
              <li>Frontend files: <span class="error">Not found</span></li>
            </ul>
            
            <p>Run 'npm run build' to build the frontend, then restart the server.</p>
          </body>
        </html>
      `);
    });
  }
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connection: ${dbConnected ? 'Connected' : 'Failed'}`);
    console.log(`Static files: ${fs.existsSync(staticDir) ? 'Found' : 'Not found'}`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
});