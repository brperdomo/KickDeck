import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";

export function registerRoutes(app: Express): Server {
  try {
    // Set up authentication routes and middleware
    setupAuth(app);
    log("Authentication routes registered successfully");

    const httpServer = createServer(app);
    return httpServer;
  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}