#!/bin/bash
# Simplified deployment script for Replit
# This script builds the frontend and prepares all necessary files
# for deployment without modifying protected Replit configurations.

echo "🚀 Starting deployment preparation..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Start with a clean slate
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Build the frontend
echo "🏗️ Building frontend..."
NODE_ENV=production npm run build

# Success message if build succeeded
if [ $? -eq 0 ]; then
  echo "✅ Frontend built successfully!"
else
  echo "❌ Frontend build failed. Please check for errors and try again."
  exit 1
fi

# Check if build artifacts exist
if [ -d "./dist/public" ]; then
  echo "✅ Build artifacts exist in dist/public/"
else
  echo "❌ Build directory not found. Something went wrong with the build process."
  exit 1
fi

# Make sure all deployment scripts are executable
echo "🔑 Making deployment scripts executable..."
chmod +x *.sh

echo "
🎉 Deployment preparation complete! 

To deploy on Replit:
1. Click the 'Deploy' button in the Replit UI
2. Replit will use one of the entry points: index.js, index.cjs, replit.js, replit.cjs, or replit-bridge.cjs

If you face any issues:
- Check the deployment logs
- Visit /deployment-status on your deployed app for diagnostics
- Ensure DATABASE_URL environment variable is set in the Replit Secrets
"

exit 0