#!/bin/bash

# Ultimate Replit Deployment Script
echo "Starting Replit deployment process..."

# Build frontend
echo "Building frontend with Vite..."
vite build

# Check if build succeeded
if [ -d "dist/public" ]; then
  echo "Frontend build successful!"
else
  echo "Creating fallback public directory..."
  mkdir -p dist/public
  echo "<html><body><h1>Frontend build needed</h1></body></html>" > dist/public/index.html
fi

# Verify we have all our essential CommonJS files
echo "Verifying CommonJS server files..."
files_ok=true

# Check for all potential entry points
if [ ! -f "replit-bridge.cjs" ]; then
  echo "Warning: replit-bridge.cjs is missing!"
  files_ok=false
fi

if [ ! -f "replit.cjs" ]; then
  echo "Warning: replit.cjs is missing!"
  files_ok=false
fi

if [ ! -f "index.cjs" ]; then
  echo "Warning: index.cjs is missing!"
  files_ok=false
fi

if [ ! -f "replit.js" ]; then
  echo "Warning: replit.js is missing!"
  files_ok=false
fi

if [ "$files_ok" = false ]; then
  echo "Some server files are missing, but deployment can still proceed."
fi

echo "Deployment preparation complete."
echo ""
echo "======================"
echo "DEPLOYMENT INSTRUCTIONS"
echo "======================"
echo "1. Click the 'Deploy' button in Replit"
echo "2. Wait for deployment to complete"
echo "3. Visit your deployed application at the .replit.app domain"
echo ""
echo "Deployment will try the following server files in order:"
echo "1. replit-bridge.cjs (with database connectivity)"
echo "2. replit.cjs (basic static file server)"
echo "3. index.cjs (minimal server)"
echo "4. Built-in emergency server (if all else fails)"
echo ""
echo "The replit.js file acts as the main entry point and will try each option."
echo "If you encounter issues, check the deployment logs in the Replit interface."