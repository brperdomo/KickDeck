/**
 * REPLIT BRIDGE COMPONENT
 * This serves as a fallback mechanism when both ES Module and CommonJS approaches fail.
 * It implements a layered strategy to maximize deployment success chances.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client } = require('pg');

/**
 * Checks if the build files exist
 * @returns {boolean} Whether the build files exist
 */
function checkBuildExists() {
  const indexHtmlPath = path.join(__dirname, 'dist/public/index.html');
  return fs.existsSync(indexHtmlPath);
}

/**
 * Tests the database connection
 * @returns {Promise<boolean>} Whether the database is connected
 */
async function testDbConnection() {
  console.log('Testing database connection from bridge...');
  
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
 * Creates a fallback error server
 * @param {Error} error The error that occurred during startup
 */
async function createFallbackServer(error) {
  console.error('Creating fallback server due to error:', error);
  
  const app = express();
  const PORT = process.env.PORT || 3000;
  const dbConnected = await testDbConnection();
  const buildExists = checkBuildExists();
  
  // Serve static files if they exist
  if (buildExists) {
    const staticDir = path.join(__dirname, 'dist/public');
    app.use(express.static(staticDir));
    console.log(`Serving static files from: ${staticDir}`);
    
    // SPA fallback
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
      } else {
        res.sendFile(path.join(staticDir, 'index.html'));
      }
    });
  }
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'degraded',
      message: 'Running in fallback mode',
      timestamp: new Date().toISOString(),
      mode: 'Bridge Fallback',
      database: {
        connected: dbConnected
      }
    });
  });
  
  // Deployment status diagnostic endpoint
  app.get('/api/deployment/status', (req, res) => {
    res.json({
      status: 'degraded',
      entryPoint: 'replit-bridge.cjs',
      error: error.message,
      stack: error.stack,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV
      },
      database: {
        connected: dbConnected,
        url: process.env.DATABASE_URL ? '****' : undefined
      },
      frontend: {
        built: buildExists,
        path: buildExists ? path.join(__dirname, 'dist/public') : null
      }
    });
  });
  
  // Other API routes fallback
  app.use('/api', (req, res, next) => {
    if (req.path !== '/health' && req.path !== '/deployment/status') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'The server is running in fallback mode. API functionality is limited.',
        details: error.message
      });
    } else {
      next();
    }
  });
  
  // If no build exists, serve an error page
  if (!buildExists) {
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return next();
      
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Deployment Error</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #e74c3c; }
            pre { background: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .info { background: #f1f1f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Deployment Error</h1>
          <div class="info">
            <p>The application could not be started properly. Please check the logs for more information.</p>
            <p>Server is running in fallback mode with limited functionality.</p>
          </div>
          <h2>Error Details</h2>
          <pre>${error.stack || error.message}</pre>
          <h2>System Information</h2>
          <pre>
Node Version: ${process.version}
Platform: ${process.platform}
Environment: ${process.env.NODE_ENV || 'development'}
Database Connected: ${dbConnected ? 'Yes' : 'No'}
          </pre>
        </body>
        </html>
      `);
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fallback server running on port ${PORT}`);
  });
}

/**
 * Provides bridge functionality for the Replit environment
 */
async function initializeBridge() {
  console.log('Initializing Replit bridge...');
  
  try {
    // First attempt to import ES Module version of index.js
    try {
      // This is a dynamic import which works in newer Node.js versions
      import('./index.js')
        .then(() => {
          console.log('Successfully loaded ES Module version (index.js)');
        })
        .catch(esModuleError => {
          console.error('Failed to load ES Module version (index.js):', esModuleError.message);
          
          // Next try the replit.js ES Module version
          import('./replit.js')
            .then(() => {
              console.log('Successfully loaded ES Module version (replit.js)');
            })
            .catch(replitEsError => {
              console.error('Failed to load ES Module version (replit.js):', replitEsError.message);
              
              // Then try CommonJS versions
              try {
                require('./index.cjs');
                console.log('Successfully loaded CommonJS version (index.cjs)');
              } catch (indexCjsError) {
                console.error('Failed to load CommonJS version (index.cjs):', indexCjsError.message);
                
                try {
                  require('./replit.cjs');
                  console.log('Successfully loaded CommonJS version (replit.cjs)');
                } catch (replitCjsError) {
                  console.error('Failed to load CommonJS version (replit.cjs):', replitCjsError.message);
                  
                  // If all else fails, create a fallback server
                  createFallbackServer(new Error('All module loading attempts failed'));
                }
              }
            });
        });
    } catch (dynamicImportError) {
      console.error('Dynamic import not supported, trying CommonJS versions:', dynamicImportError.message);
      
      // Try CommonJS versions if dynamic import is not supported
      try {
        require('./index.cjs');
        console.log('Successfully loaded CommonJS version (index.cjs)');
      } catch (indexCjsError) {
        console.error('Failed to load CommonJS version (index.cjs):', indexCjsError.message);
        
        try {
          require('./replit.cjs');
          console.log('Successfully loaded CommonJS version (replit.cjs)');
        } catch (replitCjsError) {
          console.error('Failed to load CommonJS version (replit.cjs):', replitCjsError.message);
          
          // If all else fails, create a fallback server
          createFallbackServer(new Error('All module loading attempts failed'));
        }
      }
    }
  } catch (error) {
    console.error('Critical error in bridge initialization:', error);
    createFallbackServer(error);
  }
}

// Initialize the bridge
initializeBridge().catch(error => {
  console.error('Unhandled error in bridge initialization:', error);
  createFallbackServer(error);
});