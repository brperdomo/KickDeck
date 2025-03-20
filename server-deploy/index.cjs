/**
 * This is a special entry point for server-deploy
 * DO NOT RUN DIRECTLY - this is used by the deployment script
 */
 
// Export specific modules
module.exports = {
  // Export configuration functions
  configureStaticServer: require('./static-server.cjs').configureStaticServer,
  configureProductionServer: require('./production-server.cjs').configureProductionServer,
  configureDatabaseRoutes: require('./database.cjs').configureDatabaseRoutes,
  configureSessionManagement: require('./auth.cjs').configureSessionManagement,
  configureAuthRoutes: require('./auth.cjs').configureAuthRoutes,
};