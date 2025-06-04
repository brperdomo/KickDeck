#!/usr/bin/env node

// Development server starter that handles TypeScript compilation
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to use tsx if available, otherwise fall back to node with esbuild
async function startServer() {
  try {
    // First try to run with tsx directly
    const serverPath = join(__dirname, 'server', 'index.ts');
    
    const child = spawn('node', [
      '--loader', 'tsx/esm',
      serverPath
    ], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    child.on('error', (err) => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });

  } catch (error) {
    console.error('Error starting development server:', error.message);
    process.exit(1);
  }
}

startServer();