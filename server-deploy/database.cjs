/**
 * Database connection management for production deployment
 */
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database instance
let dbInstance = null;

/**
 * Initialize database connection pool
 */
function initializeDatabase() {
  console.log('Initializing database connection for production...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return null;
  }
  
  try {
    // Create connection pool
    const connectionString = process.env.DATABASE_URL;
    const queryClient = postgres(connectionString, {
      max: 10, // Max number of connections
      idle_timeout: 30, // Idle connection timeout in seconds
      max_lifetime: 60 * 30, // Connection max lifetime in seconds (30 minutes)
      connect_timeout: 15, // Connect timeout in seconds
    });
    
    // Create drizzle instance
    const db = drizzle(queryClient);
    
    // Test connection by running a simple query
    queryClient`SELECT 1 AS result`.then(() => {
      console.log('Database connection successful');
    }).catch(err => {
      console.error('Database connection test failed:', err);
    });
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    return null;
  }
}

/**
 * Get database instance (create if not exists)
 */
function getDatabase() {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}

/**
 * Configure database-related routes for production
 */
function configureDatabaseRoutes(app) {
  console.log('Setting up database routes for production...');
  
  // Database health check route
  app.get('/api/health', async (req, res) => {
    try {
      const db = getDatabase();
      
      if (!db) {
        return res.status(500).json({
          status: 'error',
          message: 'Database not initialized',
          timestamp: new Date().toISOString(),
        });
      }
      
      // Try a simple query to test connectivity
      await db.execute(`SELECT 1 AS result`);
      
      res.json({
        status: 'ok',
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString(),
        database: {
          url: process.env.DATABASE_URL ? '(configured)' : '(not configured)',
        }
      });
    } catch (error) {
      console.error('Database health check error:', error);
      res.status(500).json({
        status: 'error',
        message: `Database health check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Database migration status route (for admin info only)
  app.get('/api/migration-status', async (req, res) => {
    try {
      const db = getDatabase();
      
      if (!db) {
        return res.status(500).json({
          status: 'error',
          message: 'Database not initialized',
        });
      }
      
      // In a real implementation, you'd check migration status from a migrations table
      res.json({
        status: 'ok',
        message: 'Using production database schema',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Migration status check error:', error);
      res.status(500).json({
        status: 'error',
        message: `Migration status check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  console.log('Database routes setup complete');
  return app;
}

module.exports = {
  getDatabase,
  configureDatabaseRoutes
};