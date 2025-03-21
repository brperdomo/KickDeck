/**
 * ABSOLUTE MINIMAL SERVER ENTRY POINT FOR REPLIT (ES Module version)
 * This file is intentionally kept as simple as possible
 * with no module system complexities or fancy imports.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module dirname compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic server setup for ESM
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
    mode: 'minimal-esm'
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
  console.log(`Minimal ESM server running on http://0.0.0.0:${PORT}`);
});