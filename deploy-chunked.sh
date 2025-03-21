#!/bin/bash

# Chunked deployment script for Replit
# This script breaks down the build process into smaller, more manageable steps
# to avoid timeouts on Replit's resource-constrained environment

set -e # Exit on error

echo "---------------------------------------------"
echo "🚀 Starting chunked Replit deployment process"
echo "---------------------------------------------"

# Step 1: Set up directories
echo "📁 Setting up directories..."
mkdir -p dist/server
mkdir -p dist/db
mkdir -p dist/db/schema
mkdir -p dist/public

# Step 2: Server-side compilation (fastest, do this first)
echo "🔄 Compiling server files..."
npx esbuild server/prod-server.ts --format=esm --platform=node --outfile=dist/server/prod-server.js

# Step 3: Database files compilation
echo "🔄 Compiling database files..."
npx esbuild db/index.ts --format=esm --platform=node --outfile=dist/db/index.js
npx esbuild db/schema.ts --format=esm --platform=node --outfile=dist/db/schema.js
npx esbuild db/schema/emailTemplates.ts --format=esm --platform=node --outfile=dist/db/schema/emailTemplates.js

# Step 4: Fix imports to use relative paths rather than aliases
echo "🔧 Fixing module imports..."
for file in dist/server/prod-server.js dist/db/index.js dist/db/schema.js dist/db/schema/emailTemplates.js; do
  # Replace @db/schema with ../db/schema
  sed -i 's|from "@db/schema"|from "../db/schema.js"|g' $file
  sed -i 's|from "db"|from "../db/index.js"|g' $file
  # Fix directory imports (must point to specific file)
  sed -i 's|from "../db/schema"|from "../db/schema.js"|g' $file
  echo "Fixed imports in $file"
done

# Step 5: Create server entry point
echo "📝 Creating server entry point..."
cat > dist/index.js << 'EOF'
import { createServer } from 'http';
import express from 'express';
import { setupServer } from './server/prod-server.js';

// Initialize Express application
const app = express();
const server = createServer(app);

console.log('Starting production server...');
setupServer(app, server)
  .then(() => {
    // Get port from environment or use default
    const port = process.env.PORT || 3000;
    
    // Start listening
    server.listen(port, '0.0.0.0', () => {
      console.log(`Production server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });
EOF

# Step 6: Create a minimal index.html to avoid white screen
echo "📄 Creating temporary index.html..."
cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MatchPro.ai - Loading...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      background-color: #f5f7fa;
      color: #333;
    }
    .loading-container {
      max-width: 500px;
      padding: 30px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin-top: 0;
      color: #3182ce;
    }
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
    .spinner {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #3182ce;
      animation: spin 1s ease-in-out infinite;
      margin: 20px 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading-container">
    <img src="/logo.png" alt="MatchPro.ai Logo" class="logo" onerror="this.style.display='none'">
    <h1>MatchPro.ai</h1>
    <div class="spinner"></div>
    <p>The application is loading or being deployed...</p>
    <p>If this page persists for more than a few minutes, please check the deployment logs.</p>
  </div>
</body>
</html>
EOF

# Copy logo if available
if [ -f "client/public/logo.png" ]; then
  cp client/public/logo.png dist/public/
fi

echo "✅ Server-side deployment completed successfully!"
echo ""
echo "---------------------------------------------"
echo "Starting frontend build process..."
echo "This may take several minutes and could timeout."
echo "If it does timeout, the server will still function"
echo "with a loading page until the frontend is built separately."
echo "---------------------------------------------"

# Step 7: Attempt frontend build, but continue even if it fails
npm run build || {
  echo "⚠️ Frontend build timed out or failed."
  echo "Server-side deployment was successful."
  echo "To complete frontend deployment, run './build-frontend.sh' separately."
  # Create the frontend build script
  cat > build-frontend.sh << 'EOF'
#!/bin/bash
echo "Building frontend assets..."
npm run build
echo "Frontend build complete! Restart your Replit to see changes."
EOF
  chmod +x build-frontend.sh
  exit 0
}

echo "✅ Full deployment completed successfully!"