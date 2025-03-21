/**
 * Replit deployment bridge file (CommonJS version)
 * This file connects directly to the database and provides minimal API routes
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Basic server setup for CommonJS
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
let dbConnected = false;
let pgClient = null;

// Database connection testing
async function testDbConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    return false;
  }

  try {
    pgClient = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await pgClient.connect();
    await pgClient.query('SELECT NOW()');
    console.log('Database connection successful');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
}

// Middleware
app.use(express.json());

// Serve static files from dist/public if it exists
const staticDir = path.join(__dirname, 'dist/public');
if (fs.existsSync(staticDir)) {
  console.log(`Serving static files from: ${staticDir}`);
  app.use(express.static(staticDir));
}

// Health endpoint for checking deployment
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'bridge-commonjs',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Minimal API routes
app.get('/api/test', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      error: 'Database not connected',
      status: 'error'
    });
  }

  try {
    const result = await pgClient.query('SELECT NOW() as time');
    res.json({
      message: 'API is working correctly',
      databaseTime: result.rows[0].time,
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database query failed',
      message: error.message,
      status: 'error'
    });
  }
});

// SPA fallback route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  res.status(404).send('Replit bridge server: Application files not found');
});

// Start the server after checking database connection
async function startServer() {
  // Test database connection first
  const dbConnected = await testDbConnection();
  console.log(dbConnected ? 'Database connection successful' : 'Running without database connection');

  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Replit bridge server running on http://0.0.0.0:${PORT}`);
    console.log(`Database connection: ${dbConnected ? 'SUCCESS' : 'FAILED'}`);
  });
}

// Initialize the server
startServer().catch(err => {
  console.error('Server startup failed:', err);
  
  // Emergency fallback server
  const emergencyApp = express();
  emergencyApp.get('*', (req, res) => {
    res.status(500).send(`
      <html>
        <head>
          <title>Server Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; }
            h1 { color: #721c24; }
            code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">
              <h1>Emergency Server</h1>
              <p>The application server failed to start due to an error:</p>
              <code>${err.message}</code>
              <p>Check the Replit logs for more details. The standard application server files may be missing or incorrectly built.</p>
            </div>
          </div>
        </body>
      </html>
    `);
  });
  
  emergencyApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Emergency server running on http://0.0.0.0:${PORT}`);
  });
});