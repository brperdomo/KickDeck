/**
 * Bootstrap Server Script
 * 
 * This script resolves dependency issues and starts the server properly.
 * It checks for missing packages and installs them before starting.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function checkPackageExists(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (e) {
    return false;
  }
}

function installMissingPackages() {
  const missingPackages = [];
  
  // Check critical packages
  const criticalPackages = ['vite', 'tsx', 'express', 'typescript'];
  
  for (const pkg of criticalPackages) {
    if (!checkPackageExists(pkg)) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.log(`Missing packages detected: ${missingPackages.join(', ')}`);
    console.log('Installing missing packages...');
    
    const installProcess = spawn('npm', ['install', ...missingPackages], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Packages installed successfully');
        startServer();
      } else {
        console.error('Package installation failed');
        process.exit(1);
      }
    });
  } else {
    startServer();
  }
}

function startServer() {
  console.log('Starting server...');
  
  // Try to start with tsx first, fallback to node if needed
  if (checkPackageExists('tsx')) {
    const serverProcess = spawn('node', ['--import', 'tsx', 'server/index.ts'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: '--import tsx' }
    });
    
    serverProcess.on('error', (err) => {
      console.error('Server startup failed:', err);
      // Fallback to minimal server
      startMinimalServer();
    });
  } else {
    startMinimalServer();
  }
}

function startMinimalServer() {
  console.log('Starting minimal server...');
  
  const serverProcess = spawn('node', ['server/minimal-server.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  serverProcess.on('error', (err) => {
    console.error('Minimal server startup failed:', err);
    process.exit(1);
  });
}

// Start the bootstrap process
console.log('Bootstrapping server...');
installMissingPackages();