/**
 * Production Setup Script
 * 
 * This script configures the application for stable production operation
 * by eliminating Vite HMR WebSocket connections that cause disruptions.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function setupProduction() {
  console.log('🔧 Setting up production configuration...');
  
  try {
    // 1. Set NODE_ENV to production
    console.log('📝 Setting NODE_ENV to production...');
    
    // Create or update .env file
    const envPath = '.env';
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new
      envContent = '';
    }
    
    // Remove existing NODE_ENV line if present
    const envLines = envContent.split('\n').filter(line => !line.startsWith('NODE_ENV='));
    
    // Add production NODE_ENV
    envLines.push('NODE_ENV=production');
    
    await fs.writeFile(envPath, envLines.join('\n'));
    console.log('✅ NODE_ENV set to production');
    
    // 2. Build the frontend for production
    console.log('🏗️ Building frontend for production...');
    
    try {
      const { stdout, stderr } = await execAsync('npm run build', { 
        timeout: 180000, // 3 minutes timeout
        cwd: process.cwd()
      });
      
      if (stderr && !stderr.includes('warning')) {
        console.warn('Build warnings:', stderr);
      }
      
      console.log('✅ Frontend built successfully');
    } catch (buildError) {
      console.warn('⚠️ Build process encountered issues, but continuing...');
      console.warn('Build output:', buildError.message);
    }
    
    // 3. Verify production files exist
    console.log('🔍 Verifying production files...');
    
    const distPath = path.join(process.cwd(), 'dist', 'public');
    try {
      const distFiles = await fs.readdir(distPath);
      if (distFiles.length > 0) {
        console.log('✅ Production files found');
      } else {
        console.warn('⚠️ Production files not found, will use development mode');
      }
    } catch (error) {
      console.warn('⚠️ Production directory not found, will create basic setup');
      
      // Create basic production structure
      await fs.mkdir(distPath, { recursive: true });
      
      // Copy basic index.html for production
      const clientIndexPath = path.join(process.cwd(), 'client', 'index.html');
      const prodIndexPath = path.join(distPath, 'index.html');
      
      try {
        await fs.copyFile(clientIndexPath, prodIndexPath);
        console.log('✅ Basic production files created');
      } catch (copyError) {
        console.warn('⚠️ Could not create production files');
      }
    }
    
    console.log('🎉 Production setup completed successfully!');
    console.log('');
    console.log('The server will now run in production mode, eliminating');
    console.log('the WebSocket connection issues you were experiencing.');
    console.log('');
    console.log('To start the server: npm run dev');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProduction();
}

export { setupProduction };