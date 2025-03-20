
/**
 * Replit production server entry point
 * This file is designed to automatically redirect to our CommonJS implementation for Replit deployment
 */

// Check if we have the deployment bridge files
try {
  const path = require('path');
  const fs = require('fs');
  
  console.log('Production environment detected, loading deployment bridge...');
  
  // First, check if we have the replit.cjs entry point
  const replitPath = path.join(process.cwd(), 'replit.cjs');
  
  if (fs.existsSync(replitPath)) {
    console.log('Found replit.cjs - loading production configuration');
    require('../replit.cjs');
  } else {
    // Check for server/index.cjs bridge
    const bridgePath = path.join(__dirname, 'index.cjs');
    
    if (fs.existsSync(bridgePath)) {
      console.log('Found server/index.cjs - loading bridge');
      require('./index.cjs');
    } else {
      console.error('ERROR: Deployment bridge files not found!');
      console.error('Please run deployment scripts first: node deploy-starter.cjs');
      
      // Fallback to basic express server if bridges not found
      console.log('Starting minimal fallback server...');
      
      const express = require('express');
      const { createServer } = require('http');
      
      const app = express();
      const server = createServer(app);
      
      // Basic health check
      app.get('/', (req, res) => {
        res.send(`
          <html>
            <head><title>Deployment Error</title></head>
            <body>
              <h1>Deployment Configuration Error</h1>
              <p>The application was not properly prepared for deployment.</p>
              <p>Please run the deployment script: <code>node deploy-starter.cjs</code></p>
            </body>
          </html>
        `);
      });
      
      // Health check
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'error', 
          message: 'Deployment not properly configured',
          error: 'Bridge files missing',
          timestamp: new Date().toISOString()
        });
      });
      
      // Start server
      const port = process.env.PORT || 8080;
      server.listen(port, '0.0.0.0', () => {
        console.log(`Fallback server running on port ${port}`);
      });
    }
  }
} catch (error) {
  console.error('Error loading production configuration:', error);
  process.exit(1);
}
