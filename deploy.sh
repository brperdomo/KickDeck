#!/bin/bash
# Deployment script for Replit

echo "Starting deployment process..."

# Build frontend
echo "Building frontend..."
npx vite build

# Create necessary directories
mkdir -p dist/public
mkdir -p server-deploy

# Create server-deploy/static-server.cjs if it doesn't exist
echo "Creating static server module..."
if [ -f "server-deploy/static-server.cjs" ]; then
  echo "  - Static server module already exists"
else
  echo "  - Creating static-server.cjs module"
  cat > server-deploy/static-server.cjs << 'EOF_STATIC'
/**
 * Configure the server to serve static files in production mode
 * This addresses the specific requirements for Replit deployment
 */
function configureStaticServer(app) {
  const path = require('path');
  const express = require('express');
  
  // Serve static files from the dist/public directory
  const publicPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(publicPath));
  
  // Log configuration
  console.log(`Static files are being served from: ${publicPath}`);
  
  return app;
}

module.exports = {
  configureStaticServer
};
EOF_STATIC
fi

# Create server-deploy/production-server.cjs if it doesn't exist
echo "Creating production server module..."
if [ -f "server-deploy/production-server.cjs" ]; then
  echo "  - Production server module already exists"
else
  echo "  - Creating production-server.cjs module"
  cat > server-deploy/production-server.cjs << 'EOF_PRODUCTION'
/**
 * Configure the server specifically for production deployment on Replit
 */
function configureProductionServer(app) {
  // Add production-specific configurations
  app.set('trust proxy', 1);
  
  // Add security headers
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    });
    next();
  });

  // Add basic API endpoints
  app.get('/api/version', (req, res) => {
    res.json({
      version: '1.0.0',
      environment: 'production',
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
}

module.exports = {
  configureProductionServer
};
EOF_PRODUCTION
fi

# Update the deploy script
if [ -f "deploy.cjs" ]; then
  echo "- Deploy script already exists"
else
  echo "- Creating deploy.cjs"
  cat > deploy.cjs << 'EOF_DEPLOY'
/**
 * CommonJS version of the deploy script for compatibility
 */
const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Ensure the public directory exists
if (!fs.existsSync(path.join('dist', 'public'))) {
  fs.mkdirSync(path.join('dist', 'public'));
}

console.log('Deployment preparation complete');
EOF_DEPLOY
fi

# Ensure we have a working entry point for Replit
echo "Updating Replit deployment entry point..."
cat > replit.cjs << 'EOFCJS'
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
    
    // Session middleware
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
    
    // Serve static files from the 'dist/public' directory
    const publicPath = path.join(__dirname, 'dist', 'public');
    app.use(express.static(publicPath));
    
    // Add a simple diagnostic endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        environment: 'production',
        timestamp: new Date().toISOString()
      });
    });
    
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
      }
    } catch (error) {
      log(`WARNING: Failed to load static server module: ${error.message}`, 'warning');
      console.error(error);
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
    
    // For any other route, serve the index.html (for SPA router)
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
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
EOFCJS

# Create special bridge for server/index.js to solve module type issues
echo "Creating server bridge files..."

# Create a CJS version of the server index for Replit to use
if [ -f "server/index.cjs" ]; then
  echo "  - server/index.cjs already exists"
else
  echo "  - Creating server/index.cjs bridge"
  cat > server/index.cjs << 'EOF_SERVER_BRIDGE'
/**
 * CommonJS entrypoint for server/index.js
 * This file bridges between Replit's deployment environment and our application
 */

// Since Replit runs 'node server/index.js' for deployment,
// we need this CJS wrapper to handle ES modules correctly
console.log('Starting server using CommonJS bridge...');

try {
  // Import the main replit.cjs entry point
  const path = require('path');
  const fs = require('fs');
  
  // Check if replit.cjs exists
  const replitPath = path.join(process.cwd(), 'replit.cjs');
  
  if (fs.existsSync(replitPath)) {
    console.log('Loading production server from replit.cjs');
    // Load the production server configuration
    require('../replit.cjs');
  } else {
    console.error('ERROR: replit.cjs not found!');
    console.error('Please run deployment script first: node deploy-starter.cjs');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
EOF_SERVER_BRIDGE
fi

# Run the deploy.cjs script
echo "Running deployment script..."
node deploy.cjs

echo "Deployment preparation completed successfully."
echo "The application is ready to be deployed on Replit."
echo ""
echo "Files prepared:"
echo "  - replit.cjs: Main entry point for Replit deployment (CommonJS format)"
echo "  - dist/public/: Static assets (built frontend)"
echo "  - server-deploy/: Server modules in CommonJS format"
echo ""
echo "Recommended Replit Run Command: node replit.cjs"
echo ""
echo "To deploy, use the Replit interface to Deploy this repl."