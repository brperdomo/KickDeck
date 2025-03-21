#!/bin/bash
# A minimal deployment script for the Replit environment
# This script builds the frontend and prepares the necessary server entry points

echo "Starting simplified deployment process..."

# Build the frontend application
echo "Building frontend application..."
npm run build

# Check if the build succeeded
if [ ! -d "dist/public" ]; then
  echo "ERROR: Frontend build failed! dist/public directory not found."
  exit 1
fi

echo "Frontend build completed successfully."

# Verify our dual entry point approach files
echo "Verifying entry point files..."

check_file() {
  if [ -f "$1" ]; then
    echo "✅ $1 exists"
  else
    echo "❌ ERROR: $1 is missing!"
    exit 1
  fi
}

# Check all required files
check_file "index.js"
check_file "index.cjs"
check_file "replit.js"
check_file "replit.cjs"
check_file "replit-bridge.cjs"

echo "All required entry point files verified."

# Test the database connection with CommonJS bridge file
echo "Testing database connection through CommonJS bridge..."
node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    await client.end();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('Database test completed successfully.');
      process.exit(0);
    } else {
      console.error('Database test failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
"

# Check if test was successful
if [ $? -ne 0 ]; then
  echo "⚠️ Database connection test failed. Please check your DATABASE_URL environment variable."
  echo "Deployment will continue, but app may not function correctly without database."
else
  echo "✅ Database connection test successful."
fi

echo "Deployment preparation completed!"
echo ""
echo "To deploy this application on Replit:"
echo "1. Click the 'Deploy' button in the Replit interface"
echo "2. The application will use multiple entry points for maximum compatibility:"
echo "   - ES Modules: index.js, replit.js"
echo "   - CommonJS: index.cjs, replit.cjs, replit-bridge.cjs"
echo ""
echo "For more information, see REPLIT-DEPLOYMENT-GUIDE.md"