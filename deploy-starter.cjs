/**
 * Deployment starter script
 * This file is used to begin the deployment process in a reliable way
 * regardless of package.json settings.
 */

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

// Simple logger
function log(message, source = "deploy") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

// Function to execute shell commands
function execCommand(command) {
  try {
    log(`Executing: ${command}`);
    const output = childProcess.execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    log(`Error executing command: ${error.message}`, 'error');
    return false;
  }
}

// Main function
async function main() {
  log('Starting deployment process...');

  // Make sure deploy.sh is executable
  if (fs.existsSync('./deploy.sh')) {
    log('Making deploy.sh executable...');
    execCommand('chmod +x ./deploy.sh');
    
    // Run the deployment script
    log('Running deployment script...');
    const success = execCommand('./deploy.sh');
    
    if (success) {
      log('Deployment script completed successfully');
      
      // Verify key files exist
      const requiredFiles = [
        'replit.cjs',
        'server/index.cjs', // Special bridge file for module format handling
        'server-deploy/static-server.cjs',
        'server-deploy/production-server.cjs'
      ];
      
      let allFilesExist = true;
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          log(`WARNING: Required file ${file} is missing!`, 'warning');
          allFilesExist = false;
        }
      }
      
      if (allFilesExist) {
        log('All required deployment files are present');
      }
      
      // Check for built frontend
      if (fs.existsSync('./dist/public/index.html')) {
        log('Frontend built successfully');
      } else {
        log('WARNING: Frontend build not found at dist/public/index.html', 'warning');
      }
      
      log('');
      log('Deployment preparation complete!');
      log('You can now deploy your application on Replit by clicking the "Deploy" button.');
      log('Make sure your run command is set to: node replit.cjs');
    } else {
      log('Deployment script failed', 'error');
      process.exit(1);
    }
  } else {
    log('ERROR: deploy.sh script not found', 'error');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Deployment failed: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});