/**
 * Replit deployment bridge (CommonJS version)
 * This file handles the connection between Replit deployments
 * and our application, working around module system challenges.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection - critical for deployment
async function testDbConnection() {
  console.log("Testing database connection...");
  
  // Verify we have DATABASE_URL set
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable not set!");
    return false;
  }

  try {
    // Create and test a PostgreSQL connection
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    
    // Close the test connection
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Check if build files exist
function checkBuildExists() {
  const staticDir = path.join(__dirname, 'dist/public');
  const indexFile = path.join(staticDir, 'index.html');
  
  if (fs.existsSync(staticDir) && fs.existsSync(indexFile)) {
    return true;
  }
  return false;
}

// Status details page to diagnose deployment issues
function setupStatusRoutes(app, dbStatus) {
  // Add a diagnostic endpoint
  app.get('/deployment-status', (req, res) => {
    const buildExists = checkBuildExists();
    
    res.send(`
      <html>
        <head>
          <title>Deployment Status</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #3498db; margin-bottom: 10px; }
            h2 { margin-top: 30px; color: #2c3e50; }
            .status { display: flex; align-items: center; margin-bottom: 10px; }
            .indicator { display: inline-block; width: 20px; height: 20px; border-radius: 50%; margin-right: 10px; }
            .success { background-color: #2ecc71; }
            .warning { background-color: #f39c12; }
            .error { background-color: #e74c3c; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto; }
            code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 14px; }
            .card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <h1>Deployment Status</h1>
          <p>This diagnostic page shows the current status of your application deployment.</p>
          
          <div class="card">
            <h2>Critical Components</h2>
            
            <div class="status">
              <span class="indicator ${dbStatus ? 'success' : 'error'}"></span>
              <strong>Database Connection:</strong> ${dbStatus ? 'Connected' : 'Failed'} 
            </div>
            
            <div class="status">
              <span class="indicator ${buildExists ? 'success' : 'error'}"></span>
              <strong>Frontend Build:</strong> ${buildExists ? 'Found' : 'Not found'}
            </div>
            
            <div class="status">
              <span class="indicator success"></span>
              <strong>Server Status:</strong> Running
            </div>
          </div>
          
          <div class="card">
            <h2>Environment</h2>
            <pre><code>Node Version: ${process.version}
Platform: ${process.platform}
Architecture: ${process.arch}
Database URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Not set'}
PORT: ${process.env.PORT || '3000 (default)'}</code></pre>
          </div>
          
          ${!buildExists ? `
          <div class="card">
            <h2>Missing Build</h2>
            <p>The frontend build files could not be found. To fix this issue:</p>
            <ol>
              <li>Run <code>npm run build</code> to build the frontend</li>
              <li>Verify that files exist in <code>dist/public</code> directory</li>
              <li>Redeploy the application</li>
            </ol>
          </div>
          ` : ''}
          
          ${!dbStatus ? `
          <div class="card">
            <h2>Database Connection Issue</h2>
            <p>The application could not connect to the database. To fix this issue:</p>
            <ol>
              <li>Verify that the <code>DATABASE_URL</code> environment variable is set correctly</li>
              <li>Check if your database is running and accessible</li>
              <li>Ensure that database credentials are correct</li>
            </ol>
          </div>
          ` : ''}
        </body>
      </html>
    `);
  });
}

// Main function to start the bridge
async function startBridge() {
  console.log("Starting Replit deployment bridge...");
  
  // Test database connection
  const dbConnected = await testDbConnection();
  
  // Setup diagnostic routes
  setupStatusRoutes(app, dbConnected);
  
  // Try to serve static files if they exist
  const staticDir = path.join(__dirname, 'dist/public');
  if (fs.existsSync(staticDir)) {
    console.log(`Serving static files from: ${staticDir}`);
    app.use(express.static(staticDir));
    
    // Fallback route for SPA
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      const indexPath = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      
      // Fallback if index.html can't be found
      res.redirect('/deployment-status');
    });
  } else {
    console.warn('⚠️ Static directory not found:', staticDir);
    
    // Redirect all routes to status page if no static files
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      res.redirect('/deployment-status');
    });
  }
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Replit bridge server running on port ${PORT}`);
    console.log(`Database connection: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Static files: ${checkBuildExists() ? '✅ Found' : '❌ Not found'}`);
    console.log(`Diagnostic page: http://localhost:${PORT}/deployment-status`);
  });
}

// Initialize the bridge
startBridge().catch(err => {
  console.error('Failed to start bridge server:', err);
});