// Production server initialization module
const express = require('express');
const path = require('path');
const { configureStaticServer } = require('./static-server.cjs');
const { configureDatabaseRoutes } = require('./database.cjs');
const { configureSessionManagement, configureAuthRoutes } = require('./auth.cjs');

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
      }
    });
  });
  
  // Set up database connection indicator endpoint
  app.get('/api/db-status', async (req, res) => {
    try {
      // Test database connection first
      const dbConnected = process.env.DATABASE_URL ? true : false;
      
      res.json({
        status: dbConnected ? 'connected' : 'not_connected',
        message: dbConnected 
          ? 'Database connection is available' 
          : 'No database connection configured (missing DATABASE_URL)',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database check error:', error);
      res.status(500).json({
        status: 'error',
        message: `Database connection error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Configure static file server for production
  configureStaticServer(app);
  
  // Configure database routes
  configureDatabaseRoutes(app);
  
  // Configure session management
  configureSessionManagement(app);
  
  // Configure authentication routes
  configureAuthRoutes(app);
  
  console.log('Production server configuration complete');
  return app;
}

module.exports = { configureProductionServer };