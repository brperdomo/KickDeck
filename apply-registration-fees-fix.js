/**
 * Apply Registration Fees Fix
 * 
 * This script adds the safe registration fees middleware to the server setup.
 * It adds proper handling of null/undefined fees in team registration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to important files
const serverRoutesPath = path.join(__dirname, 'server', 'routes.ts');
const middlewarePath = path.join(__dirname, 'server', 'middleware', 'safe-registration-fees.js');

// Check if we already added the middleware
function checkMiddlewareExists() {
  return fs.existsSync(middlewarePath);
}

// Add the middleware import to server/routes.ts
function addMiddlewareImport() {
  if (!fs.existsSync(serverRoutesPath)) {
    console.error(`Server routes file not found at ${serverRoutesPath}`);
    return false;
  }

  let routesContent = fs.readFileSync(serverRoutesPath, 'utf8');

  // Check if the import already exists
  if (routesContent.includes("const safeRegistrationFeesMiddleware")) {
    console.log('Middleware import already exists in routes.ts');
    return true;
  }

  // Add the import at the top of the file
  const importStatement = `import safeRegistrationFeesMiddleware from './middleware/safe-registration-fees.js';\n`;
  
  // Find the last import statement
  const importRegex = /^import .+ from .+;$/m;
  let lastImportMatch;
  let lastImportPos = 0;
  
  const importMatches = routesContent.matchAll(importRegex);
  for (const match of importMatches) {
    lastImportMatch = match;
    lastImportPos = match.index + match[0].length;
  }
  
  if (lastImportPos) {
    // Insert after the last import
    routesContent = routesContent.slice(0, lastImportPos) + '\n' + importStatement + routesContent.slice(lastImportPos);
  } else {
    // If no imports, add at the beginning
    routesContent = importStatement + routesContent;
  }
  
  fs.writeFileSync(serverRoutesPath, routesContent, 'utf8');
  console.log('Added middleware import to routes.ts');
  return true;
}

// Add middleware to app setup in server/routes.ts
function addMiddlewareToApp() {
  if (!fs.existsSync(serverRoutesPath)) {
    console.error(`Server routes file not found at ${serverRoutesPath}`);
    return false;
  }

  let routesContent = fs.readFileSync(serverRoutesPath, 'utf8');

  // Check if the middleware setup already exists
  if (routesContent.includes("app.use(safeRegistrationFeesMiddleware)")) {
    console.log('Middleware setup already exists in routes.ts');
    return true;
  }

  // Find where to insert the middleware (after other middleware but before routes)
  const setupRegex = /app\.use\([^)]+\);(?=\s+\/\/[^]*?routes|$)/m;
  const match = routesContent.match(setupRegex);
  
  if (match) {
    const insertPos = match.index + match[0].length;
    const middlewareSetup = `\napp.use(safeRegistrationFeesMiddleware); // Add safe fee handling middleware\n`;
    
    routesContent = routesContent.slice(0, insertPos) + middlewareSetup + routesContent.slice(insertPos);
    
    fs.writeFileSync(serverRoutesPath, routesContent, 'utf8');
    console.log('Added middleware to app setup in routes.ts');
    return true;
  } else {
    console.error('Could not find suitable location to insert middleware in routes.ts');
    return false;
  }
}

// Main function to apply all fixes
async function applyRegistrationFeesFix() {
  console.log('Starting to apply registration fees fix...');
  
  // Check if middleware exists
  if (!checkMiddlewareExists()) {
    console.error('Middleware file not found. Please create it first.');
    return false;
  }
  
  // Add middleware import
  const importAdded = addMiddlewareImport();
  if (!importAdded) {
    console.error('Failed to add middleware import.');
    return false;
  }
  
  // Add middleware to app setup
  const setupAdded = addMiddlewareToApp();
  if (!setupAdded) {
    console.error('Failed to add middleware to app setup.');
    return false;
  }
  
  console.log('Registration fees fix applied successfully!');
  console.log('Please restart the server for changes to take effect.');
  return true;
}

// Run the function directly
applyRegistrationFeesFix()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error applying fix:', err);
    process.exit(1);
  });

// Export for use in other modules
export { applyRegistrationFeesFix };