/**
 * Authentication and session management for production deployment
 */
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const path = require('path');

// Create hash function for password verification
function createHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

/**
 * Configure session management for production
 */
function configureSessionManagement(app) {
  console.log('Setting up session management for production...');
  
  // Define session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  };
  
  // Apply session middleware
  app.use(session(sessionConfig));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      // In production, we'll need to fetch the user from the database
      if (process.env.DATABASE_URL) {
        // Database logic would go here - for now, we'll use a simplified approach
        // This would typically use the database module to query the user
        const user = { id, username: 'user' }; // Placeholder
        done(null, user);
      } else {
        done(new Error('No database connection available'), null);
      }
    } catch (error) {
      done(error, null);
    }
  });
  
  console.log('Session management setup complete');
}

/**
 * Configure authentication routes for production
 */
function configureAuthRoutes(app) {
  console.log('Setting up authentication routes for production...');
  
  // Configure local strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // This would be replaced with actual database queries in production
        if (email === 'admin@example.com' && password === 'password123') {
          return done(null, { 
            id: 1, 
            email: 'admin@example.com',
            isAdmin: true
          });
        }
        return done(null, false, { message: 'Invalid credentials' });
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Login route
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ user });
      });
    })(req, res, next);
  });
  
  // Logout route
  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // Current user route
  app.get('/api/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
  
  // Admin check middleware
  const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  };
  
  // Admin-only route example
  app.get('/api/admin/check', isAdmin, (req, res) => {
    res.json({ message: 'Admin access granted', user: req.user });
  });
  
  // Handle SPA routing
  app.get('/login', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
  });
  
  app.get('/register', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
  });
  
  console.log('Authentication routes setup complete');
}

module.exports = {
  configureSessionManagement,
  configureAuthRoutes
};