#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

console.log('Resolving dependency installation issues...');

// Force install critical dependencies directly
const criticalDeps = [
  'tsx@4.19.4',
  'vite@5.4.9', 
  'typescript@5.6.3',
  'esbuild@0.24.0',
  '@vitejs/plugin-react@4.3.2',
  'drizzle-kit@0.27.1',
  '@replit/vite-plugin-runtime-error-modal@0.0.3',
  'autoprefixer@10.4.20',
  '@tailwindcss/typography@0.5.15'
];

try {
  console.log('Installing critical dependencies...');
  
  // Install each dependency individually to ensure they're properly resolved
  for (const dep of criticalDeps) {
    console.log(`Installing ${dep}...`);
    try {
      execSync(`npm install ${dep}`, { 
        stdio: 'pipe',
        timeout: 30000
      });
    } catch (error) {
      console.log(`Warning: ${dep} installation had issues, continuing...`);
    }
  }

  console.log('Attempting to start server with tsx...');
  
  // Try multiple approaches to start the server
  const startMethods = [
    // Method 1: Direct npx tsx
    () => {
      return spawn('npx', ['tsx', 'server/index.ts'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
    },
    // Method 2: Node with tsx loader
    () => {
      return spawn('node', ['--loader', 'tsx/esm', 'server/index.ts'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
    },
    // Method 3: Compile and run
    () => {
      console.log('Compiling TypeScript server...');
      execSync('npx esbuild server/index.ts --bundle --platform=node --format=esm --outfile=temp-server.mjs --external:@db --external:@db/schema --packages=external');
      return spawn('node', ['temp-server.mjs'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
    }
  ];

  let serverStarted = false;
  
  for (let i = 0; i < startMethods.length && !serverStarted; i++) {
    try {
      console.log(`Trying start method ${i + 1}...`);
      const serverProcess = startMethods[i]();
      
      // Give the server a moment to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (serverProcess && !serverProcess.killed) {
        console.log('Server started successfully!');
        serverStarted = true;
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          serverProcess.kill('SIGINT');
          process.exit(0);
        });
        
        process.on('SIGTERM', () => {
          serverProcess.kill('SIGTERM');
          process.exit(0);
        });
        
        // Keep the process alive
        serverProcess.on('exit', (code) => {
          process.exit(code || 0);
        });
        
        break;
      }
    } catch (error) {
      console.log(`Start method ${i + 1} failed:`, error.message);
      continue;
    }
  }
  
  if (!serverStarted) {
    console.error('All server start methods failed. There may be a deeper configuration issue.');
    process.exit(1);
  }

} catch (error) {
  console.error('Failed to resolve dependency issues:', error.message);
  process.exit(1);
}