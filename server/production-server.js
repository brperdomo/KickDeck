/**
 * Production server initialization module with flexibility for different module formats
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Configure the server specifically for production deployment on Replit
 */
function configureProductionServer(app) {
  console.log('Configuring server for production mode...');
  
  // Add security headers
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    });
    next();
  });
  
  // Try to load the static-server module from different locations
  let configureStaticServer;
  
  // First try server-deploy directory (production bridge files)
  try {
    if (fs.existsSync(path.join(process.cwd(), 'server-deploy', 'static-server.cjs'))) {
      configureStaticServer = require('../server-deploy/static-server.cjs').configureStaticServer;
      console.log('Loaded static server from server-deploy/static-server.cjs');
    }
  } catch (error) {
    console.error('Error loading static-server from server-deploy:', error.message);
  }
  
  // If not found, try the local file
  if (!configureStaticServer) {
    try {
      configureStaticServer = require('./static-server').configureStaticServer;
      console.log('Loaded static server from server/static-server.js');
    } catch (error) {
      console.error('Error loading static-server from server:', error.message);
    }
  }
  
  // Add a simple diagnostic endpoint
  app.get('/_deployment_status', (req, res) => {
    res.json({
      status: 'running',
      mode: 'production',
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      dirname: __dirname,
      // Environment info (careful not to leak sensitive values)
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '(not set)',
        HOST: process.env.HOST || '(not set)',
        DATABASE_CONNECTED: !!process.env.DATABASE_URL
      },
      // Module info
      modules: {
        staticServer: !!configureStaticServer
      }
    });
  });
  
  // Configure static file server for production
  if (configureStaticServer) {
    configureStaticServer(app);
  } else {
    console.log('WARNING: Static server configuration not found, using fallback');
    
    // Basic fallback for static file serving
    const publicPaths = [
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'dist', 'public')
    ];
    
    for (const staticPath of publicPaths) {
      if (fs.existsSync(staticPath)) {
        console.log(`Using fallback static path: ${staticPath}`);
        app.use(express.static(staticPath));
      }
    }
    
    // Serve SPA fallback
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      for (const basePath of publicPaths) {
        const indexPath = path.join(basePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      
      res.status(404).send('Not found - SPA fallback not available');
    });
  }
  
  console.log('Production server configuration complete');
  return app;
}

module.exports = { configureProductionServer };