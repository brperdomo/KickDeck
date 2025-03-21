#!/bin/bash
# Enhanced frontend build script for Replit deployment

set -e  # Exit on error

echo "===== STARTING FRONTEND BUILD PROCESS ====="

# Set NODE_ENV to production for optimized build
export NODE_ENV=production 

# Ensure the build directory exists
mkdir -p dist/public

# Run the Vite build command
echo "Running Vite build..."
npx vite build --outDir dist/public

# Verify the build was created successfully
if [ -f "dist/public/index.html" ]; then
  echo "✅ Frontend build completed successfully!"
  echo "Build files are in dist/public/"
  
  # Count the files in the build directory
  FILE_COUNT=$(find dist/public -type f | wc -l)
  echo "Total files in build: $FILE_COUNT"
  
  # List key files
  echo "Key files:"
  find dist/public -name "index.html" -o -name "*.js" -o -name "*.css" | sort
else
  echo "❌ Frontend build failed - index.html not found in dist/public/"
  echo "Check for errors above."
  exit 1
fi

echo "===== FRONTEND BUILD PROCESS COMPLETED ====="