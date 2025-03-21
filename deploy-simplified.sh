#!/bin/bash
# Simplified deployment script for Replit

set -e  # Exit on error

echo "===== STARTING SIMPLIFIED DEPLOYMENT PROCESS ====="

# Make all scripts executable
chmod +x make-executable.sh
./make-executable.sh

# Build the frontend
echo "Building frontend..."
chmod +x build-frontend.sh
./build-frontend.sh

# Ensure server directory exists
mkdir -p dist/server

# Copy server files
echo "Setting up server files..."
cp -v index.js dist/
cp -v index.cjs dist/
cp -v replit.js dist/
cp -v replit.cjs dist/
cp -v replit-bridge.cjs dist/

# Copy readme and deployment guides
cp -v README.md dist/
cp -v SIMPLIFIED-DEPLOYMENT.md dist/

# Copy database connection configuration
mkdir -p dist/db
cp -v db/index.js dist/db/
cp -v db/index.cjs dist/db/ 2>/dev/null || :  # Ignore if file doesn't exist

# Create simple node server
cat > dist/server.js << 'EOL'
/**
 * Simple server entry point for deployment
 */
try {
  console.log("Starting server via bridge...");
  require('./replit-bridge.cjs');
} catch (error) {
  console.error("Critical error in server startup:", error);
  process.exit(1);
}
EOL

# Create package.json for deployment
cat > dist/package.json << 'EOL'
{
  "name": "soccer-platform-deployment",
  "version": "1.0.0",
  "description": "Soccer Platform Deployment Package",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOL

echo "===== DEPLOYMENT FILES PREPARED ====="
echo "Your application is ready for deployment."
echo "To deploy:"
echo "1. Commit your changes"
echo "2. Use the Replit deployment interface to deploy your application"
echo ""
echo "Files are prepared in the dist/ directory"
echo "===== DEPLOYMENT PROCESS COMPLETED ====="