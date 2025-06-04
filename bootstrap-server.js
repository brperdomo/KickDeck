// Bootstrap server to bypass dependency issues
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting server bootstrap process...');

// Start a minimal Express server while resolving dependency issues
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'starting',
    message: 'Soccer facility management platform is initializing...',
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.json({
    message: 'Server is starting up',
    note: 'Please wait while the full application loads...'
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Bootstrap server running on port ${port}`);
  
  // Try to start the real server in the background
  console.log('Attempting to start main TypeScript server...');
  
  // Try with global tsx installation
  const tsxProcess = spawn('npx', ['--yes', 'tsx@latest', 'server/index.ts'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  tsxProcess.stdout.on('data', (data) => {
    console.log('Server output:', data.toString());
  });

  tsxProcess.stderr.on('data', (data) => {
    console.log('Server error:', data.toString());
  });

  tsxProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Main server started successfully, shutting down bootstrap...');
      server.close();
    } else {
      console.log(`Main server failed with code ${code}, keeping bootstrap running`);
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bootstrap server...');
  server.close();
  process.exit(0);
});