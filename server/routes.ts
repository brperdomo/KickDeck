import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

// Simple rate limiting middleware with IP fallback
const rateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const userRequests = requests.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > userRequests.resetTime) {
      userRequests.count = 0;
      userRequests.resetTime = now + windowMs;
    }

    userRequests.count++;
    requests.set(ip, userRequests);

    if (userRequests.count > maxRequests) {
      return res.status(429).send('Too many requests, please try again later.');
    }

    next();
  };
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  try {
    // Apply rate limiting to auth routes
    app.use('/api/login', rateLimit(60 * 1000, 5)); // 5 requests per minute
    app.use('/api/register', rateLimit(60 * 1000, 3)); // 3 requests per minute
    app.use('/api/forgot-password', rateLimit(60 * 1000, 3)); // 3 requests per minute

    // Set up authentication routes and middleware
    setupAuth(app);

    // Handle forgot password requests
    app.post('/api/forgot-password', async (req, res) => {
      const { email } = req.body;

      try {
        // Check if user exists
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Always return a success message, even if the email doesn't exist
        // This prevents email enumeration attacks
        res.json({
          message: "If an account exists with this email, you will receive password reset instructions.",
        });

        if (user) {
          // TODO: In a real application, send an email with a password reset token
          // For now, we just log that we found the user
          log(`Password reset requested for user: ${user.username}`);
        }
      } catch (error) {
        log("Error in forgot password route: " + (error as Error).message);
        res.status(500).json({
          message: "An error occurred while processing your request.",
        });
      }
    });

    log("Authentication routes registered successfully");

    return httpServer;
  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}