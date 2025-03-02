
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if the user is authenticated and is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Not authorized" });
  }

  next();
}

/**
 * Middleware to check if the user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  next();
}
