import express, { type Express } from "express";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  log("Vite setup temporarily disabled - using static file serving");
  // Temporary bypass - vite setup disabled due to dependency issues
}

export function serveStatic(app: Express) {
  log("Static file serving temporarily disabled");
  // Temporary bypass - static serving disabled due to dependency issues
}

export async function createViteDevServer(app: Express) {
  log("Setting up Vite development server");
  
  // Import Vite dynamically to avoid startup issues
  try {
    const { createServer } = await import('vite');
    
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: './client'
    });
    
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
    
    log("Vite development server initialized successfully");
    return vite;
  } catch (error) {
    log("Vite setup failed, falling back to static serving: " + error);
    
    // Fallback to static file serving
    app.use(express.static('client/dist', { fallthrough: true }));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'client/dist' });
    });
    
    return null;
  }
}