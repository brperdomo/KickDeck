
# MatchProAI Event Management System

A comprehensive web-based soccer facility and tournament management platform designed to streamline administrative workflows for sports organizations, with advanced event management and communication capabilities.

## Deployment on Replit

This application is configured for easy deployment on Replit. Follow these steps to deploy:

1. Make sure all your changes are committed and the application is working in development mode.
2. Run the deployment starter:
   ```
   node deploy-starter.cjs
   ```
   This will make the deploy.sh script executable and run it.

   Alternatively, you can run the deploy script directly:
   ```
   bash deploy.sh
   ```
3. Hit the "Deploy" button in Replit directly from the Deployment panel.
   - The deployment process will use its default configuration (`node server/index.js`)
   - Our deployment script creates a special bridge file at `server/index.cjs` that redirects to `replit.cjs`

> **Important**: Don't change the Run command in Replit deployment settings. The deployment script creates a special CommonJS bridge at `server/index.cjs` that properly handles the module format conflict.

### What the Deploy Script Does

The `deploy.sh` script prepares the application for production deployment by:

1. Building the frontend with Vite (static files in `dist/public/`)
2. Creating a compatible CommonJS server file (`replit.cjs`) for Replit deployment
3. Creating additional CommonJS modules in `server-deploy/` directory:
   - `static-server.cjs`: Handles static file serving
   - `production-server.cjs`: Configures production-specific settings
   - `database.cjs`: Manages database connections
   - `auth.cjs`: Handles authentication and sessions
4. Setting up everything needed to serve the application in production

### Deployment Structure

- **Frontend**: Built to `dist/public/`
- **Main Entry Point**: `replit.cjs` (CommonJS format for Replit compatibility)
- **Server Modules**: `server-deploy/` directory contains modular CommonJS files
- **Static Assets**: Served directly from `dist/public/`

### Module Format Solution

This deployment solution handles the module format conflict between package.json 
(`"type": "module"`) and Replit's CommonJS requirements by:

1. Using `.cjs` file extension for all deployment-related files to force CommonJS format
2. Providing a set of CommonJS modules for production without altering core application code
3. Creating a proper entry point that bridges the gap between Replit and the application

### Troubleshooting Deployment

If you encounter issues during deployment:

1. Make sure you've run the deployment script: `node deploy-starter.cjs`
2. Verify that `server/index.cjs` exists (this is crucial for handling module format issues)
3. Check if the frontend was properly built by verifying the `dist/public/` directory exists
4. If seeing module errors, try running the deployment script again
5. Verify database connection by visiting `/api/db-status` endpoint after deployment
6. Check server status by visiting `/api/health` or `/_deployment_status` endpoint

#### Common Issues:

**"require is not defined in ES module scope"**: This happens when Node.js tries to use CommonJS in an ES module. Our solution creates a special bridge file (`server/index.cjs`) that handles this conflict automatically. Make sure this file exists by running the deployment script.

**Deployment crashes immediately**: Make sure all steps of the deployment process have been followed, particularly running `node deploy-starter.cjs` before deploying.

### Environment Configuration

The application requires a PostgreSQL database. The database URL should be set in the `.env` file:

```
DATABASE_URL=postgres://username:password@host:port/database
```

## Development

To run the application in development mode:

1. Start the application using the Replit workflow named "Start application"
2. The server will start at `http://localhost:5000`

## Tech Stack

- **Frontend**: React with Vite, Tailwind CSS, Framer Motion
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Key Capabilities**: Multi-role admin management, secure role-based access control, granular permission handling, mobile-responsive design, flexible email configuration

## License

This software is proprietary and subject to the following terms:

1. This software is not for resale or redistribution except by the original author.
2. The software may be resold with customer-specific branding only upon explicit approval from the original author.
3. All rights reserved.

Copyright (c) 2024 MatchProAI

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Third-Party Licenses

This project uses several third-party packages under their respective licenses. See `package.json` for a complete list of dependencies.
