/**
 * Entry point for Replit deployment
 * This file bridges between Replit's deployment system and our application
 */

// Use CommonJS style to ensure compatibility
const express = require('express');
const path = require('path');
const { createServer } = require('http');
const fs = require('fs');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

// Function to determine if we can locate the built files
function canLocateBuiltFiles() {
  const publicDir = path.join(__dirname, 'dist', 'public');
  return fs.existsSync(publicDir) && fs.existsSync(path.join(publicDir, 'index.html'));
}

// Simple logger
function log(message, source = "server") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

async function setupServer() {
  try {
    log('Starting Replit deployment server...');
    
    // Check if we have built files
    if (!canLocateBuiltFiles()) {
      log('ERROR: Cannot find built files in dist/public directory', 'error');
      log('Please run the deployment script first: bash deploy.sh', 'error');
      process.exit(1);
    }
    
    const app = express();
    const server = createServer(app);
    
    // Body parsing middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    log('Setting up advanced server components...');
    
    // Load database module
    try {
      const databasePath = path.join(__dirname, 'server-deploy', 'database.cjs');
      
      if (fs.existsSync(databasePath)) {
        log('Loading database module...');
        const database = require('./server-deploy/database.cjs');
        
        // Configure database routes
        if (typeof database.configureDatabaseRoutes === 'function') {
          database.configureDatabaseRoutes(app);
          log('Database routes configured successfully');
          
          // Initialize database connection
          if (typeof database.getDatabase === 'function') {
            const db = database.getDatabase();
            if (db) {
              log('Database connection initialized');
            } else {
              log('WARNING: Database connection could not be initialized', 'warning');
            }
          }
        }
      }
    } catch (error) {
      log(`WARNING: Failed to load database module: ${error.message}`, 'warning');
      console.error(error);
    }
    
    // Load authentication module
    try {
      const authPath = path.join(__dirname, 'server-deploy', 'auth.cjs');
      
      if (fs.existsSync(authPath)) {
        log('Loading authentication module...');
        const auth = require('./server-deploy/auth.cjs');
        
        // Configure session management
        if (typeof auth.configureSessionManagement === 'function') {
          auth.configureSessionManagement(app);
          log('Session management configured successfully');
        }
        
        // Configure authentication routes
        if (typeof auth.configureAuthRoutes === 'function') {
          auth.configureAuthRoutes(app);
          log('Authentication routes configured successfully');
        }
      } else {
        // Fallback to basic session if auth module not available
        log('Authentication module not found, using fallback session setup', 'warning');
        
        // Session middleware (fallback)
        app.use(
          session({
            secret: process.env.SESSION_SECRET || 'production-session-secret',
            resave: false,
            saveUninitialized: false,
            store: new MemoryStore({
              checkPeriod: 86400000 // 24 hours
            }),
            cookie: {
              secure: process.env.NODE_ENV === 'production',
              maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
          })
        );
      }
    } catch (error) {
      log(`WARNING: Failed to load authentication module: ${error.message}`, 'warning');
      console.error(error);
      
      // Fallback to basic session if auth module fails
      app.use(
        session({
          secret: process.env.SESSION_SECRET || 'production-session-secret',
          resave: false,
          saveUninitialized: false,
          store: new MemoryStore({
            checkPeriod: 86400000 // 24 hours
          }),
          cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          }
        })
      );
    }
    
    // Load static server configuration
    try {
      // Import the static server module (should be a CommonJS module)
      const staticServerPath = path.join(__dirname, 'server-deploy', 'static-server.cjs');
      
      if (fs.existsSync(staticServerPath)) {
        log('Loading static server configuration...');
        const staticServer = require('./server-deploy/static-server.cjs');
        
        // Configure the static file server
        if (typeof staticServer.configureStaticServer === 'function') {
          staticServer.configureStaticServer(app);
          log('Static server configured successfully');
        }
      } else {
        // Fallback to basic static serving if module not available
        log('Static server module not found, using fallback static file serving', 'warning');
        const publicPath = path.join(__dirname, 'dist', 'public');
        app.use(express.static(publicPath));
      }
    } catch (error) {
      log(`WARNING: Failed to load static server module: ${error.message}`, 'warning');
      console.error(error);
      
      // Fallback to basic static serving if module fails
      const publicPath = path.join(__dirname, 'dist', 'public');
      app.use(express.static(publicPath));
    }
    
    // Load production server configuration
    try {
      const productionServerPath = path.join(__dirname, 'server-deploy', 'production-server.cjs');
      
      if (fs.existsSync(productionServerPath)) {
        log('Loading production server configuration...');
        const productionServer = require('./server-deploy/production-server.cjs');
        
        // Configure the production server
        if (typeof productionServer.configureProductionServer === 'function') {
          productionServer.configureProductionServer(app);
          log('Production server configured successfully');
        }
      }
    } catch (error) {
      log(`WARNING: Failed to load production server module: ${error.message}`, 'warning');
      console.error(error);
    }
    
    // Add a simple diagnostic endpoint if not already defined
    if (!app._router.stack.some(layer => 
        layer.route && 
        layer.route.path === '/api/health' && 
        layer.route.methods.get)) {
      
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'ok', 
          environment: 'production',
          timestamp: new Date().toISOString(),
          modules: {
            database: fs.existsSync(path.join(__dirname, 'server-deploy', 'database.cjs')),
            auth: fs.existsSync(path.join(__dirname, 'server-deploy', 'auth.cjs')),
            static: fs.existsSync(path.join(__dirname, 'server-deploy', 'static-server.cjs')),
            production: fs.existsSync(path.join(__dirname, 'server-deploy', 'production-server.cjs')),
          }
        });
      });
    }
    
    // For any other route, serve the index.html (for SPA router)
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      
      const publicPath = path.join(__dirname, 'dist', 'public');
      res.sendFile(path.join(publicPath, 'index.html'));
    });
    
    // Error handler
    app.use((err, req, res, next) => {
      log(`ERROR: ${err.message}`, 'error');
      console.error(err);
      res.status(500).json({ error: 'Server error', message: err.message });
    });
    
    // Start the server
    const port = process.env.PORT || 8080;
    const host = process.env.HOST || '0.0.0.0';
    
    return new Promise((resolve) => {
      server.listen(port, host, () => {
        log(`Replit deployment server running at http://${host}:${port}`);
        log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
        log(`Server environment: ${process.env.NODE_ENV || 'production'}`);
        resolve({ app, server });
      });
    });
  } catch (error) {
    log(`Failed to start server: ${error.message}`, 'error');
    console.error(error);
    throw error;
  }
}

// Start the server
setupServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
