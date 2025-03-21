/**
 * ABSOLUTE MINIMAL SERVER ENTRY POINT FOR REPLIT (CommonJS version)
 * This file is intentionally kept as simple as possible
 * with no module system complexities or fancy imports.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Basic server setup for CommonJS
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from dist/public if it exists
const staticDir = path.join(__dirname, 'dist/public');
if (fs.existsSync(staticDir)) {
  console.log(`Serving static files from: ${staticDir}`);
  app.use(express.static(staticDir));
}

// Default route for health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'minimal-commonjs'
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send('Server is running, but no frontend files found.');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal CommonJS server running on http://0.0.0.0:${PORT}`);
});