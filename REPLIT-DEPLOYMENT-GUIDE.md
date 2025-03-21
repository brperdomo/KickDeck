# Replit Deployment Guide

This guide explains how to deploy the MatchPro.ai application on Replit, addressing the module compatibility challenges and ensuring reliable deployment.

## Deployment Steps

1. **Prepare the deployment files**

   Run the deployment script:
   ```
   ./deploy-now.sh
   ```
   
   This script:
   - Builds the frontend using Vite
   - Ensures all necessary directories exist
   - Prepares the server for deployment

2. **Check the Replit configuration**

   By default, the Replit configuration should use one of these entry points:
   - `replit-bridge.cjs` (recommended, includes database connection)
   - `replit.cjs` (basic static server)
   - `index.cjs` (minimal server)

   If you need to modify the run command, go to Replit's "Shell" tab and run:
   ```
   echo "node replit-bridge.cjs" > .replit-run
   ```

3. **Deploy to Replit**

   Use the Replit "Deploy" button in the interface to start the deployment process.

## Architecture Overview

The deployment uses a dual approach to handle module compatibility:

- **ES Modules files**: Used during local development (`index.js`, `replit.js`)
- **CommonJS files**: Used for Replit deployment (`index.cjs`, `replit.cjs`, `replit-bridge.cjs`)

The bridge files include fallback mechanisms to ensure the application remains functional even if issues occur.

## Troubleshooting

If you encounter deployment issues:

1. **Check Database Connection**
   - Verify the `DATABASE_URL` environment variable is set in Replit
   - Test the database connection using the health endpoint at `/api/health`

2. **Static File Serving**
   - Ensure frontend files were built correctly (should be in `dist/public/`)
   - Check the server logs for path resolution issues

3. **Module Compatibility**
   - If experiencing "ERR_REQUIRE_ESM" errors, ensure you're using the `.cjs` files

4. **Emergency Server**
   - If all else fails, the bridge includes an emergency fallback server

## Testing the Deployment

After deployment, test the following:

1. **Static Content**: Visit the root URL to verify the React app loads
2. **API Health**: Visit `/api/health` to check server status
3. **Database Connection**: Visit `/api/test` to verify database connectivity

## Contact

If you encounter issues with deployment, check the application logs in the Replit console or contact the development team for assistance.