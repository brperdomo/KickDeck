/**
 * SIMPLIFIED COMMONJS ENTRY POINT FOR REPLIT
 * This file is intentionally kept as simple as possible
 * with no module system complexities or fancy imports.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client } = require('pg');

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
 * Start the server with minimal required functionality
 */
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Test database connection first
  const dbConnected = await testDbConnection();
  
  // Setup JSON parsing middleware
  app.use(express.json());
  
  // Serve static files if they exist
  const staticDir = path.join(__dirname, 'dist/public');
  if (fs.existsSync(path.join(staticDir, 'index.html'))) {
    console.log(`Serving static files from: ${staticDir}`);
    app.use(express.static(staticDir));
  } else {
    console.warn('Warning: Static files not found in dist/public');
  }
  
  // Basic health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'CommonJS',
      database: {
        connected: dbConnected
      }
    });
  });
  
  // Deployment status diagnostic endpoint
  app.get('/api/deployment/status', (req, res) => {
    const staticFilesExist = fs.existsSync(path.join(staticDir, 'index.html'));
    
    res.json({
      status: 'operational',
      entryPoint: 'index.cjs',
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
        built: staticFilesExist,
        path: staticDir
      }
    });
  });
  
  // API routes fallback for when API server module didn't load
  app.use('/api', (req, res, next) => {
    if (req.path !== '/health' && req.path !== '/deployment/status') {
      res.status(502).json({
        error: 'API server not initialized',
        message: 'The server is running in fallback mode. API functionality is limited.'
      });
    } else {
      next();
    }
  });
  
  // Catch-all route for SPA
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.status(404).send('Application not found. Please check your deployment.');
    }
  });
  
  // Start the server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (CommonJS mode)`);
  });
  
  // Handle shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  return { app, server };
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});