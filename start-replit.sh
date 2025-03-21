#!/bin/bash

# Unified startup script for Replit - handles both dev and production
# This script automatically determines the proper environment and starts the appropriate server

# Make scripts executable
chmod +x deploy-chunked.sh build-frontend.sh

# Check if we're in a production environment (Replit deployment)
if [ "$REPL_SLUG" != "" ] && [ "$REPL_OWNER" != "" ]; then
  echo "✨ Running in Replit production environment"
  export NODE_ENV=production
  
  # Check if we need to deploy first
  if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo "📦 No deployment found. Running deployment script first..."
    ./deploy-chunked.sh
  fi
  
  # Check for frontend build
  if [ ! -f "dist/public/index.html" ] || [ ! -f "dist/public/assets/index.js" ]; then
    echo "⚠️ Frontend assets not found or incomplete."
    echo "A temporary loading page will be displayed."
    echo "Run ./build-frontend.sh to complete the frontend build."
  fi
  
  # Start the production server
  echo "🚀 Starting production server for Replit deployment..."
  node dist/index.js
else
  # We're in development mode
  echo "🔧 Running in development environment"
  
  # Start the development server
  echo "🚀 Starting development server..."
  npm run dev
fi