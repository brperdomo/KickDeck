#!/bin/bash

# Separate frontend build script for Replit
# Run this after deploy-chunked.sh if the frontend build times out

set -e # Exit on error

echo "------------------------------------------------"
echo "🚀 Starting frontend build process"
echo "------------------------------------------------"

# Ensure build directory exists
mkdir -p dist/public

# Run the Vite build
echo "📦 Building frontend assets with Vite..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "Restart your Replit to see the changes."